import os
import io
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
# THE CRITICAL FIX: Bypass gRPC deadlocks by forcing standard REST (HTTP)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"), transport="rest")

async def predict_pill_async(image_bytes: bytes) -> str:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.thumbnail((800, 800)) 
        
        model = genai.GenerativeModel('gemini-1.5-flash') 
        
        vision_prompt = (
            "You are an expert pharmaceutical AI. Analyze this image of a pill, blister pack, or medication bottle and identify the ACTUAL medication. "
            "1. If it is a loose physical tablet with text or numbers stamped on it, use that imprint code as a clue to identify the real drug. Do NOT just return the stamped text. Return the actual drug name (e.g., 'Ibuprofen'). "
            "2. If it is a blister pack or packaging, identify its primary active generic ingredient, as that is the universally recognized medical name required for FDA database lookups. "
            "Return ONLY the true medical name of the drug. Do not include any formatting, punctuation, or conversational filler."
        )
        
        config = genai.GenerationConfig(temperature=0.0)
        
        # We no longer need the artificial timeout; REST will connect instantly
        response = await model.generate_content_async(
            [vision_prompt, img], 
            generation_config=config
        )
        
        identified_drug = response.text.strip()
        print(f"Gemini Vision Identified: {identified_drug}")
        return identified_drug
        
    except Exception as e:
        print(f"Vision API Error: {e}")
        return "Unknown"