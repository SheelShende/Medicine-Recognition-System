import requests

def get_fda_label(drug_name: str) -> dict:
    url = "https://api.fda.gov/drug/label.json"
    clean_name = drug_name.lower().strip()
    
    params = {
        "search": clean_name,
        "limit": 1
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        results = response.json().get("results", [])
        
        if results:
            data = results[0]
            
            # Safely unpack the lists. If the FDA data is None or [], it defaults to a safe string.
            warnings_list = data.get("warnings")
            indications_list = data.get("indications_and_usage")
            
            warnings_text = warnings_list[0] if warnings_list else "No official warnings listed in this label."
            indications_text = indications_list[0] if indications_list else "No official indications listed in this label."
            
            return {
                "drug_name": drug_name,
                "warnings": warnings_text,
                "indications": indications_text
            }
            
    return {"error": f"Drug '{clean_name}' not found in FDA database."}