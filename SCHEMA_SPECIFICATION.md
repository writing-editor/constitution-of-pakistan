# Unified Constitution Schema Specification (v2.0)

This specification defines the schema for `constitution_of_pakistan.json`. 
When prompting an LLM to add new properties (e.g., Urdu translations or case-law citations), provide only this specification and the target article chunk.

---

## 1. Top-Level Structure

```json
{
  "title": "The Constitution of the Islamic Republic of Pakistan (1973)",
  "metadata": {
    "version": "1973_as_amended_2025",
    "total_articles": 337,
    "schema_version": "2.0.0_unified"
  },
  "preamble": { ... },
  "entities": [ ... ],
  "articles": [ ... ]
}
```

---

## 2. Article Object Schema

```json
{
  "article_number": "48",
  "original_title": "President to act on advice, etc.",
  "status": "active",
  "chapter_path": "Part III > Chapter 1 > The President",
  "article_summary": {
    "core_purpose": "Formal constitutional function in 1-2 sentences.",
    "layman_summary": "Plain English summary for general citizens.",
    "historical_context": "Drafting history, major amendments (18th/27th), judicial background.",
    "status": "filled"
  },
  "article_level_tags": ["executive-advice", "presidential-powers", "dissolution"],
  "article_level_amendments_summary": [
    {
      "act": "Constitution (Eighteenth Amendment) Act, 2010",
      "change": "Inserted 'on and' and timing words.",
      "clause": "1"
    }
  ],
  "search_term": "Article 48 Constitution of Pakistan 1973 President to act on advice legal analysis case law",
  "full_text_verbatim": "Verbatim copy of the article as printed in source...",
  "clauses": [ ... ],
  "notes_for_reviewer": "Internal compiler/QA notes explaining OCR artifacts, footnote tracking, or historical numbering gaps..."
}
```

### Allowed Article Status Values:
* `"active"` — Operating provision.
* `"omitted"` — Repealed or deleted provision (e.g., Article 184, 186, 247). `clauses` array is `[]`.
* `"partially_omitted"` — Active article with specific omitted internal sub-clauses.

---

## 3. Clause Node Schema (Recursive Tree)

Every clause node in `clauses` mirrors the document's printed hierarchical markers (`"1"`, `"a"`, `"i"`, `"0"`).

```json
{
  "id": "1",
  "text": "In the exercise of his functions, the President shall act on and in accordance with the advice of the Cabinet or the Prime Minister:",
  "proviso": "Provided that within fifteen days the President may require...",
  "explanation": null,
  "notwithstanding_reference": null,
  "amendments": [
    {
      "act": "Constitution (Eighteenth Amendment) Act, 2010",
      "insight": "Added 15-day reconsideration and 10-day compliance deadlines."
    }
  ],
  "cross_references": [],
  "core_purpose": "Binds President to act on ministerial advice with single reconsideration window.",
  "layman_summary": "Requires President to follow Prime Minister's advice; may return once for 15-day review.",
  "index_bullet": "Binds President to Cabinet advice with one-time reconsideration mechanism",
  "debates_and_arguments": "Courts have affirmed that outside explicit exceptions, the President has no independent executive discretion.",
  "amendment_insights": [],
  "reference_insights": [],
  "clause_typology": ["duty_obligation", "checks_or_limits"],
  "clause_theme": ["general_executive"],
  "primary_institution": "The Federal Government",
  "constitutional_office": "Prime Minister & Cabinet",
  "power_breakdown": {
    "who_holds_power": "Prime Minister and Cabinet",
    "who_is_affected": "The President",
    "the_check_or_limit": "President may request reconsideration within 15 days, but must act within 10 days on returned advice."
  },
  "entity_links": ["prime_minister", "federal_cabinet", "president"],
  "children": []
}
```

---

## 4. Controlled Vocabulary & Strict Enums

### Axis 1: `clause_typology` (Max 2 per node)
* `substantive_power` — Grants authority to act, decide, appoint, or make orders.
* `duty_obligation` — Mandatory command ("shall") with no discretion.
* `fundamental_right` — Constitutional entitlement for citizens or persons.
* `declaratory_policy` — Aspirational goal, state religion, or non-justiciable principle.
* `procedural` — Mechanics of how a process works (budgeting, bill transmission, voting).
* `definitional_interpretative` — Defining words, terms, calendars, genders, or repeal effects.
* `ouster_immunity` — Blocks court review or grants personal legal immunity.
* `transitional_validation` — Legalizes past acts or provides temporary bridges.

### Axis 2: `clause_theme` (Max 2 per node)
* `fundamental_rights`
* `general_executive`
* `general_legislative`
* `judicial_process`
* `federalism_devolution`
* `public_finance_taxation`
* `elections_democracy`
* `national_security_emergency`
* `islamic_injunctions`
* `civil_service_administration`
* `meta_law_interpretation`

---

## 5. Rules for Extending the Schema (Future LLM Additions)

To add new fields (e.g., `text_urdu` or `case_law_citations`):
1. **Never alter existing keys**: Do not rename `id`, `text`, `clause_typology`, or `power_breakdown`.
2. **Preserve `children` nesting**: Keep the identical clause tree hierarchy.
3. **Use merge scripts**: Prompt the LLM to output only `{ "article_number": "X", "clauses": [{ "id": "1", "new_field": "..." }] }` and use Python `dict.update()` to merge them back into `constitution_of_pakistan.json`.
