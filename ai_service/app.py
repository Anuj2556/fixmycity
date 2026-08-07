from flask import Flask, request, jsonify
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

app = Flask(__name__)

# Load pre-trained MobileNetV2
mobilenet_model = MobileNetV2(weights='imagenet')

# Training data for text categorization
TRAINING_DATA = {
    "texts": [
        "pothole broken road crack asphalt damage",
        "road broken street damaged pavement",
        "water pipe leaking water supply broken",
        "no water supply water shortage",
        "street light broken electricity power failure",
        "no electricity power outage",
        "garbage trash not collected rubbish",
        "dirty street litter illegal dumping",
        "other issue misc problem",
    ],
    "categories": [
        "roads",
        "roads",
        "water",
        "water",
        "electricity",
        "electricity",
        "sanitation",
        "sanitation",
        "other",
    ],
}

# Train text classifier
vectorizer = TfidfVectorizer(lowercase=True, stop_words="english")
X = vectorizer.fit_transform(TRAINING_DATA["texts"])
text_classifier = MultinomialNB()
text_classifier.fit(X, TRAINING_DATA["categories"])

# Category mapping for MobileNet
CATEGORY_MAPPING = {
    # Roads/Pavement
    "pothole": "roads",
    "crack": "roads",
    "asphalt": "roads",
    "pavement": "roads",
    "road": "roads",
    "street": "roads",
    "concrete": "roads",
    # Water
    "water": "water",
    "pipe": "water",
    "hydrant": "water",
    "pool": "water",
    # Electricity
    "wire": "electricity",
    "pole": "electricity",
    "power": "electricity",
    "light": "electricity",
    "lamp": "electricity",
    # Sanitation
    "trash": "sanitation",
    "garbage": "sanitation",
    "waste": "sanitation",
    "bin": "sanitation",
    "litter": "sanitation",
}


def classify_image(img_array):
    """Classify image using MobileNetV2."""
    try:
        img_preprocessed = preprocess_input(img_array)
        predictions = mobilenet_model.predict(img_preprocessed)
        decoded = decode_predictions(predictions, top=5)[0]

        for _, label, confidence in decoded:
            label_lower = label.lower()
            for key, category in CATEGORY_MAPPING.items():
                if key in label_lower:
                    return category, float(confidence)

        return "other", 0.5
    except Exception as e:
        print(f"Image classification error: {e}")
        return "other", 0.5


def classify_text(text):
    """Classify text using scikit-learn."""
    try:
        if not text or len(text.strip()) == 0:
            return "other", 0.5

        X_text = vectorizer.transform([text.lower()])
        prediction = text_classifier.predict(X_text)[0]
        confidence = float(text_classifier.predict_proba(X_text).max())

        return prediction, confidence
    except Exception as e:
        print(f"Text classification error: {e}")
        return "other", 0.5


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "AI Service is running"}), 200


@app.route("/classify", methods=["POST"])
def classify():
    """
    Classify issue based on image and text.
    Expected JSON:
    {
        "image": base64_encoded_image,
        "description": "issue description text"
    }
    """
    try:
        data = request.json

        image_data = data.get("image")
        description = data.get("description", "")

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        import base64

        try:
            image_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(image_bytes))

            img = img.resize((224, 224))
            img_array = np.array(img)

            if len(img_array.shape) == 2:
                img_array = np.stack([img_array] * 3, axis=-1)

            if img_array.shape[2] == 4:
                img_array = img_array[:, :, :3]

            img_array = np.expand_dims(img_array, axis=0)
        except Exception as e:
            return jsonify({"error": f"Invalid image: {str(e)}"}), 400

        image_category, image_confidence = classify_image(img_array)
        text_category, text_confidence = classify_text(description)

        if image_confidence > 0.3:
            final_category = image_category if image_confidence > 0.5 else text_category
        else:
            final_category = text_category

        return (
            jsonify(
                {
                    "category": final_category,
                    "image_prediction": {
                        "category": image_category,
                        "confidence": image_confidence,
                    },
                    "text_prediction": {
                        "category": text_category,
                        "confidence": text_confidence,
                    },
                    "confidence": max(image_confidence, text_confidence),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/classify-image", methods=["POST"])
def classify_image_only():
    """Classify image only."""
    try:
        data = request.json
        image_data = data.get("image")

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        import base64

        try:
            image_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(image_bytes))
            img = img.resize((224, 224))
            img_array = np.array(img)

            if len(img_array.shape) == 2:
                img_array = np.stack([img_array] * 3, axis=-1)
            if img_array.shape[2] == 4:
                img_array = img_array[:, :, :3]

            img_array = np.expand_dims(img_array, axis=0)
        except Exception as e:
            return jsonify({"error": f"Invalid image: {str(e)}"}), 400

        category, confidence = classify_image(img_array)

        return jsonify({"category": category, "confidence": float(confidence)}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/classify-text", methods=["POST"])
def classify_text_only():
    """Classify text only."""
    try:
        data = request.json
        description = data.get("description", "")

        if not description:
            return jsonify({"error": "No text provided"}), 400

        category, confidence = classify_text(description)

        return jsonify({"category": category, "confidence": float(confidence)}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
