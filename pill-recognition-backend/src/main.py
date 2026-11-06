from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.vision import predict_pill
from src.fda_client import get_fda_label
from src.chatbot import ask_medical_question

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
    # 1. Fetch the factual FDA context
    medical_data = get_fda_label(request.drug_name)
    
    # Ensure we return 'answer' so the React UI doesn't crash on an empty FDA response
    if "error" in medical_data or not medical_data:
        return {
            "drug_name": request.drug_name,
            "question": request.question,
            "answer": "I could not find official FDA data for this medication."
        }
    
    # 2. Pass context and user question to LangChain/Gemini
    ai_response = ask_medical_question(
        drug_name=request.drug_name,
        question=request.question,
        fda_context=medical_data
    )
    
    # 3. Safely extract pure text from LangChain's payload
    final_answer = ""
    if isinstance(ai_response, str):
        final_answer = ai_response
    elif hasattr(ai_response, "content"):
        if isinstance(ai_response.content, str):
            final_answer = ai_response.content
        elif isinstance(ai_response.content, list):
            # If Gemini returns an array of blocks, grab the text from the first block
            final_answer = ai_response.content[0].get("text", "")
    else:
        final_answer = str(ai_response)
        
    return {
        "drug_name": request.drug_name,
        "question": request.question,
        "answer": final_answer
    }