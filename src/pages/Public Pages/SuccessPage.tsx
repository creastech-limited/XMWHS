import React, { useEffect, useState } from "react";

const SuccessPage: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f4ff",
        fontFamily: "'Segoe UI', sans-serif",
        padding: "24px",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCircle {
          from { stroke-dashoffset: 283; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 80; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.25); }
          50%       { box-shadow: 0 0 0 18px rgba(99, 102, 241, 0); }
        }
      `}</style>

      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "52px 40px 48px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          opacity: visible ? 1 : 0,
          animation: visible ? "fadeUp 0.5s ease forwards" : "none",
        }}
      >
        {/* Animated circle + checkmark */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
            animation: visible ? "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both, pulse 2s ease 0.8s infinite" : "none",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            {/* Outer circle */}
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#6366f1"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="283"
              strokeDashoffset={visible ? "0" : "283"}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.7s ease 0.3s",
              }}
            />
            {/* Checkmark */}
            <polyline
              points="17,28 24,35 39,20"
              stroke="#6366f1"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="80"
              strokeDashoffset={visible ? "0" : "80"}
              style={{
                transition: "stroke-dashoffset 0.5s ease 0.9s",
              }}
            />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#1e1b4b",
            margin: "0 0 12px",
            opacity: visible ? 1 : 0,
            animation: visible ? "fadeUp 0.5s ease 0.6s both" : "none",
          }}
        >
          Account Activated!
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: "15px",
            color: "#6b7280",
            lineHeight: 1.65,
            margin: "0 0 8px",
            opacity: visible ? 1 : 0,
            animation: visible ? "fadeUp 0.5s ease 0.75s both" : "none",
          }}
        >
          Your account has been successfully activated.
        </p>

        <p
          style={{
            fontSize: "15px",
            color: "#6b7280",
            lineHeight: 1.65,
            margin: "0 0 36px",
            opacity: visible ? 1 : 0,
            animation: visible ? "fadeUp 0.5s ease 0.85s both" : "none",
          }}
        >
          Please go back to your mobile app to login.
        </p>

        {/* Decorative divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
            opacity: visible ? 1 : 0,
            animation: visible ? "fadeUp 0.5s ease 0.95s both" : "none",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          <span style={{ fontSize: "12px", color: "#9ca3af", letterSpacing: "0.05em" }}>
            ALL DONE
          </span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>

        {/* Mobile app hint */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#eef2ff",
            borderRadius: "12px",
            padding: "10px 20px",
            opacity: visible ? 1 : 0,
            animation: visible ? "fadeUp 0.5s ease 1.05s both" : "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#4f46e5" }}>
            Open your mobile app
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;