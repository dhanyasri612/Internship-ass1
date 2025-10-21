import React, { useState } from "react";

const ClauseDisplay = ({ data, index, phase }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="card shadow-sm h-100 mb-3">
      <div
        className="card-header d-flex justify-content-between align-items-center bg-primary text-white"
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer" }}
      >
        <span>📄 Clause #{index + 1}</span>
        <small>{open ? "▲ Hide" : "▼ Show"}</small>
      </div>

      {open && (
        <div className="card-body">
          {/* --- Original Text --- */}
          <div className="mb-3">
            <strong>Original Text:</strong>
            <p className="text-muted mt-1">{data.clause}</p>
          </div>

          {/* --- Phase 1: Clause Classification --- */}
          {phase === "phase1" && (
            <div className="alert alert-info py-2">
              <strong>Predicted Clause Type:</strong>{" "}
              {data.phase1?.predicted_clause_type || "N/A"}{" "}
              <span className="text-muted">
                (Confidence: {(data.phase1?.confidence * 100 || 0).toFixed(1)}%)
              </span>
            </div>
          )}

          {/* --- Phase 2: Risk Analysis --- */}
          {phase === "phase2" && (
            <div
              className={`alert py-3 ${
                data.phase3?.risk_level === "high"
                  ? "alert-danger"
                  : data.phase3?.risk_level === "medium"
                  ? "alert-warning"
                  : "alert-success"
              }`}
            >
              <h6 className="fw-bold mb-2">Risk Analysis</h6>

              <p>
                <strong>Risk Level:</strong>{" "}
                <span className="text-uppercase">
                  {data.phase3?.risk_level || "N/A"}
                </span>
              </p>

              <p>
                <strong>Model Confidence:</strong>{" "}
                {(data.phase3?.confidence * 100 || 0).toFixed(1)}%
              </p>

              <p>
                <strong>Justification:</strong>{" "}
                {data.phase3?.justification || "No justification available."}
              </p>

              {data.phase3?.top_words && (
                <p>
                  <strong>Top Contributing Words:</strong>{" "}
                  {data.phase3.top_words.join(", ")}
                </p>
              )}

              {data.phase3?.extra_info && (
                <p>
                  <strong>Extra Info:</strong> {data.phase3.extra_info}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClauseDisplay;
