import os
import io
import time
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# gemini-3.5-flash-lite defaults to MINIMAL thinking for low-latency extraction
model = genai.GenerativeModel("gemini-3.5-flash-lite")

VISION_PROMPT = (
    "Identify the actual medication shown in this image (pill, blister pack, or bottle). "
    "If it is a loose pill with an imprint code, use the imprint to identify the real drug name. "
    "If it is packaging, return the primary active generic ingredient for FDA lookup. "
    "Return ONLY the medication name—no punctuation, formatting, or extra words."
)

async def predict_pill_async(image_bytes: bytes) -> str:
    t0 = time.perf_counter()
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
        # Keep enough resolution for small text on blister packs/imprints
        img.thumbnail((1200, 1200))
        print(f"   -> Payload ready: {len(image_bytes)/1024:.1f} KB, {img.size} ({time.perf_counter() - t0:.2f}s)")

        t1 = time.perf_counter()
        response = await model.generate_content_async(
            [VISION_PROMPT, img],
            request_options={"timeout": 20}
        )
        print(f"   -> Gemini responded in {time.perf_counter() - t1:.2f}s")

        identified_drug = response.text.strip()
        print(f"Gemini Vision Identified: {identified_drug}")
        return identified_drug

    except Exception as e:
        print(f"Vision API Error ({type(e).__name__}) after {time.perf_counter() - t0:.2f}s: {e}")
        return "Unknown"