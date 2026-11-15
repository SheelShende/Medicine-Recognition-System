import os
import io
import asyncio
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# 1. The core synchronous logic that successfully identified the pills earlier
def process_vision_sync(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes))
    img.thumbnail((800, 800)) 
    
    model = genai.GenerativeModel('gemini-3.5-flash')
    
    vision_prompt = (
        "You are an expert pharmaceutical AI. Analyze this image of a pill, blister pack, or medication bottle and identify the ACTUAL medication. "
        "1. If it is a loose physical tablet with text or numbers stamped on it, use that imprint code as a clue to identify the real drug. Do NOT just return the stamped text. Return the actual drug name (e.g., 'Ibuprofen'). "
        "2. If it is a blister pack or packaging, identify its primary active generic ingredient, as that is the universally recognized medical name required for FDA database lookups. "
        "Return ONLY the true medical name of the drug. Do not include any formatting, punctuation, or conversational filler."
    )
    
    config = genai.GenerationConfig(temperature=0.0)

    # Using the stable, synchronous generate_content method
    response = model.generate_content([vision_prompt, img], generation_config=config)
    return response.text.strip()

# 2. The async wrapper that protects FastAPI's event loop
async def predict_pill_async(image_bytes: bytes) -> str:
    try:
        # Offload the blocking sync code to a background worker thread
        identified_drug = await asyncio.to_thread(process_vision_sync, image_bytes)
        print(f"Gemini Vision Identified: {identified_drug}")
        return identified_drug
    except Exception as e:
        # If this still fails, it will print the exact reason to your terminal
        print(f"Vision API Error: {e}")
        return "Unknown"