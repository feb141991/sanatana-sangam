import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { fixtureDatabase, type FixtureRow } from './fixtures/narrow-read-database';
const mock = vi.hoisted(() => ({ client: null as unknown, user: { id: 'viewer' } as { id: string } | null }));
vi.mock('@/lib/api-auth', () => ({ getApiUser: async () => ({ user: mock.user, supabase: mock.client, error: null }),
  getApiAuthFailureResponse: (_error: unknown, headers: HeadersInit) => new Response('{}', { status: 401, headers }) }));
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => mock.client }));
import { GET as oldProgress } from '@/app/api/native/progress/route';
import { GET as shields } from '@/app/api/native/progress/shields/route';
import { GET as oldRoster } from '@/app/api/dharm-veer/roster/route';
import { GET as detail } from '@/app/api/dharm-veer/detail/route';
import { DHARM_VEERS } from '@/lib/dharm-veer';

const request = (path: string) => new NextRequest(`https://example.com${path}`);
const date = (offset: number) => new Date(Date.UTC(2026, 9, 30-offset)).toISOString().slice(0,10);
function fixtures() {
  const stories: FixtureRow[] = Array.from({ length: Math.max(400, DHARM_VEERS.length) }, (_,i) => ({
    slug: `fixture-${i}`, name: `Synthetic fixture ${i}`, tradition: ['hindu','sikh','buddhist','jain'][i%4], review_status: 'approved',
    day_index: String(i).padStart(4,'0'), created_at: date(0), tagline: 'Synthetic transport fixture',
    journey: 'fixture journey '.repeat(100), trial: 'fixture trial '.repeat(80), teaching: 'fixture teaching '.repeat(80), moral: 'fixture moral '.repeat(40),
  }));
  return {
    profiles: [{ id: 'viewer', full_name: 'Fixture', username: 'fixture', karma_points: 1 }],
    daily_sadhana: Array.from({length: 200}, (_,i) => ({ user_id: 'viewer', date: date(i), streak_count: i===0 ? 21 : 1, japa_done: true })),
    mala_sessions: Array.from({length: 1205}, (_,i) => ({ user_id: 'viewer', id: `s-${i}`, created_at: `${date(i%400)}T12:00:00Z`, count: 108, rounds: 1, duration_seconds: 300 })),
    nitya_karma_log: Array.from({length: 182*7}, (_,i) => ({ user_id: 'viewer', log_date: date(Math.floor(i/7)) })),
    karma_ledger: Array.from({length: 90}, (_,i) => ({user_id:'viewer', created_at:`${date(i%30)}T12:00:00Z`, reason:'fixture',amount:5})),
    quiz_responses: Array.from({length:30},(_,i)=>({user_id:'viewer',date:date(i),is_correct:true})),
    dharm_veers: stories,
  };
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-30T12:00:00Z')); mock.user = { id: 'viewer' }; });
afterEach(() => vi.useRealTimers());

describe('narrow screen reads (synthetic fixture, not live latency)', () => {
  it('preserves Shield values while reducing DB queries and transferred history', async () => {
    const db = fixtureDatabase(fixtures()); mock.client = db;
    const oldResponse = await oldProgress(request('/api/native/progress'));
    const oldBody = await oldResponse.text(); const old = JSON.parse(oldBody);
    const before = [...db.traces]; db.traces.length = 0;
    const response = await shields(request('/api/native/progress/shields'));
    const body = await response.text(); const payload = JSON.parse(body);
    expect(payload).toEqual({ latestStreakCount: [...old.sadhana182d].sort((a,b)=>b.date.localeCompare(a.date))[0].streak_count, totalJapaSessions: old.totalJapaSessions });
    expect(payload.totalJapaSessions).toBe(1205);
    expect(before).toHaveLength(7); expect(db.traces).toHaveLength(2);
    expect(db.traces.map(t=>t.rows)).toEqual([1,0]);
    expect(response.headers.get('Server-Timing')).toMatch(/auth;dur=.*query;dur=.*total;dur=/);
    console.log(JSON.stringify({fixture:'synthetic-shields',oldQueries:before.length,newQueries:db.traces.length,oldRows:before.reduce((n,t)=>n+t.rows,0),newRows:db.traces.reduce((n,t)=>n+t.rows,0),oldBytes:Buffer.byteLength(oldBody),newBytes:Buffer.byteLength(body)}));
  });
  it('returns the same approved story with one row instead of full roster', async () => {
    const db = fixtureDatabase(fixtures()); mock.client = db;
    const oldBody = await (await oldRoster(request('/api/dharm-veer/roster'))).text();
    const before = [...db.traces]; db.traces.length = 0;
    const response = await detail(request('/api/dharm-veer/detail?id=fixture-250'));
    const body = await response.text();
    expect(JSON.parse(body).hero).toEqual(JSON.parse(oldBody).roster.find((hero: { id: string })=>hero.id==='fixture-250'));
    expect(db.traces).toHaveLength(1); expect(db.traces[0].rows).toBe(1);
    console.log(JSON.stringify({fixture:'synthetic-dharm-veer',oldQueries:before.length,newQueries:db.traces.length,oldRows:before.reduce((n,t)=>n+t.rows,0),newRows:1,oldBytes:Buffer.byteLength(oldBody),newBytes:Buffer.byteLength(body)}));
  });
  it('requires auth and uses only the authenticated user for Shields', async () => {
    const tables = fixtures(); tables.daily_sadhana.push({user_id:'other',date:date(0),streak_count:999,japa_done:true});
    const db=fixtureDatabase(tables);mock.client=db;
    expect(await (await shields(request('/api/native/progress/shields?userId=other'))).json()).toMatchObject({latestStreakCount:21});
    db.traces.length=0;mock.user=null;
    expect((await shields(request('/api/native/progress/shields'))).status).toBe(401);expect(db.traces).toHaveLength(0);
  });
  it('does not turn read errors into zero earned shields', async () => {
    for(const table of ['daily_sadhana','mala_sessions']) {
      mock.client=fixtureDatabase(fixtures(),new Set([table]));
      expect((await shields(request('/api/native/progress/shields'))).status).toBe(503);
    }
  });
  it('uses the latest streak in the 182-day window, ignores future/out-of-window rows, and handles empty data', async () => {
    const tables=fixtures();tables.daily_sadhana=[{user_id:'viewer',date:date(181),streak_count:7,japa_done:true},{user_id:'viewer',date:date(182),streak_count:99,japa_done:true},{user_id:'viewer',date:date(-1),streak_count:888,japa_done:true}];
    mock.client=fixtureDatabase(tables);
    expect(await (await shields(request('/api/native/progress/shields'))).json()).toMatchObject({latestStreakCount:7});
    tables.daily_sadhana=[];tables.mala_sessions=[];mock.client=fixtureDatabase(tables);
    expect(await (await shields(request('/api/native/progress/shields'))).json()).toEqual({latestStreakCount:0,totalJapaSessions:0});
  });
  it('does not publish unapproved content or scan the legacy daily table', async () => {
    const tables=fixtures();tables.dharm_veers[0].review_status='pending_review';
    const db=fixtureDatabase(tables);mock.client=db;
    const response=await detail(request('/api/dharm-veer/detail?id=fixture-0'));
    expect(response.status).toBe(200);expect(await response.json()).toEqual({hero:null});expect(db.traces.map(t=>t.table)).toEqual(['dharm_veers']);
  });
  it('preserves bundled story fallback but exposes DB failures as retryable', async () => {
    mock.client=fixtureDatabase({dharm_veers:[]});
    expect(await (await detail(request(`/api/dharm-veer/detail?id=${DHARM_VEERS[0].id}`))).json()).toEqual({hero:DHARM_VEERS[0]});
    mock.client=fixtureDatabase(fixtures(),new Set(['dharm_veers']));
    expect((await detail(request('/api/dharm-veer/detail?id=fixture-1'))).status).toBe(503);
  });
  it.each(['','id=../../private','id=a&id=b'])('rejects invalid detail query %s',async query=>{
    const db=fixtureDatabase(fixtures());mock.client=db;
    expect((await detail(request(`/api/dharm-veer/detail?${query}`))).status).toBe(400);expect(db.traces).toHaveLength(0);
  });
});
