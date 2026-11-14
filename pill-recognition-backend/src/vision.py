import os
import io
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# 1. Change to an async function
async def predict_pill_async(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes))
    img.thumbnail((800, 800)) 
    
    model = genai.GenerativeModel('gemini-3.5-flash')
    
    vision_prompt = (
        "Analyze this image of medication packaging, blister packs, or pills. "
        "Identify the primary BRAND NAME printed in the largest, most prominent text on the packaging (e.g., 'Cognium', 'Neopar MR', 'Advil'). "
        "Return ONLY the Brand Name. "
        "Do NOT return the generic chemical ingredients or extracts unless there is absolutely no brand name visible. "
        "Do not include any formatting, punctuation, or extra conversational words."
    )
    
    try:
        config = genai.GenerationConfig(temperature=0.0, max_output_tokens=15)
        
        # 2. Await the asynchronous SDK method
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