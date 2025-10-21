import React, { useState } from "react";
import { uploadDocument } from "./api";

const UploadForm = ({ setResults, setTotalClauses, setError, setLoading }) => {
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a PDF or DOCX file");

    setLoading(true);
    setResults([]);
    setError("");
    setTotalClauses(0);

    try {
      const data = await uploadDocument(file);
      setResults(data.analysis);
      setTotalClauses(data.total_clauses);
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="d-flex flex-column gap-3">
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files[0])}
        className="form-control"
      />
      <button
        type="submit"
        disabled={!file}
        className={`btn btn-${file ? "primary" : "secondary"}`}
      >
        🚀 Upload & Analyze
      </button>
    </form>
  );
};

export default UploadForm;
