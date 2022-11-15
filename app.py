import os
from collections import OrderedDict
from flask import Flask, render_template, request, jsonify, redirect, url_for

from model.predict import predict_label, class_names

app = Flask(__name__)


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html", result=None)


@app.route("/analyze", methods=["POST"])
def analyze():
    text = (request.form.get("text") or "").strip()
    if not text:
        return redirect(url_for("index", error="Please enter some text to analyze."))

    if len(text) > 5000:
        return redirect(
            url_for("index", error="Text is too long. Please limit to 5000 characters.")
        )

    label_idx, proba_map = predict_label(text)
    classes = class_names()
    top_label = classes[label_idx]
    confidence = float(proba_map[top_label])
    ordered = OrderedDict()
    for key in ["positive", "neutral", "negative"]:
        if key in proba_map:
            ordered[key] = float(proba_map[key])

    result = {
        "text": text,
        "sentiment": top_label,
        "confidence": confidence,
        "probabilities": ordered,
    }
    return render_template("index.html", result=result)


@app.route("/predict", methods=["POST"])
def predict_api():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or data.get("review_text") or "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    label_idx, proba_map = predict_label(text)
    classes = class_names()
    top_label = classes[label_idx]
    confidence = float(proba_map[top_label])

    ordered = {
        k: float(proba_map[k])
        for k in ["positive", "neutral", "negative"]
        if k in proba_map
    }
    return jsonify(
        {
            "text": text,
            "sentiment": top_label,
            "confidence": confidence,
            "probabilities": ordered,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=1000, debug=True)
