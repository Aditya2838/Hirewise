from flask import Flask, request, jsonify
import spacy
import pdfplumber
import docx
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

nlp = spacy.load("en_core_web_sm")

def extract_text_from_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
    return text

def extract_text_from_docx(docx_path):
    doc = docx.Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_resume_data(text):
    doc = nlp(text)
    
    # Extract email
    email = re.findall(r'[\w\.-]+@[\w\.-]+', text)
    
    # Extract phone number
    phone = re.findall(r'\+?\d[\d -]{8,12}\d', text)
    
    # Extract skills (example using simple matching)
    skills = ["Java", "Python", "Machine Learning", "React", "SQL", "AI", "Node.js"]
    extracted_skills = [skill for skill in skills if skill.lower() in text.lower()]

    # Extract experience
    experience = re.findall(r'(\d+ years? experience|\d+ yrs experience)', text)
    
    # Extract education
    education = re.findall(r'(Bachelor|Master|PhD) in [A-Za-z ]+', text)
    
    return {
        "name": doc.ents[0].text if doc.ents else "Not Found",
        "email": email[0] if email else "Not Found",
        "phone": phone[0] if phone else "Not Found",
        "skills": extracted_skills,
        "experience": experience[0] if experience else "Not Found",
        "education": education[0] if education else "Not Found"
    }

@app.route("/parse-resume", methods=["POST"])
def parse_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]
    file_path = f"./uploads/{file.filename}"
    file.save(file_path)

    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_path)
    elif file.filename.endswith(".docx"):
        text = extract_text_from_docx(file_path)
    else:
        return jsonify({"error": "Unsupported file format"}), 400

    parsed_data = extract_resume_data(text)
    return jsonify(parsed_data)

if __name__ == "__main__":
    app.run(debug=True)
