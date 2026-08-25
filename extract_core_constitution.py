import json
import os
import sys

def extract_core_clause(clause_node):
    """Recursively extracts only the pure statutory text and legal markers from a clause node."""
    core_clause = {
        "id": str(clause_node.get("id", "")),
        "text": clause_node.get("text", ""),
        "proviso": clause_node.get("proviso"),
        "explanation": clause_node.get("explanation"),
        "notwithstanding_reference": clause_node.get("notwithstanding_reference"),
        "amendments": clause_node.get("amendments", []),
        "cross_references": clause_node.get("cross_references", []),
        "children": []
    }

    # Preserve clause-level status if present
    if "status" in clause_node:
        core_clause["status"] = clause_node["status"]

    # Recursively clean children
    for child in clause_node.get("children", []):
        core_clause["children"].append(extract_core_clause(child))

    return core_clause

def extract_core_dataset(input_file="constitution_of_pakistan.json", output_file="constitution_core.json"):
    if not os.path.exists(input_file):
        print(f"[Error] Source master file '{input_file}' not found.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        master = json.load(f)

    print("=" * 65)
    print(f" EXTRACTING CORE STATUTORY DATASET")
    print(f" Source: {input_file}  -->  Destination: {output_file}")
    print("=" * 65)

    # 1. Clean Preamble (pure text segments only)
    raw_preamble = master.get("preamble")
    core_preamble = None
    if raw_preamble:
        core_preamble = {
            "type": "preamble",
            "title": raw_preamble.get("title", "Preamble"),
            "full_text_verbatim": raw_preamble.get("full_text_verbatim", ""),
            "segments": [
                {
                    "id": str(seg.get("id", "")),
                    "text": seg.get("text", "")
                }
                for seg in raw_preamble.get("segments", [])
            ]
        }

    # 2. Clean Articles (strip explanations, summaries, and power maps)
    core_articles = []
    for art in master.get("articles", []):
        core_art = {
            "article_number": str(art.get("article_number", "")),
            "original_title": art.get("original_title", ""),
            "status": art.get("status", "active"),
            "chapter_path": art.get("chapter_path", ""),
            "article_level_amendments_summary": art.get("article_level_amendments_summary", []),
            "full_text_verbatim": art.get("full_text_verbatim", ""),
            "clauses": [
                extract_core_clause(c) for c in art.get("clauses", [])
            ],
            "notes_for_reviewer": art.get("notes_for_reviewer", "")
        }
        core_articles.append(core_art)

    core_dataset = {
        "title": "The Constitution of the Islamic Republic of Pakistan (Core Statutory Text)",
        "metadata": {
            "version": master.get("metadata", {}).get("version", "1973_as_amended_2025"),
            "total_articles": len(core_articles),
            "type": "pure_statutory_core"
        }
    }

    if core_preamble:
        core_dataset["preamble"] = core_preamble
    core_dataset["articles"] = core_articles

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(core_dataset, f, indent=2, ensure_ascii=False)

    print(f"[✓] Successfully generated pure core dataset: '{output_file}'")
    print(f"    • Total Articles Exported: {len(core_articles)}")
    print(f"    • Preamble Included: {'Yes' if core_preamble else 'No'}")
    print(f"    • Metadata Removed: Explanations, Power Maps, Typologies, Entity Links")
    print("=" * 65)

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "constitution_of_pakistan.json"
    dest = sys.argv[2] if len(sys.argv) > 2 else "constitution_core.json"
    extract_core_dataset(src, dest)