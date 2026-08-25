import json
import os
import sys

ALLOWED_TYPOLOGY = {
    "substantive_power",
    "duty_obligation",
    "fundamental_right",
    "declaratory_policy",
    "procedural",
    "definitional_interpretative",
    "creation_or_definition",
    "checks_or_limits",
    "ouster_immunity",
    "transitional_validation"
}

ALLOWED_THEMES = {
    "fundamental_rights",
    "general_executive",
    "general_legislative",
    "judicial_process",
    "federalism_devolution",
    "public_finance_taxation",
    "elections_democracy",
    "national_security_emergency",
    "islamic_injunctions",
    "civil_service_administration",
    "meta_law_interpretation"
}

ALLOWED_STATUS = {"active", "omitted", "partially_omitted"}
ALLOWED_ENTITY_TYPES = {"institution", "individual_role", "protected_class"}

def validate_clauses(clauses, art_num, path, entity_ids, errors):
    for idx, c in enumerate(clauses):
        cid = c.get("id")
        current_loc = f"{path} -> Clause({cid})"
        
        # Check required fields
        for field in ["id", "text", "core_purpose", "layman_summary", "power_breakdown", "clause_typology", "clause_theme", "entity_links"]:
            if field not in c:
                errors.append(f"[{current_loc}] Missing mandatory field: '{field}'")
        
        # Validate Typology Enums
        for typ in c.get("clause_typology", []):
            if typ not in ALLOWED_TYPOLOGY:
                errors.append(f"[{current_loc}] Invalid clause_typology enum: '{typ}'")
                
        # Validate Theme Enums
        for thm in c.get("clause_theme", []):
            if thm not in ALLOWED_THEMES:
                errors.append(f"[{current_loc}] Invalid clause_theme enum: '{thm}'")
                
        # Validate Entity Links match existing entities
        for ent in c.get("entity_links", []):
            if ent not in entity_ids:
                errors.append(f"[{current_loc}] Unregistered entity_link: '{ent}'")
                
        # Check for trailing stray brackets in text
        text = c.get("text", "")
        if text.endswith("]") and not text.startswith("["):
            errors.append(f"[{current_loc}] Possible stray closing bracket in text: '{text[-15:]}'")

        # Recursion
        if "children" in c and isinstance(c["children"], list):
            validate_clauses(c["children"], art_num, current_loc, entity_ids, errors)

def validate_master_file(file_path="constitution_of_pakistan.json"):
    if not os.path.exists(file_path):
        print(f"[Error] File '{file_path}' does not exist.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"[FATAL] JSON Parse Error: {e}")
            return

    errors = []
    warnings = []
    
    print("=" * 65)
    print(f" VALIDATING: {file_path}")
    print("=" * 65)

    # 1. Validate Entities
    entities = data.get("entities", [])
    entity_ids = set()
    for ent in entities:
        eid = ent.get("id")
        if not eid:
            errors.append("[Entities] Entity missing 'id'")
            continue
        if eid in entity_ids:
            errors.append(f"[Entities] Duplicate entity id: '{eid}'")
        entity_ids.add(eid)
        
        if ent.get("type") not in ALLOWED_ENTITY_TYPES:
            errors.append(f"[Entities -> {eid}] Invalid entity type: '{ent.get('type')}'")
            
        if not ent.get("overview"):
            warnings.append(f"[Entities -> {eid}] Missing overview paragraph")

    # 2. Validate Articles
    articles = data.get("articles", [])
    seen_articles = set()
    
    for art in articles:
        anum = str(art.get("article_number", "")).strip()
        if not anum:
            errors.append("[Articles] Article missing 'article_number'")
            continue
        if anum in seen_articles:
            errors.append(f"[Articles] Duplicate Article Number found: '{anum}'")
        seen_articles.add(anum)
        
        if art.get("status") not in ALLOWED_STATUS:
            errors.append(f"[Article {anum}] Invalid status: '{art.get('status')}'")
            
        # Validate clauses tree
        validate_clauses(art.get("clauses", []), anum, f"Art.{anum}", entity_ids, errors)

    # Output Results
    print(f" Total Articles Scanned : {len(articles)}")
    print(f" Total Entities Scanned : {len(entities)}")
    print(f" Errors Found           : {len(errors)}")
    print(f" Warnings Found         : {len(warnings)}")
    print("-" * 65)

    if errors:
        print("\n [!] ERROR LIST:")
        for e in errors[:30]:
            print(f"   ✖ {e}")
        if len(errors) > 30:
            print(f"   ... and {len(errors) - 30} more errors.")
    else:
        print("\n [✓] PASSED: All enums, IDs, and clause trees are strictly valid!")

    if warnings:
        print("\n [i] WARNINGS (Non-breaking):")
        for w in warnings[:10]:
            print(f"   ⚠ {w}")
    print("=" * 65)

if __name__ == "__main__":
    fn = sys.argv[1] if len(sys.argv) > 1 else "constitution_of_pakistan.json"
    validate_master_file(fn)