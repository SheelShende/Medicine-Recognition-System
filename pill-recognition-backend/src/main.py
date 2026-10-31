from fastapi import FastAPI, File, UploadFile
from src.vision import predict_pill
from src.fda_client import get_fda_label

app = FastAPI(title="Pill Recognition API")

@app.post("/scan-pill/")
async def scan_pill(file: UploadFile = File(...)):
    # 1. Read the uploaded image
    image_bytes = await file.read()
    
    # 2. Identify the pill (Vision Layer)
    drug_name = predict_pill(image_bytes)
    
    # 3. Retrieve trusted medical data (RAG Layer)
    medical_data = get_fda_label(drug_name)
    
    return {
        "status": "success",
        "identified_drug": drug_name,
        "medical_context": medical_data
    }