from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from src.vision import predict_pill
from src.fda_client import get_fda_label
from src.chatbot import ask_medical_question

app = FastAPI(title="Pill Recognition API")

# Define the data structure for the chatbot request
class ChatRequest(BaseModel):
    drug_name: str
    question: str

@app.post("/scan-pill/")
async def scan_pill(file: UploadFile = File(...)):
    image_bytes = await file.read()
    drug_name = predict_pill(image_bytes)
    medical_data = get_fda_label(drug_name)
    
    return {
        "status": "success",
        "identified_drug": drug_name,
        "medical_context": medical_data
    }

@app.post("/chat/")
async def chat_about_pill(request: ChatRequest):
    # 1. Fetch the factual FDA context
    medical_data = get_fda_label(request.drug_name)
    
    if "error" in medical_data:
        return {"response": "I could not find official FDA data for this medication."}
    
    # 2. Pass context and user question to LangChain/Gemini
    ai_response = ask_medical_question(
        drug_name=request.drug_name,
        question=request.question,
        fda_context=medical_data
    )
    
    return {
        "drug_name": request.drug_name,
        "question": request.question,
        "answer": ai_response
    }