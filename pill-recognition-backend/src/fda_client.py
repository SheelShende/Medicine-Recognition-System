import requests

import requests

def get_fda_label(drug_name: str):
    # (Keep your existing URL setup here)
    # url = ...
    
    try:
        response = requests.get(url, timeout=3)
        data = response.json()
        
        if "results" in data and len(data["results"]) > 0:
            label = data["results"][0]
            
            # Helper function to safely extract messy FDA data
            def safe_get(key):
                val = label.get(key)
                if isinstance(val, list) and len(val) > 0:
                    return val[0]
                elif isinstance(val, str):
                    return val
                return "Not listed in official FDA record."
            
            return {
                "indications": safe_get("indications_and_usage"),
                "warnings": safe_get("warnings"),
                "boxed_warnings": safe_get("boxed_warning"),
                "contraindications": safe_get("contraindications"),
                "side_effects": safe_get("adverse_reactions"),
                "dosage": safe_get("dosage_and_administration")
            }
        else:
            return {"error": "No FDA data found."}
            
    except Exception as e:
        print(f"FDA API Parsing Error: {e}") # Prints to your terminal so you can see what went wrong
        return {"error": str(e)}