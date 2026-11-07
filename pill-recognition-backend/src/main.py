from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.vision import predict_pill
from src.fda_client import get_fda_label
from src.chatbot import ask_medical_question
import json
import ast
import re

app = FastAPI(title="Pill Recognition API")

# Allow React frontend to communicate with the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your Vite port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the data structure for the chatbot request
class ChatRequest(BaseModel):
    drug_name: str
    question: str

@app.post("/scan-pill/")
async def scan_pill(file: UploadFile = File(...)):
    print("1. Image received by backend.")
    image_bytes = await file.read()
    
    print("2. Running MobileNetV2 vision model...")
    drug_name = predict_pill(image_bytes)
    
    print(f"3. Vision model finished! Identified: {drug_name}")
    print("4. Reaching out to openFDA servers...")
    medical_data = get_fda_label(drug_name)
    
    print("5. Complete! Sending data to React.")
    return {
        "status": "success",
        "identified_drug": drug_name,
        "medical_context": medical_data
    }

@app.post("/chat/")
async def chat_about_pill(request: ChatRequest):
    medical_data = get_fda_label(request.drug_name)
    
    if "error" in medical_data or not medical_data:
        return {
            "drug_name": request.drug_name,
            "question": request.question,
            "answer": "I could not find official FDA data for this medication."
        }
    
    ai_response = ask_medical_question(
        drug_name=request.drug_name,
        question=request.question,
        fda_context=medical_data
    )
    
    # 1. Extract raw output
    raw_data = ai_response.content if hasattr(ai_response, "content") else str(ai_response)
    final_answer = str(raw_data)
    
    # 2. FORCE-PARSE: Handle Python stringified lists (single quotes)
    if isinstance(raw_data, str) and raw_data.strip().startswith("["):
        try:
            # Safely parse strings with single quotes into real Python objects
            parsed = ast.literal_eval(raw_data)
            if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
                final_answer = parsed[0].get("text", final_answer)
        except Exception:
            # Ultimate fallback: Regex to rip the text value directly out of the string
            match = re.search(r"'text':\s*'([^']*)'", raw_data)
            if match:
                final_answer = match.group(1)
                
    # 3. Handle actual Python lists
    elif isinstance(raw_data, list) and len(raw_data) > 0 and isinstance(raw_data[0], dict):
        final_answer = raw_data[0].get("text", str(raw_data))
        
    return {
        "drug_name": request.drug_name,
        "question": request.question,
        "answer": final_answer
    }