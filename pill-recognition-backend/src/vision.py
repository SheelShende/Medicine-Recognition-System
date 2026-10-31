import tensorflow as tf
from PIL import Image
import numpy as np
import io

# This will load the model you bring over from Colab later
# model = tf.keras.models.load_model('models/pill_model.h5')

def predict_pill(image_bytes: bytes) -> str:
    # Prepare the image to match the neural network's input shape
    image = Image.open(io.BytesIO(image_bytes)).resize((224, 224))
    img_array = tf.keras.preprocessing.image.img_to_array(image)
    img_array = tf.expand_dims(img_array, 0)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    
    # predictions = model.predict(img_array)
    # predicted_class_index = np.argmax(predictions[0])
    
    # Returning a hardcoded string for current backend testing
    return "Ibuprofen"