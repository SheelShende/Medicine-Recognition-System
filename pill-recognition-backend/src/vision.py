import tensorflow as tf
from PIL import Image
import numpy as np
import io
import os

# Load the trained model into memory when the server starts
# Using a relative path that works when uvicorn is run from the backend root
model_path = os.path.join("models", "pill_model.h5")
model = tf.keras.models.load_model(model_path)
# Create a blank dummy image (assuming MobileNetV2 224x224 input)
print("Warming up the neural network...")
dummy_image = np.zeros((1, 224, 224, 3), dtype=np.float32)
model.predict(dummy_image)
print("Vision model ready!")

# Dummy class mapping for prototype testing
# In a full build, this maps directly to the exact folder names from the Kaggle dataset
CLASS_NAMES = ["Ibuprofen", "Lisinopril", "Metformin", "Amoxicillin"] 

def predict_pill(image_bytes: bytes) -> str:
    # 1. Prepare the image to match MobileNetV2's exact input requirements
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    img_array = tf.keras.preprocessing.image.img_to_array(image)
    img_array = tf.expand_dims(img_array, 0) # Wrap in a batch of 1
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    
    # 2. Run the image through the neural network
    predictions = model.predict(img_array)
    
    # 3. Find the neuron with the highest confidence score
    predicted_class_index = np.argmax(predictions[0])
    
    # 4. Map the numerical index back to a readable drug name
    if predicted_class_index < len(CLASS_NAMES):
        return CLASS_NAMES[predicted_class_index]
    else:
        # Fallback to prevent server crashes if the index exceeds our dummy list
        return f"Unknown_Class_{predicted_class_index}"