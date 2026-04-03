# Parampara Pathshala Plan

Last updated: 2026-04-03

## Product Recommendation

Rename `Parampara Library` to `Parampara Pathshala`.

Why:

- `Library` sounds passive and archival.
- `Pathshala` sounds lived, guided, and tradition-rooted.
- the app’s long-term moat is not random quote browsing, but structured study, memory, and return.

The right product shape is:

1. `Tradition first`
2. `Scripture category second`
3. `Complete text / learning track third`
4. `Quotes, highlights, flashcards, quizzes, and exams as support layers`

So the front door should become:

- `Hindu`
- `Sikh`
- `Buddhist`
- `Jain`

Then inside each tile:

- `Canonical texts`
- `Commentaries / explanations`
- `Daily study`
- `Courses and quizzes`

## Non-Negotiables

- Every text must have a legitimate source and clear rights status before it is stored in-product.
- Canonical text, translation, commentary, curated lesson, and AI reflection must never be visually conflated.
- If rights are not clear, use catalog metadata plus outbound links rather than ingesting the text.
- The first version should prefer trustworthy depth over fake exhaustiveness.

## Information Architecture

### Level 1: Tradition tiles

- `Hindu`
- `Sikh`
- `Buddhist`
- `Jain`

### Level 2: Scripture categories

Recommended first taxonomy:

- `Canonical`
- `Commentarial / Explanatory`
- `Practice / Daily recitation`
- `Learning tracks`

Recommended tradition-specific breakdown:

#### Hindu

- `Shruti`
  - Vedas
  - Upanishads
- `Itihasa`
  - Bhagavad Gita
  - Mahabharata
  - Ramayana
- `Sutra / Darshana`
  - Brahma Sutra
  - Yoga Sutra
- `Purana / Bhakti`
  - Bhagavata Purana and later devotional texts

#### Sikh

- `Guru Granth Sahib`
- `Nitnem / daily bani`
- `Dasam / Bhai Gurdas / panthic sources`
  Later and only with clear scope labels

#### Buddhist

- `Early Buddhist texts`
  - Sutta / Sutra
  - Vinaya
  - Abhidhamma / Abhidharma
- `Mahayana`
- `Tibetan canon and commentaries`

#### Jain

- `Svetambara Agams`
- `Digambara canonical and classical literature`
- `Foundational doctrine`
  - Tattvartha Sutra and beginner texts

## Source Strategy

This should be treated as a `Phase A trust requirement`, not a content-growth task.

| Tradition | Best source candidates found | What they are good for | Product risk / note |
| --- | --- | --- | --- |
| Hindu | Vedic Heritage Portal, Gita Supersite, GRETIL, Muktabodha Digital Library | Government-backed Vedic material, structured study views, machine-readable academic texts, specialized Shaiva/Shakta/Vedic corpora | Rights are fragmented. GRETIL explicitly excludes commercial use and is for scholarly reference; Gita Supersite contains multiple commentary layers with mixed rights; use only after rights audit or permission. |
| Sikh | BaniDB, SriGranth, SGPC context for canonical authority | Strongest developer-ready route for searchable Gurbani, translations, transliterations, and scripture structure | Best practical digital route today, but still confirm commercial usage, attribution, and terms with Khalis Foundation / source owners. |
| Buddhist | SuttaCentral, SuttaCentral GitHub data, 84000 | Strong early-Buddhist corpus, parallels, metadata, and open developer path; Tibetan canon expansion later | Best open-data candidate for Buddhist launch scope; Tibetan expansion should be staged separately. |
| Jain | Jain eLibrary | Broadest discovered corpus and taxonomy for Agams, commentaries, and literature | Jain eLibrary explicitly says materials are for individual private non-commercial use; do not ingest corpus into product without permission. |

## What The Research Supports

The most scientifically grounded Pathshala features are not “more quotes”.

They are:

1. `Practice testing / quizzes`
   Reason: retrieval practice improves long-term retention better than repeated rereading.

2. `Spaced flashcards and revisit loops`
   Reason: distributed practice improves recall over time.

3. `Interleaved review`
   Reason: mixing related categories helps learners discriminate among similar concepts.

4. `Mastery gates with retries`
   Reason: mastery-learning models improve performance, especially when learners receive corrective feedback and can retest.

So the strongest Pathshala features are:

- chapter-end quizzes
- sutra/shabad/verse flashcards
- spaced revision reminders
- mixed review across related categories
- mastery checkpoints before progressing
- “explain in your own words” reflection prompts

## Recommended Pathshala Features

### Phase A: trust and corpus foundation

- rename `Parampara Library` -> `Parampara Pathshala`
- redesign the IA to be `tradition -> scripture category -> text`
- create a source governance model for every text:
  - source owner
  - rights status
  - canonical vs commentary vs curated lesson
  - language/script availability
  - version / revision provenance
- build a `catalog-first` system so the product can be exhaustive in structure before it is exhaustive in full-text ingestion
- add source pages for every text with:
  - source label
  - tradition
  - category
  - script / transliteration / translation availability
  - rights / provenance note

### Phase B: learning engine

- chapter cards and bite-sized lessons
- flashcards from terms, verses, and concepts
- chapter quizzes
- unit exams
- mastery badges
- “continue where you left off”
- memory / recitation mode
- mentor / teacher review later

## Best Product Shape

### Pathshala homepage

Top:

- tradition tiles

Middle:

- `Start your study`
- `Continue learning`
- `Daily recitation`

Bottom:

- featured complete texts
- concept cards
- revision prompts

### Text page

For each scripture:

- overview
- text structure
- source note
- script toggle
- transliteration
- meaning / translation
- commentary layer
- quiz / flashcard / notes tab

## What Should Not Ship First

- unverified AI-generated explanations inside scripture pages
- “daily quote” as the main product shape
- random cross-tradition mixing without clear labels
- exams before the corpus metadata and categories are trustworthy
- scraped full corpora without rights clearance

## Recommended Build Sequence

1. `Phase A`
   Define Pathshala taxonomy and source governance.
2. `Phase A`
   Rename Library to Pathshala and make the UI tradition-first.
3. `Phase A`
   Build catalog pages with provenance and category structure.
4. `Phase B`
   Add bookmarks, reading plans, and continue-learning loops.
5. `Phase B`
   Add quizzes, spaced cards, and mastery checkpoints.
6. `Phase B`
   Add exams, badges, and mentor or scholar-linked study paths.

## Launch Scope Recommendation

The safest launch path is not “all scriptures fully ingested”.

It is:

- `Hindu`: start with a tightly rights-audited study core such as Bhagavad Gita, selected Upanishads, Yoga Sutras, and one Ramayana/Mahabharata path
- `Sikh`: strong candidate for a fuller launch path if BaniDB usage terms are confirmed
- `Buddhist`: strong candidate for an early-Buddhist path built from SuttaCentral-compatible data
- `Jain`: start catalog-first and permission-first before promising a full corpus

## Sources Used

- Vedic Heritage Portal: https://vedicheritage.gov.in/vedicaudit-2023/
- Vedic Heritage Portal Upanishads page: https://vedicheritage.gov.in/vedicaudit-2023/upanishads/
- Gita Supersite home: https://www.gitasupersite.iitk.ac.in/
- Gita Supersite about: https://www.gitasupersite.iitk.ac.in/about
- Gita Supersite text details: https://www.gitasupersite.iitk.ac.in/srimad/texts
- GRETIL home: https://gretil.sub.uni-goettingen.de/gretil.html
- GRETIL introduction and usage note: https://gretil.sub.uni-goettingen.de/gretinfobk.htm
- Muktabodha Digital Library: https://muktabodha.org/digital-library/
- Muktabodha overview: https://muktabodha.org/
- SriGranth overview: https://www.srigranth.org/guru_granth_sahib.html
- SriGranth search tips: https://www.srigranth.org/s_tips.html
- BaniDB about: https://www.banidb.com/about/
- BaniDB homepage: https://www.banidb.com/
- SuttaCentral overview: https://encyclopediaofbuddhism.org/wiki/SuttaCentral
- SuttaCentral GitHub org: https://github.com/suttacentral
- SuttaCentral API / server repo context: https://github.com/suttacentral/suttacentral
- 84000 project overview: https://khyentsefoundation.org/kf-projects/84000/
- 84000 Tengyur catalog milestone: https://84000.co/news-event/press-release-worlds-first-english-catalog-of-the-collected-treatises-of-the-ancient-buddhist-world-now-complete
- Jain eLibrary home: https://jainelibrary.org/
- Jain eLibrary Agam search/about note: https://jainelibrary.org/faq/agam-search/
- Jain eLibrary Agam listing: https://jainelibrary.org/aagam-listing/
- Retrieval practice: https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x
- Spacing review: https://pubmed.ncbi.nlm.nih.gov/16719566/
- Spacing + retrieval review: https://www.nature.com/articles/s44159-022-00089-1
- Effective learning techniques review: https://journals.sagepub.com/doi/10.1177/1529100612453266
- Mastery learning meta-analysis: https://journals.sagepub.com/doi/10.3102/00346543060002265
