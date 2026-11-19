# -*- coding: utf-8 -*-
"""
Turns the unreviewed Sikh and Jain drafts into a CANDIDATE roster (AGENTS.md section 3).

Keeps: names, era, region, tradition. Drops every quote (60/60 Sikh and 21/21 Jain were present, many misattributed).
Moves the old narrative into `unverifiedDraft` (never published; to be rebuilt from cited sources) and downgrades
every citation from the draft's self-assigned "tier 1" to `claimedTier` with `verified: false`.
Fixes the roster: Bhai Lehna is Guru Angad (removed); Bota Singh and Garja Singh become two stubs; shared Bhagats
and Udham Singh are flagged for a decision. Input files are not modified. Run: python3 -I clean_drafts.py
"""
import importlib.util, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'cleaned')
KEEP = ['id', 'name', 'nameLocal', 'namePa', 'era', 'eraLocal', 'eraPa', 'tradition', 'region', 'regionLocal', 'regionPa']
NARRATIVE = [k for k in ('tagline', 'journey', 'trial', 'teaching', 'moral', 'legacy') for k in (k, k + 'Local', k + 'Pa')]
CROSS_TRADITION = {'bhagat-namdev-gurbani', 'bhagat-ravidas-gurbani', 'bhagat-kabir-gurbani', 'bhagat-sheikh-farid',
                   'bhagat-dhanna', 'bhagat-pipa', 'bhagat-sain'}
REMOVED = {'bhai-lehna-disciple': 'Same person as guru-angad-dev (Bhai Lehna became Guru Angad Dev Ji).'}


def load_py(name, var):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, var)


def candidate(h):
    c = {k: h[k] for k in KEEP if k in h}
    c['reviewStatus'] = 'candidate_unverified'
    c['sourceBacked'] = False
    c['unverifiedDraft'] = {k: h[k] for k in NARRATIVE if k in h}
    c['citationsToVerify'] = [
        {'sourceName': s.get('sourceName'), 'sourceRef': s.get('sourceRef'), 'claimedTier': s.get('tier'), 'verified': False}
        for s in h.get('sourceCitations', [])
    ]
    flags = []
    if h['id'] in CROSS_TRADITION:
        flags.append('cross_tradition: also a bhakti/Hindu saint (and Farid a Sufi); one canonical home must be chosen')
    if h['id'] == 'shaheed-udham-singh':
        flags.append('identity_label: he called himself Ram Mohammad Singh Azad; "Sikh hero" label needs a decision')
    if flags:
        c['flags'] = flags
    return c


def stub(base, hid, name, era, note):
    return {'id': hid, 'name': name, 'era': era, 'tradition': base['tradition'], 'region': base.get('region'),
            'reviewStatus': 'candidate_unverified', 'sourceBacked': False, 'citationsToVerify': [], 'flags': [note]}


def main():
    os.makedirs(OUT, exist_ok=True)
    sikh = json.load(open(os.path.join(HERE, 'sikh_60.json'), encoding='utf-8'))
    jain = load_py('jain_group1', 'JAIN_GROUP_1')
    removed, sikh_out = [], []
    for h in sikh:
        if h['id'] in REMOVED:
            removed.append({'id': h['id'], 'reason': REMOVED[h['id']]})
        elif h['id'] == 'bota-singh-garja-singh':
            sikh_out.append(stub(h, 'bota-singh', 'Bhai Bota Singh', h['era'], 'split from a combined record; text must be written for him alone'))
            sikh_out.append(stub(h, 'garja-singh', 'Bhai Garja Singh', h['era'], 'split from a combined record; text must be written for him alone'))
        else:
            sikh_out.append(candidate(h))
    jain_out = [candidate(h) for h in jain]
    for name, rows in (('sikh_candidates.json', sikh_out), ('jain_candidates.json', jain_out)):
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT, 'removed.json'), 'w', encoding='utf-8') as f:
        json.dump(removed, f, ensure_ascii=False, indent=2)
    # Self-check: nothing publishable may leave this script.
    for r in sikh_out + jain_out:
        assert 'quote' not in r and not any(k.startswith('quote') for k in r), r['id']
        assert r['sourceBacked'] is False and r['reviewStatus'] == 'candidate_unverified', r['id']
        assert all(c['verified'] is False for c in r['citationsToVerify']), r['id']
    ids = [r['id'] for r in sikh_out + jain_out]
    assert len(ids) == len(set(ids)), 'duplicate ids'
    print('sikh', len(sikh_out), 'jain', len(jain_out), 'removed', len(removed))


if __name__ == '__main__':
    main()
