# Shoonaya Private AI — Phase 1 Plan

Last updated: 2026-05-19

## Goal

Build the first private AI foundation for Shoonaya without training a model from scratch and without sending sensitive user spiritual data to third-party AI providers.

Phase 1 is not “build our final AI.”
Phase 1 is:

- private corpus architecture
- retrieval and grounding
- AI gateway and policy layer
- one or two migrated app features
- evaluation harness

## Phase 1 outcome

At the end of this phase, Shoonaya should have:

1. a structured scripture/content corpus
2. metadata-rich chunking for retrieval
3. a private AI gateway contract
4. a working retrieval layer
5. one grounded feature in production shape:
   - `Pathshala explain`
6. one secondary feature ready after that:
   - `Hindi/Punjabi meaning generation`
7. an evaluation suite to measure quality

## Product scope

### In scope

- Pathshala explanation
- scripture search and retrieval
- source-aware meaning generation
- source-aware Dharma AI chat groundwork
- moderation-assist groundwork

### Out of scope

- Panchang calculation
- Jyotish astronomy/math
- entitlement logic
- notification eligibility logic
- family privacy/permission logic
- model pretraining from scratch
- speech model training

These should remain deterministic or separate systems.

## Architecture

Phase 1 should be built in 5 layers.

### 1. Content truth layer

Source-controlled corpus with metadata for:

- scripture text
- translation
- commentary metadata
- rights state
- tradition
- language
- script
- source class

### 2. Retrieval layer

Responsible for:

- chunking
- embeddings
- vector search
- metadata filtering
- optional reranking

### 3. AI gateway

Responsible for:

- feature routing
- privacy scope checks
- context building
- prompt templates
- model routing
- audit metadata

### 4. Feature adapters

One adapter per app use case:

- `/api/pathshala/explain`
- `/api/i18n/meaning`
- later `/api/ai/chat`
- later moderation/classification routes

### 5. Evaluation layer

Responsible for:

- regression tests
- source-grounding tests
- multilingual quality checks
- refusal behavior checks

## Recommended model stack

### Primary text model

Start with:

- `Sarvam-30B`

Reason:

- better India-language coverage than generic small open models
- practical self-host candidate
- strong enough for explanation and assistant flows

### Translation model

Start with:

- `IndicTrans2`

Use for:

- Hindi meaning generation
- Punjabi meaning generation
- language-side transformation tasks

### Embedding / classification model

Start with:

- `IndicBERT`

Use for:

- metadata tagging
- smaller classification tasks
- possible reranking experiments later

### Sanskrit specialist helper

Optional research helper only:

- `SanskritBERT`

Do not make it the primary product model.

## Python-first implementation

Use Python for:

- corpus processing
- chunking
- embeddings
- evaluation scripts
- LoRA fine-tuning later
- inference wrappers if needed

## Repo / workspace structure

Recommended addition:

```text
python/
  ai_pipeline/
    README.md
    pyproject.toml
    corpus/
      raw/
      normalized/
      manifests/
    chunking/
      chunk_scriptures.py
      chunk_utils.py
    embeddings/
      build_embeddings.py
      embedding_models.py
    retrieval/
      search.py
      filters.py
      rerank.py
    datasets/
      instruction/
      evals/
    training/
      lora/
      configs/
    serving/
      gateway_client.py
      model_router.py
    evals/
      run_evals.py
      score_grounding.py
      score_translation.py
```

Recommended app-side structure:

```text
src/lib/ai/
  contracts.ts
  router.ts
  policies.ts
  context-builder.ts
  retrieval.ts
  prompts/
  eval-metadata.ts
  providers/
```

## Corpus schema

Every content object should be stored with these fields.

### Document-level fields

- `doc_id`
- `title`
- `tradition`
- `scripture_family`
- `section_id`
- `source_name`
- `source_url`
- `source_owner`
- `source_class`
  - `canonical`
  - `translation`
  - `commentary`
  - `curated_lesson`
  - `ai_reflection`
- `rights_status`
  - `public_domain`
  - `rights_cleared`
  - `companion_only`
  - `catalog_only`
  - `restricted_or_pending`
- `language`
- `script`
- `is_live_in_app`
- `companion_only`
- `audio_status`
- `revision_note`

### Chunk-level fields

- `chunk_id`
- `doc_id`
- `chunk_text`
- `normalized_text`
- `chunk_order`
- `start_ref`
- `end_ref`
- `tradition`
- `scripture_family`
- `section_id`
- `source_class`
- `rights_status`
- `language`
- `script`
- `tags`
- `embedding_model`
- `embedding_version`

## Vector metadata filters

Minimum retrieval filters:

- `tradition`
- `section_id`
- `scripture_family`
- `source_class`
- `rights_status`
- `language`
- `is_live_in_app`

Hard rule:

- `companion_only` content can be retrieved as metadata/reference context
- but should not be surfaced as if full in-app text exists

## Privacy policy for the AI system

### Allowed in Phase 1 prompts

- selected verse text
- source metadata
- user language preference
- transliteration preference
- meaning language preference
- tradition

### Not allowed in Phase 1 training data

- raw family/Kul data
- messages/private Mandali content
- birth details
- journaling
- mood history
- private practice sessions

### Rule

No sensitive user data should be used for training by default.
Personal data may be used only at request time under explicit feature scope.

## First features to migrate

### Feature 1: Pathshala explain

This should be the first migration target.

Reason:

- high value
- already corpus-centric
- easy to evaluate
- strong trust benefit

Flow:

1. user opens verse/text
2. app sends `doc_id`, `chunk_id`, tradition, language prefs
3. AI gateway retrieves nearby chunks and source metadata
4. model answers in a source-aware format
5. UI labels response clearly as explanation, not canonical text

### Feature 2: Hindi/Punjabi meaning generation

Second migration target.

Reason:

- high user value
- tightly scoped
- easier evaluation than full chat

Flow:

1. scripture text + source metadata
2. translation pipeline
3. optional LLM cleanup for readability
4. save as generated meaning layer, not canonical layer

### Feature 3: Dharma AI chat grounding

Third migration target.

Only after retrieval and source policy are stable.

## AI response contract

Every grounded response should return:

- `answer`
- `answer_type`
  - `explanation`
  - `meaning`
  - `study_support`
  - `reflection`
- `sources`
- `confidence`
- `warnings`
- `language`
- `tradition`
- `generated_at`
- `model_name`
- `prompt_version`

## Evaluation suite

Build eval datasets before LoRA.

### Eval set 1: Pathshala explain

Examples:

- Gita verses
- Upanishad passages
- Gurbani passages
- Dhammapada passages
- Jain doctrinal passages

Check for:

- source grounding
- no fabricated citations
- distinction between text and explanation
- tradition-aware vocabulary
- readability

### Eval set 2: Hindi meaning

Check for:

- semantic accuracy
- no commentary drift when meaning is intended
- script correctness
- respectful tone

### Eval set 3: refusal / uncertainty

Examples:

- asks for exact ritual timing beyond source confidence
- asks for unsupported canon coverage
- asks for claims beyond source status

Check for:

- correct refusal
- correct uncertainty wording

## Prompt policy

Every feature prompt should include:

1. source discipline
2. answer lane discipline
3. tradition vocabulary discipline
4. rights/trust discipline
5. no overclaim rule

Example policy constraints:

- never present AI reflection as canonical text
- do not invent source citations
- if source status is incomplete, say so
- if asked beyond confidence, recommend trusted human/official source

## Serving approach

### Phase 1 recommendation

- self-host inference behind a private gateway
- use `vLLM` for the primary LLM
- keep translation/classification as separate services or offline jobs

### API shape

- `POST /api/ai/pathshala-explain`
- `POST /api/ai/meaning-generate`
- later `POST /api/ai/chat`

These app routes should call your private gateway, not raw model code directly.

## LoRA training plan for later

Do this only after retrieval and evals are stable.

### First LoRA target

Fine-tune for:

- Shoonaya answer style
- source-aware formatting
- tradition-aware terminology
- multilingual output discipline
- refusal behavior

### Not for first LoRA

- Panchang logic
- general Sanskrit reasoning
- speech generation
- open-ended therapy-style behavior

## Delivery sequence

### Phase 1A — corpus and retrieval

Build:

- corpus manifest format
- normalization pipeline
- chunking pipeline
- embeddings pipeline
- vector index

### Phase 1B — AI gateway

Build:

- request contract
- context builder
- policy enforcement
- source-aware prompt template

### Phase 1C — first migrated feature

Build:

- Pathshala explain on private retrieval
- response source panel
- eval suite for explanation quality

### Phase 1D — second migrated feature

Build:

- Hindi/Punjabi meaning generation
- generated-layer labeling
- translation evals

### Phase 1E — training readiness

Build:

- instruction dataset format
- eval benchmark harness
- first LoRA config

## Concrete next tasks

1. Create `python/ai_pipeline/` scaffold
2. Define corpus manifest JSON schema
3. Export current Pathshala corpus into normalized documents
4. Build scripture chunker
5. Build embedding pipeline
6. Define `src/lib/ai/contracts.ts`
7. Add `src/lib/ai/policies.ts`
8. Add private retrieval adapter
9. Migrate `Pathshala explain`
10. Build eval dataset for 50-100 explanation cases

## Success criteria

Phase 1 is successful when:

- Pathshala explain works from private retrieval
- answers are grounded and source-aware
- no sensitive user data is required for model training
- Hindi/Punjabi meaning generation is pipeline-ready
- the app has one AI contract instead of scattered AI logic
- fine-tuning can start only after eval baselines exist

## Strategic recommendation

The correct first milestone is:

**Shoonaya Pathshala Explain running on a private retrieval-backed AI gateway**

Not:

**train our own Sanskrit model first**

That is the right scope, cost, and product-quality sequence.
