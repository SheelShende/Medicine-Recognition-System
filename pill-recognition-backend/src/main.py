from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.vision import predict_pill_async
from src.fda_client import get_fda_label
from src.chatbot import ask_medical_question
import json
import ast
import re

app = FastAPI(title="Pill Recognition API")

# Allow React frontend to communicate with the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"], # Added "*" safety net for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the data structure for the chatbot request
class ChatRequest(BaseModel):
    drug_name: str
    question: str

# 1. MATCH REACT ENDPOINT & USE ASYNC VISION
@app.post("/scan-pill/")
async def scan_pill(file: UploadFile = File(...)):
    print("1. Image received by backend.")
    image_bytes = await file.read()
    
    print("2. Running Gemini Vision API Async...")
    # Await the async function to prevent blocking the event loop
    drug_name = await predict_pill_async(image_bytes)
    
    print(f"3. Vision model finished! Identified: {drug_name}")
    
    # Removed the unnecessary fda_client call here to drastically improve scan latency.
    # The FDA data is only needed when the user actually asks a question in the chat phase.
    return {
        "status": "success",
        "identified_drug": drug_name
    }

@app.post("/chat/")
async def chat_about_pill(request: ChatRequest):
    medical_data = get_fda_label(request.drug_name)
    
    # 2. SEAMLESS RAG FALLBACK LOGIC
    if "error" in medical_data or not medical_data:
        # If openFDA fails, instruct Gemini to use its internal weights
        medical_context = "No official FDA record found in the database. You must rely entirely on your general medical knowledge to answer the user's question."
    else:
        # If openFDA succeeds, ground the model in the government JSON
        medical_context = medical_data
    
    ai_response = ask_medical_question(
        drug_name=request.drug_name,
        question=request.question,
        fda_context=medical_context
    )
    
    # 3. Extract raw output
    raw_data = ai_response.content if hasattr(ai_response, "content") else str(ai_response)
    final_answer = str(raw_data)
    
    # 4. FORCE-PARSE: Handle Python stringified lists (single quotes)
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
                
    # 5. Handle actual Python lists
    elif isinstance(raw_data, list) and len(raw_data) > 0 and isinstance(raw_data[0], dict):
        final_answer = raw_data[0].get("text", str(raw_data))
        
    return {
        "drug_name": request.drug_name,
        "question": request.question,
        "answer": final_answer
    }