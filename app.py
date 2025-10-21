import os
import tempfile
import joblib
import pdfplumber
import docx
import re
import pandas as pd
import numpy as np
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# ---------------- CONFIG ---------------- #
ALLOWED_EXTENSIONS = {"pdf", "docx"}
UPLOAD_FOLDER = tempfile.gettempdir()

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------------- PHASE 1: CLAUSE CLASSIFICATION ---------------- #
try:
    clf_pipeline = joblib.load("models/logistic_tfidf_pipeline.pkl")
    print("✅ Phase 1 Model loaded successfully.")
except FileNotFoundError:
    print("⚠️ Classification model not found.")
    clf_pipeline = None

# Class map
try:
    df = pd.read_csv("clean_legal_clauses.csv")
    df = df.dropna(subset=["clean_text", "clause_type"])
    class_map = dict(enumerate(df["clause_type"].astype("category").cat.categories))
    print("✅ Class map loaded.")
except Exception as e:
    print(f"⚠️ Class map error: {e}")
    class_map = {}

# ---------------- PHASE 3: RISK MODEL + SHAP ---------------- #
try:
    risk_pipeline = joblib.load("models/logistic_reg_risk.pkl")
    print("✅ Risk model loaded successfully.")
except FileNotFoundError:
    print("⚠️ Risk model not found.")
    risk_pipeline = None

# Handle pipeline or standalone LogisticRegression
if hasattr(risk_pipeline, "named_steps"):
    vectorizer = risk_pipeline.named_steps.get("tfidf", None)
    clf = risk_pipeline.named_steps.get("clf", None)
else:
    clf = risk_pipeline
    try:
        vectorizer = joblib.load("models/tfidf_vectorizer.pkl")
        print("✅ TF-IDF vectorizer loaded separately.")
    except FileNotFoundError:
        vectorizer = None
        print("⚠️ TF-IDF vectorizer not found. Risk analysis will be limited.")

# SHAP explainer
try:
    shap_explainer = joblib.load("models/shap_explainer.pkl")
    print("✅ SHAP explainer loaded.")
except Exception as e:
    shap_explainer = None
    print(f"⚠️ SHAP explainer not loaded: {e}")

# ---------------- UTILITIES ---------------- #
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(path):
    text = ""
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PDF error: {e}")
    return text

def extract_text_from_docx(path):
    try:
        doc = docx.Document(path)
        return "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        print(f"DOCX error: {e}")
        return ""

def split_into_clauses(text):
    text = re.sub(r"WEBSITE DESIGN AGREEMENT", r"0. WEBSITE DESIGN AGREEMENT", text, 1)
    raw_clauses = re.split(r"(\n\d{1,2}\. )", text)
    clauses = []
    preamble = raw_clauses[0].strip()
    if len(preamble) > 20:
        clauses.append(preamble)
    for i in range(1, len(raw_clauses), 2):
        if i + 1 < len(raw_clauses):
            full_clause = (raw_clauses[i] + raw_clauses[i + 1]).strip()
            if len(full_clause) > 20:
                clauses.append(full_clause)
    if not clauses:
        clauses = [c.strip() for c in text.split("\n\n") if len(c.strip()) > 20]
        if not clauses:
            clauses = [c.strip() for c in text.split(". ") if len(c.strip()) > 20]
    return clauses

# Map key terms to human-readable explanations (example)
WORD_RISK_MAP = {
    "assignment": "allows transfer of rights without restrictions",
    "ten": "contains ambiguous numeric thresholds",
    "business": "affects multiple business entities, increasing exposure",
    "party": "unclear responsibilities or obligations",
    "confidential": "lack of proper confidentiality clauses",
    # Add more mappings as needed
}

def generate_human_readable_justification(top_words):
    explanations = []
    for w, v in top_words:
        if w.lower() in WORD_RISK_MAP:
            direction = "increases" if v > 0 else "reduces"
            explanations.append(f"{WORD_RISK_MAP[w.lower()]} ({direction} risk)")
        else:
            direction = "increases" if v > 0 else "reduces"
            explanations.append(f"'{w}' ({direction} risk)")
    if not explanations:
        return "Clause risk is unclear from the text."
    return " ".join(explanations) + " Suggest clarifying or adding missing terms to reduce risk."

def analyze_risk_with_model(clause):
    """
    Predict risk and provide human-readable explainability
    """
    if not clf or not vectorizer:
        return {
            "risk_level": "Unknown",
            "confidence": 0.0,
            "justification": "Risk model or vectorizer not loaded."
        }

    vec = vectorizer.transform([clause])
    pred = clf.predict(vec)[0]
    prob = clf.predict_proba(vec).max()

    justification = "Explainability not available."
    if shap_explainer:
        try:
            shap_values = shap_explainer(vec)
            shap_vals_flat = np.array(shap_values.values).flatten()
            feature_importance = sorted(
                zip(vectorizer.get_feature_names_out(), shap_vals_flat),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:5]

            # Generate human-readable justification
            justification = generate_human_readable_justification(feature_importance)
        except Exception as e:
            justification = f"Explainability error: {e}"

    return {
        "risk_level": pred,
        "confidence": float(prob),
        "justification": justification
    }

# ---------------- ROUTES ---------------- #
@app.route("/", methods=["GET"])
def home():
    return "<h3>✅ Legal Clause Risk Analysis API is running. Use /upload to POST files.</h3>"

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath) if filename.lower().endswith(".pdf") else extract_text_from_docx(filepath)
    os.remove(filepath)

    if not text:
        return jsonify({"error": "No readable text found."}), 422

    clauses = split_into_clauses(text)
    if not clauses:
        return jsonify({"error": "No clauses detected."}), 422

    results = []
    for clause in clauses:
        # Phase 1: Clause classification
        phase1_pred = "N/A"
        phase1_conf = 0.0
        if clf_pipeline:
            try:
                pred_code = int(clf_pipeline.predict([clause])[0])
                phase1_pred = class_map.get(pred_code, f"Unknown ({pred_code})")
                phase1_conf = float(round(clf_pipeline.predict_proba([clause]).max(), 3))
            except Exception as e:
                print(f"Phase 1 error: {e}")

        # Phase 3: Risk analysis
        risk_output = analyze_risk_with_model(clause)

        results.append({
            "clause": clause,
            "phase1": {
                "predicted_clause_type": phase1_pred,
                "confidence": phase1_conf
            },
            "phase3": risk_output
        })

    return jsonify({"total_clauses": len(clauses), "analysis": results})

# ---------------- MAIN ---------------- #
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
