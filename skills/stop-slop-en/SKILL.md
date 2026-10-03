---
name: stop-slop-en
description: Edits English prose to remove predictable AI writing patterns while preserving factual accuracy, legal meaning, and the author's voice. Use when drafting, editing, reviewing, or polishing English copy, documentation, articles, emails, or marketing text that sounds generic, formulaic, or AI-generated.
license: MIT
metadata:
  author: Hardik Pandya
  upstream: hardikpandya/stop-slop@8da1f030185bdfe8471220585162991eaeb970e9
  language: en
---

# Stop Slop — English

Apply this pass after the content is substantively correct. Preserve facts, technical terms, quotes, legal meaning, brand terminology, and intentional voice choices.

## Core rules

1. Cut filler openers, emphasis crutches, and empty intensifiers. See [phrases](references/phrases.md).
2. Replace formulaic contrasts, rhetorical setups, negative listings, and dramatic fragments with direct claims. See [structures](references/structures.md).
3. Prefer active voice when the actor is known. Do not invent an actor to avoid passive voice.
4. Replace vague claims with concrete details, evidence, scope, or a narrower statement.
5. Name the person, team, system, or source responsible. Avoid false agency by inanimate things.
6. Vary sentence and paragraph rhythm without forcing fragments or slogans.
7. Remove em dashes unless their removal would alter a quotation, code, or required house style.
8. Keep the reader's context in view. Directness must not remove necessary qualification, safety guidance, or empathy.

## Quick pass

Before delivering English prose, check:

- Filler, business jargon, meta-commentary, and empty adverbs.
- Binary reframes such as “not X, but Y.”
- Passive constructions that hide a known actor.
- Vague declarations without a concrete consequence or example.
- Three consecutive sentences or paragraphs with the same cadence.
- Pull-quote endings that sound manufactured.
- Claims whose precision, tone, or legal meaning would change if shortened.

## Score

Rate each dimension from 1 to 10: directness, rhythm, trust, authenticity, and density. Revise below 35/50.

## References

- [Phrases to remove](references/phrases.md)
- [Structures to avoid](references/structures.md)
- [Before/after examples](references/examples.md)

## Attribution

Adapted from `hardikpandya/stop-slop` under the MIT License. The included `LICENSE` preserves the original notice.
