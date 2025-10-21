import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import UploadForm from "./UploadForm";
import ClauseDisplay from "./ClauseDisplay";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CF0", "#FF6699",
  "#33CC99", "#9966FF", "#FF4444", "#FFCC00", "#66CCFF", "#99FF99",
  "#FF9966", "#CC99FF", "#66FFCC", "#FF66B2"
];

// Reusable legend
const LegendContainer = ({ data }) => (
  <div
    style={{
      maxHeight: 300,
      overflowY: "auto",
      border: "1px solid #ccc",
      borderRadius: 6,
      padding: 10,
      minWidth: 180,
      backgroundColor: "#f9f9f9",
    }}
  >
    {data.map((entry, index) => (
      <div
        key={`legend-${index}`}
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            backgroundColor: COLORS[index % COLORS.length],
            marginRight: 8,
            borderRadius: 3,
          }}
        />
        <span style={{ fontSize: 13 }}>
          {entry.name} ({entry.value})
        </span>
      </div>
    ))}
  </div>
);

const Navbar = () => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow">
    <div className="container">
      <NavLink className="navbar-brand fw-bold" to="/">
        📜 Legal Compliance Analyzer
      </NavLink>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          {["Home", "Phase 1", "Phase 2"].map((label, i) => (
            <li className="nav-item" key={i}>
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-semibold text-warning" : ""}`
                }
                to={label === "Home" ? "/" : `/${label.toLowerCase().replace(" ", "")}`}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </nav>
);

// Convert clause data into chart format
const getPieData = (results, keyPath) => {
  const counts = results.reduce((acc, clause) => {
    const key = keyPath.split(".").reduce((o, k) => (o && o[k] ? o[k] : "Unknown"), clause);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const App = () => {
  const [results, setResults] = useState([]);
  const [totalClauses, setTotalClauses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <Router>
      <Navbar />
      <main className="py-5 bg-light min-vh-100">
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                <div className="text-center">
                  <h2 className="fw-bold text-primary mb-3">
                    Upload Your Contract for Smart Analysis
                  </h2>
                  <p className="text-muted mb-4">
                    Our AI analyzes your contract in 2 intelligent phases.
                  </p>

                  <div className="card shadow-sm mx-auto" style={{ maxWidth: "600px" }}>
                    <div className="card-body">
                      <UploadForm
                        setResults={setResults}
                        setTotalClauses={setTotalClauses}
                        setError={setError}
                        setLoading={setLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger mt-4 w-75 mx-auto">{error}</div>
                  )}

                  {loading && (
                    <div className="text-muted mt-4">🔍 Analyzing document...</div>
                  )}

                  {!loading && results.length === 0 && totalClauses === 0 && (
                    <div className="text-muted mt-4">
                      No clauses found or analysis failed.
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="alert alert-success mt-4 w-75 mx-auto fw-semibold">
                      ✅ Analysis Complete: {totalClauses} Clauses Found
                    </div>
                  )}
                </div>
              }
            />

            {/* Phase 1 and Phase 2 views */}
            {["phase1", "phase2"].map((phase) => {
              const isPhase1 = phase === "phase1";
              const pieData = getPieData(results, isPhase1 ? "phase1.predicted_clause_type" : "phase3.risk_level");

              return (
                <Route
                  key={phase}
                  path={`/${phase}`}
                  element={
                    <div className="mt-4">
                      <h2 className="text-center text-primary fw-bold mb-4">
                        {isPhase1
                          ? "Phase 1 - Clause Type Classification"
                          : "Phase 2 - Clause Risk & Analysis"}
                      </h2>

                      {results.length > 0 ? (
                        <>
                          {/* Chart with legend side-by-side */}
                          <div className="d-flex justify-content-center mb-5 flex-wrap gap-4">
                            <div style={{ width: 300, height: 300 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <LegendContainer data={pieData} />
                          </div>

                          {/* Clause Cards */}
                          <div className="row g-4">
                            {results.map((clauseData, index) => (
                              <div key={index} className="col-md-6">
                                <ClauseDisplay
                                  data={clauseData}
                                  index={index}
                                  phase={phase}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-muted">
                          No analysis results yet. Please upload a document first.
                        </p>
                      )}
                    </div>
                  }
                />
              );
            })}
          </Routes>
        </div>
      </main>
    </Router>
  );
};

export default App;
