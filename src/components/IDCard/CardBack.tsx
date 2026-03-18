import React from "react";

function SchoolCrest({ size = 44 }: { size?: number }) {
  const RED = "#c0392b";
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 74,20 74,55 40,76 6,55 6,20" fill="#fff" stroke={RED} strokeWidth="3" />
      <rect x="22" y="28" width="36" height="26" rx="2" fill="#fff" stroke={RED} strokeWidth="1.5" />
      <rect x="22" y="28" width="18" height="26" fill={RED} opacity="0.12" />
      <rect x="22" y="28" width="36" height="13" fill="#1a6b2e" opacity="0.12" />
      <circle cx="40" cy="18" r="6" fill={RED} />
      <line x1="40" y1="12" x2="40" y2="24" stroke="#fff" strokeWidth="1.5" />
      <text x="40" y="48" textAnchor="middle" fontSize="7" fontFamily="Lato,sans-serif" fontWeight="700" fill="#1a1a1a">
        God First
      </text>
    </svg>
  );
}

const CardBack = React.forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      style={{ width: 242, height: 385, fontFamily: "'Lato', sans-serif" }}
      className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md flex-shrink-0"
    >
      <div className="flex flex-col flex-1 px-4 pt-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-3">
          <SchoolCrest size={44} />
          <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 600, color: "#1a1a2e", margin: "2px 0 0" }}>
            Grace Schools
          </p>
          <p style={{ fontSize: 9, color: "#888", margin: "1px 0 0" }}>
            Nursery · Primary · High School
          </p>
        </div>

        {/* Get in touch */}
        <div
          className="text-center rounded mb-2"
          style={{ background: "#c0392b", color: "#fff", fontFamily: "'Oswald',sans-serif", fontSize: 11, fontWeight: 600, padding: "5px 0", letterSpacing: 1 }}
        >
          Get in touch
        </div>
        <div style={{ fontSize: 9, color: "#333", lineHeight: 1.7, marginBottom: 8, textAlign: "center" }}>
          <strong>Address:</strong> Plot 241 Ajidagan Street, Gbagada Estate,<br />
          Phase I P.O. Box 1050, Lagos, Nigeria.<br />
          <strong>Tel:</strong> +234-(0)8023061195, (0)9021687291-4<br />
          +234-(0)8108650100, (0)8108644495<br />
          <strong>Email:</strong> admissions@graceschools.net<br />
          <strong>Website:</strong> graceschools.net
        </div>

        {/* Terms */}
        <div
          className="text-center rounded mb-2"
          style={{ border: "1.5px solid #c0392b", color: "#c0392b", fontFamily: "'Oswald',sans-serif", fontSize: 10, fontWeight: 600, padding: "4px 0", letterSpacing: 0.8 }}
        >
          TERMS &amp; CONDITIONS / USAGE
        </div>
        <ol style={{ fontSize: 8.5, color: "#444", lineHeight: 1.7, paddingLeft: 14, margin: "0 0 8px" }}>
          <li>This ID card is the property of Grace Schools.</li>
          <li>Valid only for the currently enrolled student.</li>
          <li>Lost or damaged cards must be reported immediately.</li>
          <li>Xpay functionality is subject to separate terms.</li>
          <li>By using this card, holder agrees to all Grace Schools and Xpay policies.</li>
        </ol>

        {/* Xpay */}
        <div className="text-center mt-auto mb-3">
          <p style={{ fontSize: 9, color: "#777", fontStyle: "italic", margin: "0 0 4px" }}>In Collaboration With</p>
          <div className="flex items-center justify-center gap-1">
            <svg width="20" height="20" viewBox="0 0 36 36">
              <rect x="2" y="2" width="32" height="32" rx="4" fill="#1a1aff" />
              <text x="18" y="27" textAnchor="middle" fontSize="22" fontWeight="700" fontFamily="Arial,sans-serif" fill="#fff">X</text>
            </svg>
            <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 17, fontWeight: 700, color: "#1a1aff", letterSpacing: 2 }}>
              Xpay
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center px-3 py-2" style={{ background: "#c0392b" }}>
        <p style={{ fontSize: 8, color: "#fff", margin: 0, lineHeight: 1.6 }}>
          For customer service, contact 07084755837 or 09154110883.<br />
          Email: customersupport@xpay.ng
        </p>
      </div>
    </div>
  );
});

CardBack.displayName = "CardBack";
export default CardBack;