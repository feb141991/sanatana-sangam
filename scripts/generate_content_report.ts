import * as fs from 'fs';
import * as path from 'path';

// Import reader stories
import {
  HINDU_KATHAS,
  SIKH_SAKHIS,
  PANCHATANTRA_STORIES,
  MORE_PANCHATANTRA_STORIES,
  BUDDHIST_STORIES,
  JAIN_KATHAS,
  HEROES_KATHAS
} from '../src/lib/katha-library';

// Import Dharm Veer rosters
import { SIKH_VEERS } from '../src/lib/data/dharm-veers/sikh';
import { JAIN_VEERS } from '../src/lib/data/dharm-veers/jain';
import { BUDDHIST_VEERS } from '../src/lib/data/dharm-veers/buddhist';
import { HINDU_VEERS } from '../src/lib/data/dharm-veers/hindu';

interface ItemFlag {
  file: string;
  ref?: string;
  type: 'MISSING_URL' | 'MOCK_DETECTED' | 'MISSING_PROVENANCE';
  message: string;
}

function runContentQAReport() {
  console.log("=== Starting Content QA Coverage Report ===");

  const manifestsDir = path.join(__dirname, '../python/ai_pipeline/corpus/manifests');
  const dharamVeerDir = path.join(manifestsDir, 'dharam_veer');

  // Read all manifest files
  const manifestFiles = fs.readdirSync(manifestsDir).filter(f => f.endsWith('.json'));
  const dharamVeerFiles = fs.readdirSync(dharamVeerDir).filter(f => f.endsWith('.json'));

  const flags: ItemFlag[] = [];
  const restrictedCorpora: string[] = [];

  // Group files
  const corpusMapping: Record<string, { files: string[]; readerCount: number }> = {
    'Bhakti Katha': {
      files: ['katha_chapter_1.json'],
      readerCount: HINDU_KATHAS.length
    },
    'Panchatantra': {
      files: ['panchatantra_chapter_1.json', 'panchatantra_chapter_2.json'],
      readerCount: PANCHATANTRA_STORIES.length + MORE_PANCHATANTRA_STORIES.length
    },
    'Dharm Veer': {
      files: dharamVeerFiles.map(f => path.join('dharam_veer', f)),
      readerCount: HEROES_KATHAS.length
    },
    'Ramayana': {
      files: [
        'valmiki_ramayana_bala.json',
        'valmiki_ramayana_ayodhya.json',
        'valmiki_ramayana_aranya.json',
        'valmiki_ramayana_kishkindha.json',
        'valmiki_ramayana_sundara.json',
        'valmiki_ramayana_yuddha.json'
      ],
      readerCount: 0
    },
    'Sikh': {
      files: [
        'sikh_gurbani_japji.json',
        'sikh_gurbani_anand_sahib.json',
        'sikh_gurbani_rehras_sahib.json',
        'sikh_dasam_granth.json'
      ],
      readerCount: SIKH_SAKHIS.length
    },
    'Jain': {
      files: ['jain_dharma.json', 'jain_kalpa_sutra.json', 'jain_tattvartha_sutra.json'],
      readerCount: JAIN_KATHAS.length
    },
    'Buddhist': {
      files: ['buddhist_dhamma.json', 'mahayana_bodhicharyavatara.json'],
      readerCount: BUDDHIST_STORIES.length
    }
  };

  // Keep track of mapped files to identify "Other / Restricted / Pending" files
  const mappedFilesSet = new Set<string>();
  for (const corpus of Object.values(corpusMapping)) {
    for (const f of corpus.files) {
      mappedFilesSet.add(f);
    }
  }

  const allManifestFiles = [
    ...manifestFiles.map(f => ({ name: f, isDV: false, absPath: path.join(manifestsDir, f) })),
    ...dharamVeerFiles.map(f => ({ name: path.join('dharam_veer', f), isDV: true, absPath: path.join(dharamVeerDir, f) }))
  ];

  const otherFiles = allManifestFiles.filter(f => !mappedFilesSet.has(f.name));

  // Roster counters
  const totalRosterHeroes = HINDU_VEERS.length + SIKH_VEERS.length + JAIN_VEERS.length + BUDDHIST_VEERS.length;
  const sourceBackedDVHeroIds = new Set<string>();

  // Helper to validate manifest items
  function validateItem(fileRelPath: string, manifest: any, item: any, isDV: boolean) {
    const ref = item.ref || '';
    const rights = item.rights_status || manifest.rights_status || 'restricted_or_pending';
    const sourceUrl = item.source_url || manifest.source_url || '';
    const sourceName = item.source_name || manifest.source_name || '';
    const sourceClass = item.source_class || manifest.source_class || '';

    // Track DV source backed ids
    if (isDV && manifest.doc_id) {
      const figureId = manifest.doc_id.replace('dharam_veer_', '');
      sourceBackedDVHeroIds.add(figureId);
    }

    // Flag 1: rights_status: public_domain without specific source URL
    if (rights === 'public_domain' && !sourceUrl) {
      flags.push({
        file: fileRelPath,
        ref,
        type: 'MISSING_URL',
        message: `rights_status is public_domain but source_url is missing or empty.`
      });
    }

    // Flag 2: missing provenance (source_name or source_class empty for public_domain)
    if (rights === 'public_domain' && (!sourceName || !sourceClass)) {
      flags.push({
        file: fileRelPath,
        ref,
        type: 'MISSING_PROVENANCE',
        message: `rights_status is public_domain but source_name or source_class is missing.`
      });
    }

    // Flag 3: Mock, placeholder, or synthetic content check
    const mockKeywords = ['mock', 'placeholder', 'synthetic', 'lorem ipsum', 'todo'];
    const fieldsToSearch = [
      item.text || '',
      item.curated_lesson || '',
      item.source_name || '',
      item.revision_note || '',
      manifest.revision_note || '',
      manifest.source_name || ''
    ];

    for (const field of fieldsToSearch) {
      const lower = field.toLowerCase();
      for (const kw of mockKeywords) {
        // Exclude valid occurrences in revision notes where we explicitly state we do NOT use mocks or document blocker
        if (lower.includes(kw)) {
          // Allow explaining blockers or missing files
          if (lower.includes('blocker') || lower.includes('prevent') || lower.includes('no mock') || lower.includes('safeguard')) {
            continue;
          }
          flags.push({
            file: fileRelPath,
            ref,
            type: 'MOCK_DETECTED',
            message: `Mock/placeholder keyword "${kw}" detected in content fields: "${field.substring(0, 100)}..."`
          });
          break;
        }
      }
    }
  }

  // Count stats per corpus
  const stats: Record<string, {
    totalItems: number;
    sourceBackedCount: number;
    curatedOnlyCount: number;
    restrictedCount: number;
  }> = {};

  for (const [corpusName, info] of Object.entries(corpusMapping)) {
    stats[corpusName] = { totalItems: 0, sourceBackedCount: 0, curatedOnlyCount: 0, restrictedCount: 0 };

    for (const fRel of info.files) {
      const fileInfo = allManifestFiles.find(af => af.name === fRel);
      if (!fileInfo) continue;

      try {
        const manifest = JSON.parse(fs.readFileSync(fileInfo.absPath, 'utf8'));
        const mRights = manifest.rights_status || 'restricted_or_pending';
        if (mRights === 'restricted_or_pending' && !restrictedCorpora.includes(corpusName)) {
          restrictedCorpora.push(corpusName);
        }

        const items = manifest.content || [];
        for (const item of items) {
          stats[corpusName].totalItems++;
          const itemRights = item.rights_status || mRights;
          const isCuratedOnly = (item.source_class === 'curated_lesson') || !item.text;

          if (itemRights === 'restricted_or_pending') {
            stats[corpusName].restrictedCount++;
          } else if (isCuratedOnly) {
            stats[corpusName].curatedOnlyCount++;
          } else {
            stats[corpusName].sourceBackedCount++;
          }

          validateItem(fileInfo.name, manifest, item, fileInfo.isDV);
        }
      } catch (err: any) {
        console.error(`Error reading/parsing manifest ${fileInfo.name}:`, err.message);
      }
    }
  }

  // Count other manifests
  let otherTotalItems = 0;
  let otherSourceBackedCount = 0;
  let otherRestrictedCount = 0;

  for (const fileInfo of otherFiles) {
    try {
      const manifest = JSON.parse(fs.readFileSync(fileInfo.absPath, 'utf8'));
      const mRights = manifest.rights_status || 'restricted_or_pending';
      const items = manifest.content || [];

      for (const item of items) {
        otherTotalItems++;
        const itemRights = item.rights_status || mRights;
        const isCuratedOnly = (item.source_class === 'curated_lesson') || !item.text;

        if (itemRights === 'restricted_or_pending') {
          otherRestrictedCount++;
        } else if (!isCuratedOnly) {
          otherSourceBackedCount++;
        }

        validateItem(fileInfo.name, manifest, item, fileInfo.isDV);
      }
    } catch (err: any) {
      console.error(`Error reading other manifest ${fileInfo.name}:`, err.message);
    }
  }

  // Build the markdown content
  let md = `# Content QA Coverage & Compliance Report\n\n`;
  md += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;

  md += `## 1. Executive Summary Table\n\n`;
  md += `| Corpus | Total Reader Stories (Library) | Manifest Items | Source-Backed (Pramana) | Curated-Only | Restricted / Pending | Status |\n`;
  md += `|---|---|---|---|---|---|---|\n`;

  for (const [corpusName, info] of Object.entries(corpusMapping)) {
    const cStats = stats[corpusName];
    const isPending = cStats.restrictedCount > 0 || cStats.totalItems === 0;
    const status = isPending ? '⚠️ Pending / Restricted' : '✅ Active';
    md += `| **${corpusName}** | ${info.readerCount} | ${cStats.totalItems} | ${cStats.sourceBackedCount} | ${cStats.curatedOnlyCount} | ${cStats.restrictedCount} | ${status} |\n`;
  }
  md += `\n\n`;

  md += `## 2. Dharm Veer Hero Coverage Details\n\n`;
  const totalDVSupported = sourceBackedDVHeroIds.size;
  const totalDVUnsupported = totalRosterHeroes - totalDVSupported;
  md += `- **Total Visible Roster Heroes:** ${totalRosterHeroes}\n`;
  md += `- **Source-Backed (Supported) Heroes:** ${totalDVSupported}\n`;
  md += `- **Curated-Only / Unsupported Heroes:** ${totalDVUnsupported}\n\n`;

  md += `### Supported Heroes:\n`;
  md += Array.from(sourceBackedDVHeroIds).map(id => `- \`${id}\``).join('\n') + `\n\n`;

  md += `### Unsupported Roster Heroes:\n`;
  const allRosterHeroIds = [
    ...HINDU_VEERS.map(v => v.id),
    ...SIKH_VEERS.map(v => v.id),
    ...JAIN_VEERS.map(v => v.id),
    ...BUDDHIST_VEERS.map(v => v.id)
  ];
  const unsupportedHeroIds = allRosterHeroIds.filter(id => !sourceBackedDVHeroIds.has(id));
  md += unsupportedHeroIds.map(id => `- \`${id}\` (degrades to safe fallback explanation)`).join('\n') + `\n\n`;

  md += `## 3. Other / Restricted / Pending Corpora\n\n`;
  md += `The following additional files exist in the ingestion manifests directory but are not part of the active, verified RAG core stories, or are pending full license checks:\n\n`;
  md += `| Manifest File | Total Items | Source-Backed | Restricted / Pending |\n`;
  md += `|---|---|---|---|\n`;
  for (const fileInfo of otherFiles) {
    try {
      const manifest = JSON.parse(fs.readFileSync(fileInfo.absPath, 'utf8'));
      const mRights = manifest.rights_status || 'restricted_or_pending';
      const items = manifest.content || [];
      const total = items.length;
      const restricted = items.filter((it: any) => (it.rights_status || mRights) === 'restricted_or_pending').length;
      const sourceBacked = items.filter((it: any) => (it.rights_status || mRights) === 'public_domain' && it.text).length;
      md += `| [${path.basename(fileInfo.name)}](file://${fileInfo.absPath}) | ${total} | ${sourceBacked} | ${restricted} |\n`;
    } catch (e) {}
  }
  md += `\n\n`;

  md += `## 4. Compliance and Integrity Flags\n\n`;
  if (flags.length === 0) {
    md += `✅ **No compliance flags raised.** All public domain content has specific source URLs, and no mock/synthetic content was detected.\n`;
  } else {
    md += `⚠️ **Found ${flags.length} compliance flags:**\n\n`;
    md += `| File | Ref | Type | Violation Details |\n`;
    md += `|---|---|---|---|\n`;
    for (const flag of flags) {
      md += `| \`${flag.file}\` | \`${flag.ref || 'N/A'}\` | \`${flag.type}\` | ${flag.message} |\n`;
    }
  }

  const outputPath = path.join(__dirname, '../docs/CONTENT_COVERAGE_REPORT.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`\nSuccessfully wrote compliance report to ${outputPath}`);

  console.log("\nQA Smoke Summary:");
  console.log(`- Flags Raised: ${flags.length}`);
  console.log(`- Active Corpora Checked: ${Object.keys(corpusMapping).length}`);
  console.log(`- Total Manifest Items Audited: ${Object.values(stats).reduce((acc, curr) => acc + curr.totalItems, 0) + otherTotalItems}`);
}

runContentQAReport();
