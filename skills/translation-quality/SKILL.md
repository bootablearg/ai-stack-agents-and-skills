---
name: translation-quality
description: "Comprehensive professional translation skill using Agent Teams. Orchestrates parallel terminology verification, translation with layout preservation, quality review, revision, and professional typesetting — all in one workflow. Use this skill whenever translating documents where accuracy and professional output matter — especially documents with specialized terminology, proper nouns, organization names, or technical content. Triggers on: 'translate with quality check', 'accurate translation', 'verify terminology', 'professional translation', '高质量翻译', '术语核查', '专业翻译', or any translation task involving professional/official documents. Also use when the user has previously encountered translation errors (fabrication, inconsistent terminology, missed content) and wants a more rigorous process. This skill subsumes translation-layout (structure preservation) and formal-doc-layout (professional typesetting) — you do NOT need to invoke those skills separately."
---

# Translation Quality — Multi-Agent Professional Translation

This skill orchestrates a complete professional translation pipeline using Agent Teams. It combines:
- **Translation with structure preservation** (absorbs translation-layout)
- **Terminology verification via web search** (new capability)
- **Independent quality review** (new capability)
- **Revision based on review feedback** (new capability)
- **Professional document typesetting** (absorbs formal-doc-layout)

## Architecture Overview

```
              User: "翻译这个文档"
                      │
            Team Lead (this session)
            TeamCreate ─ estimate terms
                      │
    ┌─────────────────┼──────────────────┐
    │           ≤50 terms │ >50 terms    │
 translator    term-      │ term-fast    reviewer
 (Sonnet)      researcher │ term-deep    (Opus)
    │          (Sonnet)   │ (both Sonnet) (waiting)
 Phase 1A:     Phase 1B: │ Phase 1B:       │
 First-pass    web search │ parallel        │
 translation   verify     │ search          │
    │              │      │   │  │          │
    │              │    Phase 1.5:          │
    │              │    Lead merges →       │
    │    ← terminology-glossary.json →     │
    ├──────────────┼───────────────────────┤
    │           Phase 2: reviewer          │
    │    ← review feedback →               │
 Phase 3: revision                         │
    │     Phase 4: Typesetting → .docx/.pdf
```

## Prerequisites

**Decide the execution mode FIRST** — same pipeline, contracts and quality gates in
both; only concurrency differs. **Mode A (parallel)**: Claude Code with
`"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"` in `~/.claude/settings.json` → `"env"`.
**Mode B (sequential)**: the fallback whenever `TeamCreate` is unavailable — Codex,
Gemini CLI, Copilot CLI, OpenCode, or Claude Code without the flag; never abort over
it. Read `references/execution-modes.md` before starting — it covers how to keep
reviewer independence in Mode B, plus available host tooling. State the mode in one line.

---

## Phase 0: Team Lead Preparation

### 0.1 Read and Analyze Source Document

Read the source document completely. Determine:
- Source language and target language
- Document type (conference agenda, contract, report, academic paper, etc.)
- Estimated length (pages/sections)
- Whether specialized terminology is present

**Source format handling (critical for structure preservation):**
- If source is .doc or .docx, convert to **HTML**, never to txt: plain text STRIPS
  table structure and the translator cannot preserve tables it cannot see. Use
  `soffice --headless --convert-to html --outdir <workspace> "$SOURCE"` (macOS:
  `textutil -convert html`), then rename the output to `source.html`.
- **Verify it**: the HTML MUST exist and contain `<table>` tags if the source had
  tables; else stop and ask the user for an .html/.md source. Never translate a
  structure-less document.
- Save HTML to ~/workspace/temp/translation-workspace/source.html (keep the original)

**Chunking (if >10 pages):**
1. Estimate pages: count paragraphs in HTML body, ~35 paragraphs ≈ 1 page
2. If ≤10 pages: skip chunking, proceed as single-chunk mode
3. If >10 pages: identify chapter boundaries in HTML — look for:
   - `<h1>`, `<h2>` tags, OR
   - Bold paragraphs with larger font-size (Word's heading style), OR
   - Paragraphs matching "一、" "二、" "三、" etc. (Chinese section numbering)
4. Group sections into chunks of ≤10 pages each. Never split inside a `<table>` block
5. Save chunks to ~/workspace/temp/translation-workspace/chunks/chunk-{N}.html
6. Record boundaries in ~/workspace/temp/translation-workspace/chunk-manifest.md

**Structural manifest** — the lead MUST produce before spawning agents:
Scan the source (use .html version) and record:
- Number of tables, each table's column count and row count
- Content that lives INSIDE table cells (especially multi-item cells like
  "10 presentations listed inside a single schedule row")
Save to ~/workspace/temp/translation-workspace/structure-manifest.md

### 0.2 Create Workspace

```bash
# Create a workspace directory for this translation
mkdir -p ~/workspace/temp/translation-workspace
```

All agents will read from and write to this workspace.

### 0.3 Define Contracts

**Before spawning any teammate**, define these contracts:

**Contract 1 — Terminology Glossary (term-researcher → translator, reviewer):**
See `references/glossary-schema.md` for full JSON schema and example.
Confidence: high (2+ sources), medium (1 source), low (best judgment).
Categories: organization, person, place, venue, title, technical, product, event

**Contract 2 — Review Feedback (reviewer → translator):**
See `references/review-feedback-schema.md` for format and example.
Issue types by priority: FABRICATION > OMISSION > TERMINOLOGY > ACCURACY > STRUCTURE > REGISTER

**Contract 3 — Workspace Paths:**
```
~/workspace/temp/translation-workspace/
├── source.* / source.html          # Source document + HTML conversion
├── structure-manifest.md           # Lead's structural inventory
├── chunks/                         # Only if >10 pages
│   └── chunk-{N}.html
├── chunk-manifest.md               # Chunk boundaries (if chunked)
├── first-pass.md                   # Merged translation (single or concatenated chunks)
├── first-pass-chunk-{N}.md         # Per-chunk output (if chunked)
├── structure-report[-chunk-{N}].md # Structure audit (per chunk if chunked)
├── glossary-fast.json              # Split mode only: names, places
├── glossary-deep.json              # Split mode only: orgs, technical
├── terminology-glossary.json       # Final merged glossary (always)
├── review-feedback.md              # Reviewer feedback (on merged first-pass.md)
└── final-translation.md            # Final revised translation
```

### 0.4 Create Team and Tasks

```
TeamCreate("translation-team")

Estimate term count: scan source for org suffixes (协会/委员会/公司/集团/局/院/所),
quoted proper nouns, person names with titles, and English acronyms.
Heuristic: ~8-10 proper nouns per page. A 7-page doc ≈ 60-70 terms → split mode.

If single chunk (≤10 pages):
  Task 1: "First-pass translation" → translator (Sonnet)
  If ≤50 terms (estimated):
    Task 2: "Verify terminology" → term-researcher (Sonnet)
  If >50 terms (estimated):
    Task 2a: "Verify terminology (fast: names, places)" → term-researcher-fast (Sonnet)
    Task 2b: "Verify terminology (deep: orgs, technical)" → term-researcher-deep (Sonnet)
    Both 2a+2b run in PARALLEL. Lead merges outputs before reviewer starts (Phase 1.5).
  Task 3: "Review translation"     → reviewer (Opus), depends on Task 1 + Task 2 (or 2a+2b)
  Task 4: "Revise translation"     → translator, depends on Task 3

If N chunks (>10 pages):
  Task 1..N:  "Translate chunk {i}" → translator-{i} (one Sonnet agent per chunk)
  Term tasks: same ≤50/>50 split as above (Task N+1, or N+1a and N+1b)
  Task N+2:   "Review translation"  → reviewer (depends on all prior tasks)
  Task N+3:   "Revise translation"  → translator-1 (depends on Task N+2)

All translators run in PARALLEL. term-researcher(s) also run in parallel with them.
Reviewer waits for ALL to complete.

Model assignments:
  translator / translator-{N}:  Sonnet (model: sonnet) — speed for volume
  term-researcher:               Sonnet (model: sonnet) — web search + extraction
  term-researcher-fast (split):  Sonnet (model: sonnet) — names, places
  term-researcher-deep (split):  Sonnet (model: sonnet) — orgs, technical terms
  reviewer:                      Opus   (model: opus)   — maximum accuracy for review
```

---

## Phase 1: Parallel Execution

### Spawn Prompt — translator (Sonnet)

```
You are the translator for this team. Your model should be Sonnet for speed.

OWNERSHIP:
- You own: ~/workspace/temp/translation-workspace/first-pass.md, ~/workspace/temp/translation-workspace/final-translation.md
- Do NOT modify any other workspace files

TASK — PHASE 1 (First-pass translation):
1. Read the structure manifest at ~/workspace/temp/translation-workspace/structure-manifest.md
2. Read the source document at [SOURCE_PATH] (use .html version if available)
3. Translate from [SOURCE_LANG] to [TARGET_LANG]
4. Save to ~/workspace/temp/translation-workspace/first-pass.md

STRUCTURE PRESERVATION RULES (critical):
These rules ensure the translation mirrors the original document's structure exactly.

Tables:
- Same number of columns, same column order, same column purposes
- Same number of rows with 1:1 row correspondence
- If original merges cells, merge the same cells
- NEVER convert tables to lists or lists to tables
- NEVER add/remove/reorder columns
- Content inside a table row in the original MUST stay inside a table row

COMMON VIOLATIONS (from real failures — do NOT repeat):
- Transportation table was converted to H2 headings + paragraphs because
  the .txt source lost table markup. ALWAYS use the .html source.
- 10 keynote presentations inside a single table cell (09:00-12:00 row)
  were pulled out as free text below the table. If items are inside a cell,
  they STAY inside that cell, even if the cell content is long.
- Dining info as free text (field: value) was converted to a table.
  Free text stays free text — do not create tables that don't exist in source.

Headings:
- Match heading hierarchy level for level (H1→H1, H2→H2)
- Do not add or remove headings

Lists:
- Preserve numbering scheme and nesting depth
- Ordered stays ordered, unordered stays unordered

Paragraphs:
- Maintain exact content sequence — paragraph order must not change
- Do not merge or split paragraphs
- Preserve alignment (centered stays centered)

MANDATORY STRUCTURE REPORT:
Before saving first-pass.md, write ~/workspace/temp/translation-workspace/structure-report.md:

For EACH table in the structure manifest:
  Table [N]: source=[R] rows x [C] cols → translation=[R] rows x [C] cols

For content boundaries:
  List every multi-item cell from the manifest, confirm items stayed inside:
    Table [N] row [R]: "[content summary]" → inside cell / BOUNDARY VIOLATION

Totals: [N] tables matched, [N] boundary violations
If boundary violations > 0, FIX before saving first-pass.md.

ANTI-FABRICATION RULES:
- NEVER invent content not in the source
- If unclear, mark as [unclear in original]
- Mark uncertain terminology with [?原文?] for the term-researcher to verify
- Person names: transliterate from pinyin, never replace with different names
- Venue names that are proper nouns within a building: transliterate (e.g., 美泉宫 as a conference room → "Meiquangong Hall"), do not translate as the famous landmark
- Numbers, dates, booth numbers: copy exactly from source

COMMUNICATION:
- After saving first-pass.md, mark Task 1 as completed
- Wait for Task 4 to be assigned — you will receive review feedback
  and terminology glossary via SendMessage
- For Phase 3 (revision): apply ALL critical and major fixes from
  review-feedback.md, apply glossary corrections, then save to
  ~/workspace/temp/translation-workspace/final-translation.md and mark Task 4 complete

REVISION STRUCTURE PROTECTION (critical):
  During revision, you MUST only change text — NEVER restructure the document.
  - Do NOT pull content out of table cells into free text
  - Do NOT convert table cells with <br> line breaks into numbered lists outside the table
  - Do NOT convert free text sections into tables
  - Do NOT change the number of rows or columns in any table
  - Keep all multi-item cells intact: replace terms IN PLACE using find-and-replace
  - If in doubt, use exact string replacement rather than rewriting sections
  Violation of these rules was observed in real testing and caused 13 structure failures.
```

### Spawn Prompt — translator-{N} (Sonnet) [chunked mode]

Same rules as the standard translator prompt above, with these overrides:
- SOURCE: Read ~/workspace/temp/translation-workspace/chunks/chunk-{N}.html
- OUTPUT: Save to ~/workspace/temp/translation-workspace/first-pass-chunk-{N}.md
- STRUCTURE REPORT: Save to ~/workspace/temp/translation-workspace/structure-report-chunk-{N}.md
- Read the GLOBAL structure-manifest.md (covers all tables in all chunks)
- Read the GLOBAL terminology-glossary.json (when available)
- Your chunk covers: [SECTIONS_FROM_CHUNK_MANIFEST]
- Mark Task {N} complete when done

### Spawn Prompt — term-researcher (Sonnet)

```
You are the terminology researcher for this team.

OWNERSHIP:
- You own: ~/workspace/temp/translation-workspace/terminology-glossary.json
- Do NOT modify any other workspace files

TASK:
1. Read the source document at [SOURCE_PATH]
2. Extract ALL:
   - Organization names (协会, 委员会, 公司, 集团, etc.)
   - Person names with titles
   - Place names and venue names
   - Event names and conference names
   - Technical/specialized terms
   - Product names and brand names
   - Any proper noun

3. For EACH term, verify via web search (try in order):
   "[原文]" official English name → site:official-website → org's own English page →
   bilingual government/industry databases → person's published English name
   If translating EN→ZH, reverse search direction.

4. Score confidence: high (2+ sources agree), medium (1 source), low (best judgment)
5. Record source URLs as evidence for every term
6. Save JSON to ~/workspace/temp/translation-workspace/terminology-glossary.json
   following the schema in `references/glossary-schema.md`
7. SendMessage glossary summary to "translator" and "reviewer"
8. Mark your task as completed

IMPORTANT: Search in batches of 5 terms. For low-confidence terms, clearly note this.

WEB SEARCH FALLBACK: If a search fails or times out, retry once. After 2 consecutive
failures for a term, mark it as confidence: "low" with notes: "web search unavailable"
and MOVE ON. Do NOT block the entire glossary for a few unreachable terms. If ALL
searches fail (service down), produce a glossary using best judgment for all terms,
mark all as low confidence, and note "web search unavailable" in metadata.

Record timing: note your start time and end time in metadata (ISO 8601) so Lead can
measure researcher duration for future threshold calibration.
```

### Spawn Prompt — term-researcher-fast (Sonnet) [split mode, >50 terms]

Same rules as the standard term-researcher prompt, with these overrides:
- SCOPE: Person names, place names, venue names, product names ONLY
- Skip: organizations, technical terms, event names (handled by deep researcher)
- Search strategy: prioritize Google Scholar, ResearchGate, university websites
- For person names: check published English name, default to standard Pinyin
- OUTPUT: Save to ~/workspace/temp/translation-workspace/glossary-fast.json
- Mark your task complete when done. Do NOT write to terminology-glossary.json.

### Spawn Prompt — term-researcher-deep (Sonnet) [split mode, >50 terms]

Same rules as the standard term-researcher prompt, with these overrides:
- SCOPE: Organization names, technical/specialized terms, event names ONLY
- Skip: person names, place names, venues, products (handled by fast researcher)
- Search strategy: prioritize official websites, government databases, industry associations
- OUTPUT: Save to ~/workspace/temp/translation-workspace/glossary-deep.json
- Mark your task complete when done. Do NOT write to terminology-glossary.json.

### Spawn Prompt — reviewer (Opus)

```
You are the quality reviewer for this team. Use Opus model for maximum accuracy.

OWNERSHIP:
- You own: ~/workspace/temp/translation-workspace/review-feedback.md
- Do NOT modify any other workspace files

TASK:
Wait for Tasks 1 and 2 (or 2a+2b) to both complete, then:

1. Read the source document at [SOURCE_PATH]
2. Read the first-pass translation at ~/workspace/temp/translation-workspace/first-pass.md
3. Read the terminology glossary at ~/workspace/temp/translation-workspace/terminology-glossary.json
   PRE-CHECK: Verify glossary has total_terms > 0 and the count is plausible
   for the document size (~8-10 terms/page). If glossary is empty or missing,
   alert Lead via SendMessage before proceeding — do NOT review without it.

4. Perform a systematic review with these priorities (highest first):

   a. FABRICATION CHECK (critical):
      - Go paragraph by paragraph through the translation
      - For EACH paragraph, verify it corresponds to source content
      - Flag ANY content in the translation that does not exist in the source
      - Flag any numbers, names, or facts that differ from the source

   b. STRUCTURE CHECK (critical):
      Read ~/workspace/temp/translation-workspace/structure-manifest.md (lead's counts)
      and ~/workspace/temp/translation-workspace/structure-report.md (translator's counts).
      Independently verify:
      - For EACH table: count rows and columns in source vs translation
      - For EACH multi-item cell: verify items are still inside the cell
      - No free text → table or table → free text conversions
      Output a STRUCTURE COMPARISON TABLE in the review:
      | Element | Source | Translation | Match? |
      |---------|--------|-------------|--------|
      | Table 1 rows | 5 | 5 | YES |
      | Table 3 cell 09:00-12:00 items | 10 | 3 (7 moved out) | NO |
      Any "NO" is a CRITICAL issue.

   c. OMISSION CHECK (critical):
      - Go paragraph by paragraph through the SOURCE
      - Verify every paragraph has a corresponding translation
      - Flag any source content missing from the translation

   d. TERMINOLOGY CHECK (major):
      - For every term in the glossary, find it in the translation
      - Verify the translation uses the glossary's verified translation
      - Flag any deviations

   e. ACCURACY CHECK (major):
      - All numbers match source exactly
      - All dates match source exactly
      - All proper names match glossary or source transliteration
      - Venue/room names handled correctly (transliterated, not literally translated)

   f. REGISTER CHECK (minor):
      - Style matches document type (formal for official docs, etc.)
      - Consistent tone throughout

5. Save review to ~/workspace/temp/translation-workspace/review-feedback.md using this format:

   ## Review Feedback for [DOCUMENT_NAME]

   ### Critical Issues (MUST fix)
   1. [Location: Section/Table/Para] TYPE: "problematic text"
      — source says "原文". Fix: "corrected text"

   ### Major Issues (SHOULD fix)
   ...

   ### Minor Issues (CONSIDER fixing)
   ...

   ### Statistics
   - Critical: N issues
   - Major: N issues
   - Minor: N issues
   - Fabricated content found: yes/no
   - Omitted content found: yes/no
   - Terminology compliance: N/M terms correct (N%)
   - Structure compliance: [N]/[N] tables match, [N] boundary violations (detail in comparison table above)

6. SendMessage the review summary to "translator":
   "Review complete: X critical, Y major, Z minor issues found.
    Full feedback at ~/workspace/temp/translation-workspace/review-feedback.md
    [If critical issues]: CRITICAL: Found fabricated/omitted content — see feedback."

7. Mark Task 3 as completed
```

---

## Phase 1.5: Lead Merges Glossaries (only if 2 researchers)

1. Wait for both term-researcher-fast and term-researcher-deep to complete
2. Read glossary-fast.json and glossary-deep.json
3. Merge `terms` arrays, deduplicate by `original` field
4. Recalculate metadata totals (total_terms, high/medium/low counts)
5. Save merged result to ~/workspace/temp/translation-workspace/terminology-glossary.json
6. Reviewer and translator-revision both read the merged file

---

## Phases 2-3: Review and Revision (Automatic)

Phase 2: Reviewer starts automatically when Tasks 1+2 complete.
Phase 3: Translator receives feedback, applies all critical/major fixes and glossary corrections, saves final-translation.md.
No lead intervention needed for either phase.

---

## Phase 3.5: Lead Merges Chunks (only if chunked)

1. Concatenate first-pass-chunk-1.md ... first-pass-chunk-N.md → first-pass.md (in order)
2. Quick scan: fix any duplicate headings or broken numbering at chunk seams
3. Reviewer then receives the merged first-pass.md — reviews as a whole document

---

## Phase 4: Lead Validation and Typesetting

### 4.1 End-to-End Validation

After all tasks complete, the lead performs final verification:

1. **Spot-check fabrication**: Pick 5 random paragraphs, verify each against source
2. **Terminology compliance**: Sample 10 glossary terms, verify they appear correctly in final translation
3. **Structure check**: Read reviewer's Structure Comparison Table from review-feedback.md.
   Verify any "NO" items were fixed in final translation.
4. **Completeness**: Verify first and last paragraphs of each major section are translated

If critical issues remain, SendMessage corrections to translator for another revision pass.

### 4.2 Professional Typesetting

Read `references/typesetting-rules.md` for complete font, spacing, page layout, table design, and implementation specifications (docx-js and reportlab). Key principles:
- English text: Times New Roman; Chinese text: SimSun (宋体)
- Document title 22pt bold centered; H1 16pt bold; H2 14pt bold; body 12pt regular
- Tables: thin borders (#999999), gray header (#E8E8E8), full content width
- A4 page, 1-inch margins, 1.25x line spacing
- No decorative elements — clean, professional, minimalist

### 4.3 Generate Output

**Always deliver `final-translation.md`** — primary artifact, never fails. Then add
`.docx`/`.pdf` on top of it. There are NO `docx`/`pdf` skills on this stack; do not
try to invoke them. See "Output generation" in `references/typesetting-rules.md` for
the converter chain (LibreOffice → python-docx → `.md`-only with an explicit warning).
Save outputs next to the source document and report the final paths.

---

## Anti-Fabrication Checklist

Read `references/anti-fabrication-checklist.md` for the full prevention and detection methodology. Key points:
- NEVER add content not in the source; NEVER change numbers/names/dates
- Translator: paragraph-by-paragraph correspondence, mark unclear as [unclear in original]
- Reviewer: forward pass (translation→source) + backward pass (source→translation) to catch fabrication and omission
- Watch for: number inflation, name substitution, venue confusion, content padding, summary substitution

---

## Notes
Scaling: see `references/scaling-guidelines.md` (≤10 pages = 1 translator; >10 pages = chunk + parallel; >50 terms = 2 term-researchers). Self-contained skill; do NOT invoke translation-layout or formal-doc-layout separately.
