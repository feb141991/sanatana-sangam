/** Read-only Ekadashi inventory and production-output audit. No date approval or DB writes.
 * Run: npx tsx scripts/audit-ekadashi-coverage.ts [--years=2025,2026,...] [--locations=ujjain,london,new-york,sydney]
 * Optional --database adds SELECT-only stored-row evidence. --database-only skips annual astronomy.
 * This compares internal paths for completeness; it is NOT independent astronomical or religious validation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  LunarTithiHandler, RecurringLunarTithiHandler, precomputePanchangCorrectedForYear,
  calculateObservancesForYear, isPublishableForYear, isMasaMatching, ruleIdentityKey, toCorrectedRule,
} from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { calculateOccurrencesWithEvaluator, EVALUATOR_RULES } from '../src/lib/calendar/materialize';
import type { LocationInput } from '@sangam/panchang-engine';

export function matchesRuleOutput(rule: {slug: string; variant_key?: string; sampradaya?: string}, output: {slug: string; ruleKey?: string}): boolean {
  if (rule.slug !== output.slug) return false;
  const qualifier = rule.variant_key ?? rule.sampradaya;
  return qualifier ? output.ruleKey === `${rule.slug}::${qualifier}`
    : (output.ruleKey === rule.slug || output.ruleKey === `${rule.slug}::legacy-default`);
}
export function hasScopedReview(key: string, queue: Array<{slug:string;variant_key:string}>): boolean {
  const [slug,qualifier='legacy-default']=key.split('::');
  return queue.some(item=>item.slug===slug&&item.variant_key===qualifier);
}
export function consecutiveGroups(dates: string[]): string[][] {
  const sorted = [...new Set(dates)].sort();
  const groups: string[][] = [];
  for (const date of sorted) {
    const last = groups.at(-1);
    if (last && Date.parse(date) - Date.parse(last.at(-1)!) === 86_400_000) last.push(date);
    else groups.push([date]);
  }
  return groups;
}
export function missingInstances(groups: string[][], outputDates: string[]): string[][] {
  const output = new Set(outputDates);
  return groups.filter(group => !group.some(date => output.has(date)));
}
const LOCATIONS: Record<string, LocationInput> = {
  ujjain: { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  london: { lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  'new-york': { lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  sydney: { lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
};
const arg = (name: string, fallback: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const digest = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
type CoverageCase = {
  year:number;locationName:string;genericRaw:string[];genericOutput:string[];missingGeneric:string[];adhikaGeneric:string[];
  namedWithoutGeneric:Array<{key:string;dates:string[]}>;
  rules:Array<{key:string;publishable:boolean;instances:string[][];output:string[];missingInstances:string[][]}>;
  unresolved:Array<{slug:string;variant_key:string;ambiguity_type?:string}>;
};
type StoredReport = {years:number[];locations:string[];cases:CoverageCase[];inputChangedDuringRun:string[];inventory:{namedSlugCount:number;namedRuleRows:number;missingAdditionalNames:string[]};database?:unknown};

function summarize() {
  const dir=path.join(ROOT,'docs/audits/ekadashi-coverage');
  const shards=fs.readdirSync(dir).filter(p=>/^sweep-[a-z]+\.json$/.test(p));
  const reports:StoredReport[]=(fs.existsSync(path.join(dir,'coverage.json'))?['coverage.json']:shards).map(p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8')));
  if(!reports.length)throw new Error('No saved sweep reports');
  const cases=reports.flatMap(r=>r.cases).sort((a,b)=>a.year-b.year||a.locationName.localeCompare(b.locationName));
  const inventory=reports[0].inventory;
  const result={inventory,completedCases:cases.length,requestedCases:reports.reduce((n,r)=>n+r.years.length*r.locations.length,0),changedInputs:reports.flatMap(r=>r.inputChangedDuringRun),
    rows:cases.map(c=>({year:c.year,location:c.locationName,genericBaseline:c.genericRaw.length,genericPublished:c.genericOutput.length,
      unresolvedGeneric:c.unresolved.filter(u=>u.slug==='ekadashi').length,missingGeneric:c.missingGeneric,
      adhikaGeneric:c.adhikaGeneric,namedReviewHeldInstances:c.rules.filter(r=>r.missingInstances.length&&hasScopedReview(r.key,c.unresolved)).map(r=>({key:r.key,instances:r.missingInstances})),lostNamedInstances:c.rules.filter(r=>r.missingInstances.length&&!hasScopedReview(r.key,c.unresolved)).map(r=>({key:r.key,instances:r.missingInstances,output:r.output})),
      namedWithoutGeneric:c.namedWithoutGeneric,withheldRuleKeys:c.rules.filter(r=>!r.publishable).map(r=>r.key)}))};
  fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(result,null,2)+'\n');
  const table=result.rows.map(r=>`| ${r.year} | ${r.location} | ${r.genericBaseline} | ${r.genericPublished} | ${r.unresolvedGeneric} | ${r.lostNamedInstances.reduce((n,x)=>n+x.instances.length,0)} |`).join('\n');
  const lost=result.rows.flatMap(r=>r.lostNamedInstances.map(x=>`- ${r.year} / ${r.location} / ${x.key}: handler instances ${x.instances.map(g=>g.join(' or ')).join('; ')} absent from output; retained output ${x.output.join(', ')||'none'}.`)).join('\n');
  const gaps=result.rows.flatMap(r=>r.namedWithoutGeneric.map(x=>`- ${r.year} / ${r.location} / ${x.key}: named output ${x.dates.join(', ')} absent from generic published output.`)).join('\n');
  const adhika=result.rows.filter(r=>r.adhikaGeneric.length).map(r=>`- ${r.year} / ${r.location}: ${r.adhikaGeneric.join(', ')} (generic baseline dates, not newly approved Padmini/Parama dates).`).join('\n');
  const cachePath=path.join(dir,'cache-check.json');
  const cache:{warmAfterTithi:number;coldAfterTithi:number;after:string;warmColdDisagree:boolean}|null=fs.existsSync(cachePath)?JSON.parse(fs.readFileSync(cachePath,'utf8')):null;
  const cacheSection=cache?`### Parallel uncommitted cache changes tithi across identical requests\n\nAt ${cache.after}, warm-cache tithi=${cache.warmAfterTithi} versus cold-cache tithi=${cache.coldAfterTithi}; disagreement=${cache.warmColdDisagree}. Reproduce with \`--cache-check\`; cache-check.json records source fingerprints. The optional precomputed-grid.ts rounds instants into time buckets, allowing reuse across a tithi transition. This was observed in the uncommitted working tree, not asserted to be deployed. No parallel file was changed. Audited dates are current-code observations, not certified dates.\n\n`:'';
  const md=`# Ekadashi rule coverage audit

Verdict: gaps found; this is not a date-correctness or religious-approval certificate. No production rule, date or publication status changed.

## Reproduce

Run \`npx tsx scripts/audit-ekadashi-coverage.ts\` for the default finite annual sweep. Then run \`npx tsx scripts/audit-ekadashi-coverage.ts --summarize\`. Add \`--database-only --out=docs/audits/ekadashi-coverage/database.json\` for SELECT-only stored-row evidence and \`--spot-check\` for the TTD convention comparison. A default coverage.json takes precedence; otherwise saved sweep shards are combined. Archive old evidence before starting a different sweep.

## Coverage

Completed ${result.completedCases}/${result.requestedCases} requested year/location cases. Input files changed during runs: ${result.changedInputs.join(', ')||'none detected among fingerprinted inputs'}. Local current checkout, including recorded parallel edits, was audited; this does not identify the deployed server commit.

Catalogue: ${inventory.namedSlugCount} named slugs / ${inventory.namedRuleRows} named rule rows. Additional standalone slugs absent: ${inventory.missingAdditionalNames.join(', ')}. Mokshada is currently an alias of Vaikunta; it must not simply be counted as an absent regular fortnight.

| Year | Location | Generic handler baseline | Generic final output | Generic review items | Named/variant instances silently absent |
|---|---|---:|---:|---:|---:|
${table}

## Findings

${cacheSection}### Named occurrences collapse inside a civil year

The annual engine selects one first/last candidate for non-recurring lunar_tithi rules. A named Ekadashi can occur in separate lunar cycles near both ends of the same Gregorian year. Consecutive daily hits are grouped as one instance by this audit, so a two-sunrise tithi is not falsely counted twice. Missing instances with an explicit review item for that exact variant are reported separately in namedReviewHeldInstances; the missing-instance list below counts only those without that review item. Counts are per rule/variant, not unique civil dates. Preserve distinct lunar-cycle instances; do not fix by selecting a different single date.

### Smarta Yogini disappears at evaluator dispatch

materialize.ts removes baseline occurrences by slug if any evaluator exists for that slug. Yogini's evaluator defines only vaishnava_vidhava; its existing Smarta baseline variant is therefore removed too. Disputed-year withholding is intentional and reported separately, not treated as a silent loss.

### Intercalary names are absent

Padmini and Parama have no dedicated rules, definitions or dedicated app content found. The generic rule declares adhika_policy=both, so this is partly a naming/content gap, not evidence that every extra-month date disappears. Some generic occurrences are independently held for review. Review and add the sourced rules and their content; do not remove the nija guard on regular names.

${adhika||'No extra-month generic dates in completed cases.'}

### Named and generic results diverge

The generic sunrise evaluator can withhold a repeated sunrise tithi or lose an instance absent from its baseline. Named skipped-tithi policies differ (Devutthana has an explicit Smarta previous-day policy). These are not automatically erroneous dates: distinguish a legitimate documented variant, deliberate review hold, and an unhandled candidate.

${gaps||'None in completed cases.'}

### Vaikunta / Mokshada regional distinction is not represented

The only Vaikunta rule is Margashirsha Shukla in amanta and the content aliases Mokshada to it. TTD's primary announcement uses Shukla Ekadashi in Dhanurmasa. The separate ttd-spot-check.json records a source day and the declared-month mismatch at Tirumala. The single-day sunrise tithi predicate does not test all skipped-tithi policies and is not a full-year/date-accuracy verdict. A reviewed regional/solar-month variant is required; do not replace one universal date with another.

### All tradition exceptions and Parana are not implemented

Most named rules share a sunrise model and do not have independent Smarta/Vaishnava variants. Stored tradition_profiles has ekadashi_method and paran_rule, but the inspected calendar evaluator path has no complete Mahadvadashi classifier or computed Parana/Hari Vasara policy implementation. Storing a policy name and displaying general fasting advice does not establish these capabilities.

## Full missing named-instance evidence

${lost||'None in completed cases.'}

## Stored rows and independent fixtures

Read database.json: its summary records exact years, distinct slugs and absent named rows; raw rows retain profile, variant, location and publication status. Future-year absence alone is not a user-visible failure because resolve-occurrences.ts materializes missing year/profile/location buckets lazily. Stored rows and approved fixtures are independent of this local calculation and can be stale or incomplete. Credential/project discovery through the connector returned no projects; SELECT-only checks used the repo's existing local credentials without printing them. No calendar API was called because a read can lazily write rows.

## Sources (manual convention checks, no bulk calendar import)

- Padmini/Parama names: https://www.iskconportland.com/ekadashi_calendar (named entries only; dates were not copied into rules).
- TTD convention and source event: https://news.tirumala.org/govinda-govinda-chant-rocks-tirumala/ (location/date/coordinates in ttd-spot-check.json).
- Mahadvadashi and Parana examples: https://www.iskconbangalore.org/vaishnava-calendar/ and https://www.iskconbangalore.org/wp-content/uploads/2025/03/Vaishnava-Calendar_BLR_2025_26.xlsx.pdf .

## REVIEW_CHECKLIST sign-off

- Cardinality: FINDING — distinct named instances collapse.
- Detection capability: audit unit tests distinguish two annual instances, consecutive scans and legacy-default rule identities; internal path comparison cannot validate shared astronomy errors.
- Both directions: matching/nonmatching variant identities, retained/dropped instances and empty candidates covered by audit tests.
- Detection versus behaviour: FINDING — adhika detection does not provide Padmini/Parama rules; profile fields do not supply complete fasting exceptions.
- Boundaries: annual year-end instances checked. Leap and extra-month years are included where present in the saved matrix. Full polar, international-date-line and diaspora/DST matrices were not run.
- Units/frames: existing engine adapters used; location and IANA timezone kept paired. No new astronomy, frame conversions or tithi solver. Absolute astronomy accuracy not independently validated here.
- Compensation: regular-name adhika exclusions, deliberate publication withholding and first/last selection were preserved, not silently relaxed.
- Reproducibility: commands and JSON evidence retained; runtime stdout and generated tables derive from computed results.
- Scope honesty: audit script/tests and this evidence directory only. Parallel app/panchang edits were preserved. No calendar dates, policies, fixtures or publication statuses changed. No new branch or deployment.
- Cross-engine consistency: FINDING — generic/named production paths compared; independent TTD convention spot-check retained; full external date validation across every year remains unverified.

## Limits

This finite reference-location sweep cannot certify every year, tradition or city. No date is approved by this audit. Deliberate review items are not asserted to be silent omissions; all raw candidate and output arrays are retained in sweep JSON. Third-party content or LLM output did not set a source tier, reviewed status or published date.
`;
  fs.writeFileSync(path.join(dir,'REVIEW.md'),md);
  console.log(JSON.stringify(result,null,2));
}

const ROOT = path.resolve(__dirname, '..');
const trackedInputs = ['src/lib/calendar/engine.ts','src/lib/calendar/materialize.ts','src/lib/calendar/rules.ts','src/lib/panchang.ts','packages/dharma-rules/src/festivals/rules.json'];

async function databaseEvidence(years: number[]) {
  const { config } = await import('dotenv');
  config({ path: path.join(ROOT,'.env.local'), quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: 'Local read credentials unavailable; production stored rows unverified' };
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const defs = await client.from('observance_definitions').select('id,slug,active').ilike('slug','%ekadashi%');
  if (defs.error) return {error: defs.error.message};
  const definitions = defs.data ?? [];
  if (!definitions.length) return { definitions, rows: [] };
  const rows: Record<string,unknown>[] = [];
  for (let offset=0;;offset+=1000) {
    const res = await client.from('observance_occurrences')
      .select('definition_id,date,year,calendar_profile,variant_key,spiritual_tradition,publication_status,calculated_by,computed_latitude,computed_longitude,computed_timezone')
      .in('definition_id',definitions.map(d=>d.id)).gte('year',Math.min(...years)).lte('year',Math.max(...years))
      .order('id').range(offset,offset+999);
    if (res.error) return {error: res.error.message, partialRowCount:rows.length};
    rows.push(...(res.data??[])); if ((res.data?.length??0)<1000) break;
  }
  const names = new Map(definitions.map(d=>[d.id,d.slug]));
  const fixtureRes = await client.from('golden_fixtures').select('festival_id,year,approved,source').in('festival_id',definitions.map(d=>d.slug));
  const profiles = await client.from('tradition_profiles').select('slug,ekadashi_method,paran_rule');
  return { checkedAt:new Date().toISOString(),definitions,summary:years.map(year=>{const published=rows.filter(r=>r.year===year&&r.publication_status==='published');const present=new Set(published.map(r=>names.get(String(r.definition_id))));return {year,publishedRows:published.length,distinctSlugs:present.size,namedSlugsWithNoPublishedRows:definitions.filter(d=>d.slug!=='ekadashi'&&!present.has(d.slug)).map(d=>d.slug)};}),rows:rows.map(r=>({...r,slug:names.get(String(r.definition_id))})),
    fixtures:fixtureRes.error?{error:fixtureRes.error.message}:fixtureRes.data,
    traditionPolicies:profiles.error?{error:profiles.error.message}:profiles.data };
}

async function spotCheck() {
  const { getSunriseForDateStr,getLunarMonth }=await import('@sangam/panchang-engine');
  const { calculatePanchang }=await import('../src/lib/panchang');
  // Manually read primary TTD announcement, not imported calendar data or a new approved fixture.
  const date='2017-01-08';const location={lat:13.6833,lon:79.3472,tz:'Asia/Kolkata'};
  const source='https://news.tirumala.org/govinda-govinda-chant-rocks-tirumala/';
  const rule=CANONICAL_RULES.find(r=>r.slug==='vaikunta-ekadashi');if(!rule)throw new Error('Missing Vaikunta rule');
  const {sunrise}=getSunriseForDateStr(date,location);const panchang=calculatePanchang(sunrise,location.lat,location.lon,location.tz);const month=getLunarMonth(sunrise,'amanta');
  const result={source,sourceEventDate:date,sourceConvention:'Shukla Ekadashi in Dhanurmasa (TTD)',location,
    computedSunrise:sunrise.toISOString(),computedTithi:panchang.tithiIndex,computedAmantaMonth:month.ok?month.monthName:null,
    canonicalRuleMonth:rule.corrected_lunar_masa_name,canonicalRuleMonthSystem:rule.corrected_month_system,
    declaredMonthMatchesSourceDay:isMasaMatching(month.ok?month.monthName:'',rule.corrected_lunar_masa_name??'',rule.adhika_policy),
    declaredRuleMatchesSourceDay:LunarTithiHandler.evaluate(toCorrectedRule(rule),[{dateStr:date,panchang:{...panchang,masaName:month.ok?month.monthName:''}}]).includes(date),
    limitation:'Single source/location/day predicate check; not a ratification, date override, full-year calculation, or universal Vaikunta policy.'};
  const dir=path.join(ROOT,'docs/audits/ekadashi-coverage');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'ttd-spot-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}

async function cacheCheck() {
  const cachePath=path.join(ROOT,'src/lib/panchang/precomputed-grid.ts');
  if(!fs.existsSync(cachePath)){console.log('Optional uncommitted grid cache absent; check not applicable');return;}
  const {pathToFileURL}=await import('node:url');
  const cache:unknown=await import(pathToFileURL(cachePath).href);
  if(typeof cache!=='object'||cache===null||!('clearPanchangCache'in cache)||typeof cache.clearPanchangCache!=='function')throw new Error('Unsupported optional cache module');
  const clear=cache.clearPanchangCache;
  const {calculatePanchang}=await import('../src/lib/panchang');
  // Instants around the transition described in the existing Devutthana rule note.
  // No official date is inferred: compare the identical API with a cold and warmed cache.
  const before=new Date('2026-11-20T01:45:00.000Z');const after=new Date('2026-11-20T01:59:00.000Z');const l=LOCATIONS.ujjain;
  clear();const beforeResult=calculatePanchang(before,l.lat,l.lon,l.tz);
  const warmAfter=calculatePanchang(after,l.lat,l.lon,l.tz);
  clear();const coldAfter=calculatePanchang(after,l.lat,l.lon,l.tz);clear();
  const result={checkedAt:new Date().toISOString(),scope:'Optional parallel uncommitted panchang grid cache; not a rule change',before:before.toISOString(),after:after.toISOString(),location:l,
    beforeTithi:beforeResult.tithiIndex,warmAfterTithi:warmAfter.tithiIndex,coldAfterTithi:coldAfter.tithiIndex,
    warmColdDisagree:warmAfter.tithiIndex!==coldAfter.tithiIndex,cacheHash:digest(cachePath),panchangHash:digest(path.join(ROOT,'src/lib/panchang.ts'))};
  const dir=path.join(ROOT,'docs/audits/ekadashi-coverage');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'cache-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}

async function main() {
  if(process.argv.includes('--summarize')){summarize();return;}
  if(process.argv.includes('--spot-check')){await spotCheck();return;}
  if(process.argv.includes('--cache-check')){await cacheCheck();return;}
  const years = arg('years','2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035').split(',').map(Number);
  const locations=arg('locations','ujjain').split(',');
  if (years.some(y=>!Number.isInteger(y)||y<1900||y>2100)||locations.some(l=>!LOCATIONS[l])) throw new Error('Unsupported year/location argument');
  const out=path.resolve(ROOT,arg('out','docs/audits/ekadashi-coverage/coverage.json'));fs.mkdirSync(path.dirname(out),{recursive:true});
  const rules=CANONICAL_RULES.filter(r=>r.slug.includes('ekadashi'));
  const named=rules.filter(r=>r.slug!=='ekadashi');
  const generic=rules.find(r=>r.slug==='ekadashi');if(!generic) throw new Error('Missing generic Ekadashi rule');
  const hashes=Object.fromEntries(trackedInputs.map(p=>[p,digest(path.join(ROOT,p))]));
  const report={timestamp:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),
    workingTree:execFileSync('git',['status','--short'],{cwd:ROOT,encoding:'utf8'}),inputHashes:hashes,inputChangedDuringRun:[] as string[],
    years,locations,inventory:{namedSlugCount:new Set(named.map(r=>r.slug)).size,namedRuleRows:named.length,
      missingAdditionalNames:['padmini-ekadashi','parama-ekadashi','mokshada-ekadashi'].filter(s=>!rules.some(r=>r.slug===s)),
      rules:rules.map(r=>({slug:r.slug,key:ruleIdentityKey(r),family:r.rule_family,month:r.corrected_lunar_masa_name,monthSystem:r.corrected_month_system,
        tithi:r.corrected_lunar_tithi_index??r.lunar_tithi_index,targets:r.recurring_tithi_indices,adhikaPolicy:r.adhika_policy,launchStatus:r.launch_status,
        disputedYears:r.disputed_years,skippedPolicy:r.corrected_skipped_tithi_policy,windowSource:r.window_source,
        evaluator:EVALUATOR_RULES.find(e=>e.slug===r.slug)??null}))},
    cases:[] as CoverageCase[],database:undefined as unknown,
    limitations:['Internal path completeness comparison, not independent astronomy/religious validation.','Consecutive daily hits are one candidate instance; adjacent civil-year context is separately flagged, not synthesized.','Unresolved/disputed candidates are reported separately from silently dropped instances.','No rule, occurrence, publication status, fixture or policy is mutated.','Working tree may include parallel edits; hashes identify audited inputs.','Default sweep is finite, not a claim covering every year, profile, or geographic location.']};
  const save=()=>{report.inputChangedDuringRun=trackedInputs.filter(p=>digest(path.join(ROOT,p))!==hashes[p]);fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');};
  save();
  if(!process.argv.includes('--database-only')) for(const locationName of locations) for(const year of years) {
    const location=LOCATIONS[locationName]; const started=Date.now();
    const days=precomputePanchangCorrectedForYear(year,location);
    const purnimanta=days.map(d=>({...d,panchang:{...d.panchang,masaName:d.panchang.masaNamePurnimanta}}));
    const production=calculateObservancesForYear(year,location).filter(o=>o.slug.includes('ekadashi'));
    const evaluated=calculateOccurrencesWithEvaluator(year,location);
    const unresolved=evaluated.unresolved.filter(o=>o.slug.includes('ekadashi'));
    const genericRaw=RecurringLunarTithiHandler.evaluate(toCorrectedRule(generic),days);
    const genericOutput=production.filter(o=>o.slug==='ekadashi').map(o=>o.date);
    const ruleResults=named.map(r=>{
      const candidates=LunarTithiHandler.evaluate(toCorrectedRule(r),r.corrected_month_system==='purnimanta'?purnimanta:days).sort();
      const groups=consecutiveGroups(candidates);
      const output=production.filter(o=>matchesRuleOutput(r,o)).map(o=>o.date);
      return {slug:r.slug,key:ruleIdentityKey(r),publishable:isPublishableForYear(r,year),candidates,instances:groups,output,
        missingInstances:isPublishableForYear(r,year)?missingInstances(groups,output):[],
        unresolved:unresolved.filter(o=>o.slug===r.slug&&o.variant_key===(r.variant_key??r.sampradaya??'legacy-default'))};
    });
    const adhikaDays=days.filter(d=>d.panchang.masaName.startsWith('Adhika '));
    const adhikaGeneric=genericRaw.filter(date=>adhikaDays.some(d=>d.dateStr===date));
    const noNamedDate=genericRaw.filter(date=>!ruleResults.some(r=>r.instances.some(g=>g.includes(date))));
    const mismatches=ruleResults.filter(r=>r.publishable&&r.output.some(date=>!genericOutput.includes(date)));
    const caseResult={year,locationName,location,seconds:(Date.now()-started)/1000,dayCount:days.length,
      production,genericRaw,genericOutput,unresolved,missingGeneric:genericRaw.filter(d=>!genericOutput.includes(d)),
      adhikaMonths:[...new Set(adhikaDays.map(d=>d.panchang.masaName))],adhikaGeneric,noNamedDate,
      namedWithoutGeneric:mismatches.map(r=>({key:r.key,dates:r.output.filter(d=>!genericOutput.includes(d))})),rules:ruleResults};
    report.cases.push(caseResult);save();
    console.log(JSON.stringify({year,locationName,seconds:caseResult.seconds,genericRaw:genericRaw.length,genericPublished:genericOutput.length,missingGeneric:caseResult.missingGeneric,
      namedInstancesAbsentFromOutput:ruleResults.filter(r=>r.missingInstances.length).map(r=>({key:r.key,instances:r.missingInstances,reviewHeld:r.unresolved.length>0})),adhikaGeneric}));
  }
  if(process.argv.includes('--database')||process.argv.includes('--database-only')){report.database=await databaseEvidence(years);save();}
  console.log(`Evidence: ${out}`);
}
if (require.main === module) main().catch(error => { console.error(error instanceof Error ? error.message : 'Audit failed'); process.exitCode = 1; });
