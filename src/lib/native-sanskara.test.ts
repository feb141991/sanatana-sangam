import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { SANSKARA_ACTIONS, findSanskaraAction, mapSanskaraError, queryToInput } from './native-sanskara';

const R = '11111111-1111-4111-8111-111111111111'; // a request id
const S = '22222222-2222-4222-8222-222222222222'; // a subject
const REC = '33333333-3333-4333-8333-333333333333'; // a record
const ACC = '44444444-4444-4444-8444-444444444444'; // an account
const TREE = '55555555-5555-4555-8555-555555555555'; // a Kul tree person
const TOKEN = 'ab'.repeat(32);

const parse = (name: string, input: Record<string, unknown>) => findSanskaraAction(name)!.parse(input);

describe('the action table', () => {
  const names = Object.keys(SANSKARA_ACTIONS);

  it('has six reads and seventeen writes', () => {
    expect(names.filter((n) => SANSKARA_ACTIONS[n].method === 'GET')).toHaveLength(6);
    expect(names.filter((n) => SANSKARA_ACTIONS[n].method === 'POST')).toHaveLength(17);
  });

  it('only names functions that exist in the generated database types', () => {
    const types = readFileSync('src/types/database.generated.ts', 'utf8');
    for (const name of names) {
      const rpc = SANSKARA_ACTIONS[name].rpc;
      expect(types.includes(`\n      ${rpc}: {`), `${name} -> ${rpc}`).toBe(true);
    }
  });

  it('never maps two actions to the same function', () => {
    const rpcs = names.map((n) => SANSKARA_ACTIONS[n].rpc);
    expect(new Set(rpcs).size).toBe(rpcs.length);
  });

  it('refuses every write that has no request id, and says which field', () => {
    for (const name of names.filter((n) => SANSKARA_ACTIONS[n].method === 'POST')) {
      expect(parse(name, {}), name).toEqual({ ok: false, field: 'requestId' });
    }
  });

  it('refuses a key it does not know, on every action', () => {
    for (const name of names) {
      // A write carries a request id and a read does not, so each gets the one key that is legitimate for it.
      const base = SANSKARA_ACTIONS[name].method === 'POST' ? { requestId: R } : {};
      expect(parse(name, { ...base, smuggled: 1 }), name).toEqual({ ok: false, field: 'smuggled' });
    }
  });

  it('refuses a request id on a read, so a read can never be mistaken for an idempotent write', () => {
    for (const name of names.filter((n) => SANSKARA_ACTIONS[n].method === 'GET')) {
      expect(parse(name, { requestId: R }), name).toEqual({ ok: false, field: 'requestId' });
    }
  });

  it('does not resolve prototype names as actions', () => {
    for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', '', 'Timeline', 'timeline ']) {
      expect(findSanskaraAction(name), name).toBeNull();
    }
  });
});

describe('reads', () => {
  it('take no input except the subject of an access list', () => {
    for (const name of ['timeline', 'dependents', 'shared-with-me', 'reminders', 'export']) {
      expect(parse(name, {}), name).toEqual({ ok: true, args: {} });
    }
    expect(parse('access', {})).toEqual({ ok: false, field: 'subject' });
    expect(parse('access', { subject: S })).toEqual({ ok: true, args: { p_subject: S } });
    expect(parse('access', { subject: ['a', 'b'] })).toEqual({ ok: false, field: 'subject' });
  });

  it('turns a query string into the same input shape, repeated keys becoming arrays', () => {
    expect(queryToInput(new URLSearchParams(`subject=${S}`))).toEqual({ subject: S });
    expect(queryToInput(new URLSearchParams(`subject=${S}&subject=${S}`))).toEqual({ subject: [S, S] });
    expect(parse('access', queryToInput(new URLSearchParams(`subject=${S}&subject=${S}`)))).toEqual({ ok: false, field: 'subject' });
  });
});

describe('create-dependent', () => {
  const good = { requestId: R, name: '  Asha  ', birthDate: '2024-03-04' };

  it('trims the name and sends only what it was given', () => {
    expect(parse('create-dependent', good)).toEqual({
      ok: true,
      args: { p_request_id: R, p_name: 'Asha', p_birth_date: '2024-03-04' },
    });
  });

  it('adds the tree person only when one is supplied, and lower-cases the id', () => {
    const withTree = parse('create-dependent', { ...good, kulFamilyMemberId: TREE.toUpperCase() });
    expect(withTree).toEqual({ ok: true, args: { p_request_id: R, p_name: 'Asha', p_birth_date: '2024-03-04', p_kul_family_member: TREE } });
    expect(parse('create-dependent', { ...good, kulFamilyMemberId: null })).toEqual(parse('create-dependent', good));
    expect(parse('create-dependent', { ...good, kulFamilyMemberId: 'not-a-uuid' })).toEqual({ ok: false, field: 'kulFamilyMemberId' });
  });

  it('refuses the incident string and every other date that is not a real YYYY-MM-DD', () => {
    for (const bad of ['18081991', '2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10', '2026-2-3', '2026/02/03', '03-02-2026', '', '   ', 20260203, null, undefined, {}, ['2026-02-03']]) {
      expect(parse('create-dependent', { ...good, birthDate: bad }), String(JSON.stringify(bad))).toEqual({ ok: false, field: 'birthDate' });
    }
    expect(parse('create-dependent', { ...good, birthDate: '2024-02-29' }).ok).toBe(true); // a real leap day
  });

  it('refuses an empty, blank, non-string or oversized name', () => {
    for (const bad of ['', '   ', 5, null, undefined, {}, 'x'.repeat(2001)]) {
      expect(parse('create-dependent', { ...good, name: bad }), String(bad)).toEqual({ ok: false, field: 'name' });
    }
  });

  it('refuses a request id that is not a UUID', () => {
    for (const bad of ['', 'abc', R + 'x', R.replace(/-/g, ''), 5, null, [R]]) {
      expect(parse('create-dependent', { ...good, requestId: bad }), String(bad)).toEqual({ ok: false, field: 'requestId' });
    }
  });
});

describe('set-kul-link', () => {
  it('makes unlinking explicit: null unlinks, a missing key is an error', () => {
    expect(parse('set-kul-link', { requestId: R, subjectId: S, kulFamilyMemberId: TREE }))
      .toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_kul_family_member: TREE } });
    expect(parse('set-kul-link', { requestId: R, subjectId: S, kulFamilyMemberId: null }))
      .toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_kul_family_member: null } });
    expect(parse('set-kul-link', { requestId: R, subjectId: S })).toEqual({ ok: false, field: 'kulFamilyMemberId' });
    expect(parse('set-kul-link', { requestId: R, subjectId: S, kulFamilyMemberId: 'x' })).toEqual({ ok: false, field: 'kulFamilyMemberId' });
  });
});

describe('records', () => {
  it('create-record: a custom title and a planned date are optional, blank text is absent, a bad date is refused', () => {
    expect(parse('create-record', { requestId: R, subjectId: S, riteKey: 'custom', customTitle: ' First haircut ', plannedDate: '2027-01-05' }))
      .toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_rite_key: 'custom', p_custom_title: 'First haircut', p_planned_date: '2027-01-05' } });
    expect(parse('create-record', { requestId: R, subjectId: S, riteKey: 'custom', customTitle: '   ' }))
      .toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_rite_key: 'custom', p_custom_title: null, p_planned_date: null } });
    expect(parse('create-record', { requestId: R, subjectId: S, riteKey: 'custom', plannedDate: '2027-02-30' })).toEqual({ ok: false, field: 'plannedDate' });
    expect(parse('create-record', { requestId: R, subjectId: S, riteKey: '' })).toEqual({ ok: false, field: 'riteKey' });
  });

  it('update-record and save-private need a whole-number expected version', () => {
    for (const bad of [-1, 1.5, '3', NaN, null, undefined, 1_000_001]) {
      expect(parse('update-record', { requestId: R, recordId: REC, expectedVersion: bad }), String(bad)).toEqual({ ok: false, field: 'expectedVersion' });
      expect(parse('save-private', { requestId: R, recordId: REC, expectedVersion: bad }), String(bad)).toEqual({ ok: false, field: 'expectedVersion' });
    }
    expect(parse('save-private', { requestId: R, recordId: REC, notes: ' a note ', expectedVersion: 0 }))
      .toEqual({ ok: true, args: { p_request_id: R, p_record: REC, p_notes: 'a note', p_location: null, p_performed_by: null, p_expected_due_date: null, p_expected_version: 0 } });
    expect(parse('save-private', { requestId: R, recordId: REC, expectedDueDate: '2026-04-31', expectedVersion: 0 })).toEqual({ ok: false, field: 'expectedDueDate' });
  });

  it('set-completion makes "not done" explicit: null, never a missing key', () => {
    expect(parse('set-completion', { requestId: R, recordId: REC, completedDate: '2026-10-01', expectedVersion: 2 }))
      .toEqual({ ok: true, args: { p_request_id: R, p_record: REC, p_completed_date: '2026-10-01', p_expected_version: 2 } });
    expect(parse('set-completion', { requestId: R, recordId: REC, completedDate: null, expectedVersion: 2 }))
      .toEqual({ ok: true, args: { p_request_id: R, p_record: REC, p_completed_date: null, p_expected_version: 2 } });
    expect(parse('set-completion', { requestId: R, recordId: REC, expectedVersion: 2 })).toEqual({ ok: false, field: 'completedDate' });
    expect(parse('set-completion', { requestId: R, recordId: REC, completedDate: '01-10-2026', expectedVersion: 2 })).toEqual({ ok: false, field: 'completedDate' });
  });
});

describe('sharing, hand-over and reminders', () => {
  it('grant-view: a null record shares the timeline, a malformed one is refused', () => {
    expect(parse('grant-view', { requestId: R, subjectId: S, recordId: REC, granteeId: ACC }))
      .toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_record: REC, p_grantee: ACC } });
    expect(parse('grant-view', { requestId: R, subjectId: S, granteeId: ACC }))
      .toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_record: null, p_grantee: ACC } });
    expect(parse('grant-view', { requestId: R, subjectId: S, recordId: 'zzz', granteeId: ACC })).toEqual({ ok: false, field: 'recordId' });
    expect(parse('grant-view', { requestId: R, subjectId: S })).toEqual({ ok: false, field: 'granteeId' });
  });

  it('accept-claim takes exactly a 64-character hex token', () => {
    expect(parse('accept-claim', { requestId: R, token: TOKEN.toUpperCase() })).toEqual({ ok: true, args: { p_request_id: R, p_token: TOKEN } });
    for (const bad of ['', 'ab'.repeat(31), 'ab'.repeat(33), 'zz'.repeat(32), ` ${TOKEN}`, 5, null]) {
      expect(parse('accept-claim', { requestId: R, token: bad }), String(bad)).toEqual({ ok: false, field: 'token' });
    }
  });

  it('set-reminder needs a whole lead time in range and a real boolean', () => {
    expect(parse('set-reminder', { requestId: R, recordId: REC, leadDays: 7, enabled: true }))
      .toEqual({ ok: true, args: { p_request_id: R, p_record: REC, p_lead_days: 7, p_enabled: true } });
    for (const bad of [-1, 366, 1.5, '7', null, undefined]) {
      expect(parse('set-reminder', { requestId: R, recordId: REC, leadDays: bad, enabled: true }), String(bad)).toEqual({ ok: false, field: 'leadDays' });
    }
    for (const bad of ['true', 1, null, undefined]) {
      expect(parse('set-reminder', { requestId: R, recordId: REC, leadDays: 7, enabled: bad }), String(bad)).toEqual({ ok: false, field: 'enabled' });
    }
  });

  it('the delete, manager, claim and revoke actions take only ids', () => {
    expect(parse('delete-mine', { requestId: R })).toEqual({ ok: true, args: { p_request_id: R } });
    expect(parse('delete-record', { requestId: R, recordId: REC })).toEqual({ ok: true, args: { p_request_id: R, p_record: REC } });
    expect(parse('delete-dependent', { requestId: R, subjectId: S })).toEqual({ ok: true, args: { p_request_id: R, p_subject: S } });
    expect(parse('add-manager', { requestId: R, subjectId: S, accountId: ACC })).toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_account: ACC } });
    expect(parse('remove-manager', { requestId: R, subjectId: S, accountId: ACC })).toEqual({ ok: true, args: { p_request_id: R, p_subject: S, p_account: ACC } });
    expect(parse('revoke-grant', { requestId: R, grantId: REC })).toEqual({ ok: true, args: { p_request_id: R, p_grant: REC } });
    expect(parse('start-claim', { requestId: R, subjectId: S })).toEqual({ ok: true, args: { p_request_id: R, p_subject: S } });
    expect(parse('cancel-claim', { requestId: R, subjectId: S })).toEqual({ ok: true, args: { p_request_id: R, p_subject: S } });
  });
});

describe('reporting a refusal', () => {
  it('turns each of our own codes into its status, keeping our reason', () => {
    const cases: Array<[string, number]> = [['SK400', 400], ['SK401', 401], ['SK403', 403], ['SK404', 404], ['SK409', 409], ['SK422', 422]];
    for (const [code, status] of cases) {
      const out = mapSanskaraError({ code, message: 'sanskara_invalid_name' });
      expect(out.status, code).toBe(status);
      expect(out.code, code).toBe('sanskara_invalid_name');
    }
  });

  it('never forwards database text, even from one of our own codes', () => {
    const hostile = 'duplicate key value violates unique constraint "sanskara_records_subject_rite" for user 4e1d';
    const out = mapSanskaraError({ code: 'SK400', message: hostile });
    expect(out.code).toBe('sanskara_sk400');
    expect(JSON.stringify(out)).not.toContain('sanskara_records');
    expect(JSON.stringify(out)).not.toContain('4e1d');
  });

  it('reports anything that is not one of ours as a generic 503, whatever it says', () => {
    for (const code of ['42501', '23505', '22008', 'PGRST202', 'PGRST301', '', undefined, 5]) {
      const out = mapSanskaraError({ code, message: 'permission denied for table sanskara_subjects' });
      expect(out, String(code)).toEqual({ status: 503, error: 'This could not be done right now. Please try again.', code: 'sanskara_unavailable' });
    }
    expect(mapSanskaraError(null).status).toBe(503);
    expect(mapSanskaraError(undefined).status).toBe(503);
  });
});
