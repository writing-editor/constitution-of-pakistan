# The Constitution of Pakistan (1973) — Interactive Structural Dataset & Portal

A structured, clause-level constitutional dataset and interactive web portal for the **Constitution of the Islamic Republic of Pakistan (1973, as amended up to the 27th Amendment, 2025)**.

This project unifies verbatim legal texts, plain-English explanations, historical amendment tracking, institutional power mappings, and a 4-pillar relational schema into a single, extensible master database: **`constitution_of_pakistan.json`**.

---

## 📑 Table of Contents
1. [System Architecture & The 4-Pillar Model](#1-system-architecture--the-4-pillar-model)
2. [Master Dataset Schema (`constitution_of_pakistan.json`)](#2-master-dataset-schema)
3. [Controlled Enums & Typology Reference](#3-controlled-enums--typology-reference)
4. [Python Tooling & Maintenance Scripts](#4-python-tooling--maintenance-scripts)
5. [Small-Batch LLM Expansion Protocol (Zero Token Waste)](#5-small-batch-llm-expansion-protocol)
6. [Interactive Web Portal (`index.html`)](#6-interactive-web-portal)
7. [Quick Start Guide](#7-quick-start-guide)

---

## 1. System Architecture & The 4-Pillar Model

The dataset avoids treating the Constitution as a flat text file. Instead, every provision is parsed into a **1:1 hierarchical tree** (`clauses` with nested `children`) and mapped across three orthogonal axes:

```
                          ┌──────────────────────────┐
                          │     The Constitution     │
                          │   (329 Unique Articles)  │
                          └─────────────┬────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
 🏛️ Axis 1: ACTORS              ⚖️ Axis 2: TYPOLOGY             📑 Axis 3: DOMAINS
 • Who holds power?             • What kind of rule is it?      • What topic is it?
 • Who is affected?             • (Power, Duty, Right,          • (Executive, Finance,
 • Checks & Limits                Ouster, Procedure)              Judiciary, Security)
```

### The 4 Navigation Pillars:
1. **🏛️ By Actor:** Curated profiles for 34 constitutional entities (`Institutions`, `Individual Roles`, and `Protected Classes`).
2. **⚖️ Legal Concepts (Typology):** Filter every clause in the Constitution by its strict legal nature (e.g., locate every *Ouster of Jurisdiction* clause or *Substantive Power* grant).
3. **📑 Subject Domains (Themes):** Browse cross-cutting chapters grouped by operational area (e.g., *Public Finance*, *Elections*, *Federalism*).
4. **📖 Sequential Index (1–280):** Complete, 100% accessible Table of Contents by Part and Chapter.

---

## 2. Master Dataset Schema

The master database is structured as follows:

```json
{
  "title": "The Constitution of the Islamic Republic of Pakistan (1973)",
  "metadata": {
    "version": "1973_as_amended_2025",
    "total_articles": 329,
    "schema_version": "2.0.0_unified"
  },
  "preamble": {
    "type": "preamble",
    "title": "Preamble",
    "full_text_verbatim": "...",
    "segments": [
      {
        "id": "p1",
        "text": "WHEREAS sovereignty over the entire Universe belongs to Almighty Allah alone...",
        "core_purpose": "Affirms divine sovereignty and democratic power as a sacred trust."
      }
    ]
  },
  "entities": [ ... ],
  "articles": [ ... ]
}
```

### 2.1 Article Object (`articles[]`)
```json
{
  "article_number": "48",
  "original_title": "President to act on advice, etc.",
  "status": "active",
  "chapter_path": "Part III > Chapter 1 > The President",
  "article_summary": {
    "core_purpose": "Binds President to act on Cabinet or Prime Minister advice...",
    "layman_summary": "Makes the President a constitutional head bound by the Prime Minister's advice...",
    "historical_context": "The 18th Amendment (2010) restored the parliamentary balance...",
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
  "full_text_verbatim": "48. (1) In the exercise of his functions, the President shall...",
  "clauses": [ ... ]
}
```

### 2.2 Clause Node Schema (`clauses[]`)
*Nodes nest recursively through `children: []` to match the exact legal document hierarchy (`1` $\rightarrow$ `a` $\rightarrow$ `i`).*

```json
{
  "id": "1",
  "text": "In the exercise of his functions, the President shall act on and in accordance with the advice of the Cabinet or the Prime Minister:",
  "proviso": "Provided that within fifteen days the President may require...",
  "explanation": null,
  "notwithstanding_reference": null,
  "amendments": [ ... ],
  "cross_references": [ ... ],
  "core_purpose": "Formal functional description of this specific clause.",
  "layman_summary": "Plain English meaning for non-lawyers.",
  "index_bullet": "Summary action bullet (4-12 words).",
  "debates_and_arguments": "Attributed legal debates, case law interpretation, or judicial commentary.",
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

## 3. Controlled Enums & Typology Reference

To prevent typos or schema fragmentation, values in `clause_typology` and `clause_theme` must adhere strictly to these enums:

### Axis 1: `clause_typology` (Max 2 per clause)
| Enum Key | Display Label | Description |
| :--- | :--- | :--- |
| `substantive_power` | Substantive Power | Grants positive authority to decide, act, or appoint. |
| `duty_obligation` | Duty & Obligation | Mandatory command ("shall") with zero discretion. |
| `fundamental_right` | Fundamental Right / Entitlement | Inalienable entitlement for citizens or persons. |
| `declaratory_policy` | Declaratory / Policy | Guiding principle, moral directive, or state aspiration. |
| `procedural` | Procedural Rules | Mechanics of how a process works (timelines, voting rules). |
| `definitional_interpretative` | Definitional & Interpretative | Dictionary definitions, calendar rules, gender rules. |
| `creation_or_definition` | Creation & Definition | Formally establishes a constitutional body or court. |
| `checks_or_limits` | Checks & Limits | Restricts power, imposes caps, or sets disqualifications. |
| `ouster_immunity` | Ouster of Jurisdiction & Immunity | Explicitly bars courts from review or grants legal immunity. |
| `transitional_validation` | Transitional & Validation | Validates historical past acts or provides temporary bridges. |

### Axis 2: `clause_theme` (Max 2 per clause)
* `fundamental_rights` — Part II Chapter 1 civil liberties and safeguards.
* `general_executive` — President, Prime Minister, Federal/Provincial Cabinets, Governors.
* `general_legislative` — Parliament, National Assembly, Senate, Provincial Assemblies.
* `judicial_process` — Superior Judicature, appointments, writ jurisdiction, SJC.
* `federalism_devolution` — Inter-provincial trade, CCI, water disputes, provincial autonomy.
* `public_finance_taxation` — Consolidated Funds, NFC, budget demands, borrowing.
* `elections_democracy` — ECP, voter franchise, caretaker setups, party defection.
* `national_security_emergency` — Armed Forces, High Treason, Emergency declarations.
* `islamic_injunctions` — Council of Islamic Ideology, Federal Shariat Court, Riba elimination.
* `civil_service_administration` — Public Service Commissions, Service Tribunals.
* `meta_law_interpretation` — Master definitions, commencement, repeal effects.

---

## 4. Python Tooling & Maintenance Scripts

### 4.1 Build Master Dataset (`build_master_constitution.py`)
Merges the 4 source files (`constitution_core.json`, `constitution_explanation.json`, `constitution_structure.json`, `entities.json`) into `constitution_of_pakistan.json`.
```bash
python3 build_master_constitution.py
```

### 4.2 Strict Schema Validator (`validate_constitution.py`)
Scans all 329 articles and 34 entities to confirm **0 errors**:
* Validates every `clause_typology` and `clause_theme` against allowed enums.
* Validates that every `entity_links` ID exists in `entities[]`.
* Detects stray brackets or corrupted clause hierarchies.
```bash
python3 validate_constitution.py
```

---

## 5. Small-Batch LLM Expansion Protocol

You **never need to feed the entire 337-article dataset to an LLM**. To add new properties (such as Urdu translations, vector embeddings, or case law precedents):

### Step 1: Prompt the LLM for a 5–10 Article Chunk
Use this prompt template:

```markdown
You are a legal data annotator. Below is a target chunk of 5 articles from `constitution_of_pakistan.json`.
Add the following new property to every clause node:
- `"text_urdu"`: Precise Urdu translation of the clause text.

Return ONLY a JSON array with the updated articles matching the exact clause `id` tree:
[
  {
    "article_number": "1",
    "clauses": [
      {
        "id": "1",
        "text_urdu": "پاکستان ایک وفاقی جمہوریہ ہو گا جس کا نام اسلامی جمہوریہ پاکستان ہو گا...",
        "children": [ ... ]
      }
    ]
  }
]
```

### Step 2: Merge the New Properties Back into Master
Use this short Python script to merge the LLM's response chunk back into `constitution_of_pakistan.json`:

```python
import json

def update_clause_recursive(master_node, patch_node, new_key):
    if new_key in patch_node:
        master_node[new_key] = patch_node[new_key]
    
    patch_children_map = {str(c["id"]): c for c in patch_node.get("children", [])}
    for m_child in master_node.get("children", []):
        cid = str(m_child["id"])
        if cid in patch_children_map:
            update_clause_recursive(m_child, patch_children_map[cid], new_key)

def merge_llm_patch(master_file, patch_file, new_key):
    with open(master_file, "r", encoding="utf-8") as f:
        master = json.load(f)
    with open(patch_file, "r", encoding="utf-8") as f:
        patch = json.load(f)

    patch_map = {str(a["article_number"]): a for a in patch}

    for art in master["articles"]:
        anum = str(art["article_number"])
        if anum in patch_map:
            p_art = patch_map[anum]
            p_clauses_map = {str(c["id"]): c for c in p_art.get("clauses", [])}
            for m_clause in art.get("clauses", []):
                cid = str(m_clause["id"])
                if cid in p_clauses_map:
                    update_clause_recursive(m_clause, p_clauses_map[cid], new_key)

    with open(master_file, "w", encoding="utf-8") as f:
        json.dump(master, f, indent=2, ensure_ascii=False)
    print(f"[✓] Successfully merged '{new_key}' into {master_file}")

# Example usage:
# merge_llm_patch("constitution_of_pakistan.json", "patch_batch_1_10.json", "text_urdu")
```

---

## 6. Interactive Web Portal Architecture

The frontend is separated into three modular, zero-dependency files:
* **`index.html`** — Clean HTML document structure.
* **`style.css`** — High-legibility serif styling (`Palatino`/`Georgia`), responsive sidebar layout, tag badges, and inspector panels.
* **`app.js`** — Single-fetch data loader (`constitution_of_pakistan.json`), dynamic 4-tab sidebar manager, recursive clause inspector, and intelligent stateful back navigation.

### Key Presentation Features:
1. **Preamble Recitals Presentation:** Formats the opening invocation cleanly and badges every paragraph clearly (`Paragraph 1`, `Paragraph 2`, ... `Paragraph 19`), mapping each recital to the Objectives Resolution.
2. **4-Pillar Filtering:** Switch between **🏛️ By Actor**, **⚖️ Legal Concepts (Typology)**, **📑 Subject Domains**, and **📖 All Articles (1–280)**.
3. **Clause-Level Inspector:** Highlights the clicked clause, dims sibling clauses, and displays the Plain-English explanation, power breakdown (`Who Holds Power`, `Who Is Affected`, `Checks & Limits`), and amendment history.

---

## 7. Quick Start Guide

1. Place your data files and frontend files in the project folder:
   ```text
   project-root/
   ├── constitution_of_pakistan.json
   ├── index.html
   ├── style.css
   ├── app.js
   ├── validate_constitution.py
   ├── SCHEMA_SPECIFICATION.md
   ├── README.md
   ├── extract_core_constitution.py
   ├── Constitution_of_Pakistan_source_27th_amendment.pdf
   └── .gitignore
   ```

2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser to:
   ```text
   http://localhost:8000
   ```
---

## 8. Exporting Pure Legal Text (`extract_core_constitution.py`)

If a researcher, developer, or legal practitioner only needs the **unannotated statutory text** (without plain-English summaries, entity models, power maps, or typologies), they can programmatically extract the pure core dataset from the master file.

### How to Run:
```bash
python3 extract_core_constitution.py
```
