import requests

def get_fda_label(drug_name: str) -> dict:
    url = "https://api.fda.gov/drug/label.json"
    params = {
        "search": f'openfda.generic_name:"{drug_name}"',
        "limit": 1
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()["results"][0]
        return {
            "drug_name": drug_name,
            "warnings": data.get("warnings", ["No warnings available"])[0],
            "indications": data.get("indications_and_usage", ["No indications available"])[0]
        }
    return {"error": "Drug not found in FDA database"}