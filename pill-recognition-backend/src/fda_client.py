import requests
import urllib.parse

def get_fda_label(drug_name: str):
    # Safely format the drug name for a URL (e.g., handles spaces in "Vitamin C")
    clean_name = urllib.parse.quote(drug_name)
    
    # 1. THE CASCADING SEARCH STRATEGY
    # We attempt 3 different API queries. If one fails, it instantly tries the next.
    search_urls = [
        f'https://api.fda.gov/drug/label.json?search=openfda.brand_name:"{clean_name}"&limit=1',
        f'https://api.fda.gov/drug/label.json?search=openfda.generic_name:"{clean_name}"&limit=1',
        f'https://api.fda.gov/drug/label.json?search="{clean_name}"&limit=1' # Broadest safety net
    ]
    
    for url in search_urls:
        try:
            response = requests.get(url, timeout=4)
            
            # If this specific search URL found a match, process it
            if response.status_code == 200:
                data = response.json()
                
                if "results" in data and len(data["results"]) > 0:
                    label = data["results"][0]
                    
                    # Helper function to extract messy JSON fields safely
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
        except Exception as e:
            print(f"API Attempt Failed, trying next route... Error: {e}")
            continue # Move to the next URL in the list
            
    # If all 3 URLs completely fail, only THEN do we return an error
    return {"error": "No FDA data found."}