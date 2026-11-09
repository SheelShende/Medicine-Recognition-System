import os
import io
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the native Gemini SDK with your existing API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def predict_pill(image_bytes: bytes) -> str:
    # 1. Convert the raw frontend bytes into a PIL Image object
    img = Image.open(io.BytesIO(image_bytes))
    
    # 2. Initialize the multimodal vision model
    model = genai.GenerativeModel('gemini-3.5-flash')
    
    # 3. Prompt Engineering for Vision: Force a clean, single-string output for the FDA API
    vision_prompt = (
        "Analyze this image and identify the medication or supplement. "
        "Look closely at the shape, color, packaging, and any imprinted alphanumeric codes. "
        "Return ONLY the generic name of the drug or supplement (e.g., 'Ibuprofen', 'Vitamin C', 'Amoxicillin', 'Paracetamol'). "
        "Do not include any formatting, punctuation, or extra conversational words."
    )
    
    try:
        # Pass both the text prompt and the image simultaneously
        response = model.generate_content([vision_prompt, img])
        
        # Clean the output so it can be perfectly injected into your FDA API URL
        identified_drug = response.text.strip()
        print(f"Gemini Vision Identified: {identified_drug}")
        return identified_drug
        
    except Exception as e:
        print(f"Vision API Error: {e}")
        return "Unknown"