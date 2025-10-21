import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Color palette for clause types / risk levels
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CF0", "#FF6699",
  "#33CC99", "#9966FF", "#FF4444", "#FFCC00", "#66CCFF", "#99FF99",
  "#FF9966", "#CC99FF", "#66FFCC", "#FF66B2"
];

// Scrollable legend container
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

// Generic Pie Chart with Right-Side Legend
const PieChartWithLegend = ({ chartData }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      flexWrap: "nowrap", // Prevent wrapping
      margin: "0 auto",
      maxWidth: 800, // Optional: controls total width
    }}
  >
    {/* Chart Container */}
    <div style={{ width: 300, height: 300, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Spacer */}
    <div style={{ width: 30 }} />

    {/* Legend Container */}
    <LegendContainer data={chartData} />
  </div>
);

// Clause Type Chart Component
export const ClauseTypeChart = ({ data }) => {
  const typeCounts = data.reduce((acc, clause) => {
    const type = clause.phase1?.predicted_clause_type || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return <PieChartWithLegend chartData={chartData} />;
};

// Risk Level Chart Component
export const RiskLevelChart = ({ data }) => {
  const riskCounts = data.reduce((acc, clause) => {
    const risk = clause.phase3?.risk_level || "Unknown";
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(riskCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return <PieChartWithLegend chartData={chartData} />;
};
