import React from "react";

export interface Student {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  qrData: string;
  className: string;
  session: string;
}

function SchoolCrest({ size = 52 }: { size?: number }) {
  const RED = "#c0392b";
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 74,20 74,55 40,76 6,55 6,20" fill="#fff" stroke={RED} strokeWidth="3" />
      <polygon points="40,10 68,24 68,52 40,70 12,52 12,24" fill="#1a6b2e" opacity="0.12" />
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

// Renders real QR if data is a base64/URL image, otherwise falls back to pattern
function QRDisplay({ data, size = 88 }: { data: string; size?: number }) {
  const isImage = data.startsWith("data:image") || data.startsWith("http") || data.startsWith("/uploads");
  if (isImage) {
    return (
      <img
        src={data}
        alt="QR Code"
        width={size}
        height={size}
        crossOrigin="anonymous"
        style={{ objectFit: "contain", display: "block" }}
      />
    );
  }

  // Fallback pattern for text-based qrData
  const seed = data.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = 10;
  const cellSize = size / (cells + 2);
  const o = cellSize;
  const grid = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      const v = ((seed * (row + 1) * (col + 1) * 2654435761) >>> 0);
      return v % 3 !== 0;
    })
  );
  const corner = (x: number, y: number) => (
    <g key={`c${x}${y}`}>
      <rect x={x} y={y} width={cellSize * 3} height={cellSize * 3} fill="#000" rx="1" />
      <rect x={x + cellSize * 0.5} y={y + cellSize * 0.5} width={cellSize * 2} height={cellSize * 2} fill="#fff" rx="0.5" />
      <rect x={x + cellSize} y={y + cellSize} width={cellSize} height={cellSize} fill="#000" rx="0.3" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#fff" />
      {grid.map((row, ri) =>
        row.map((on, ci) => {
          if ((ri < 3 && ci < 3) || (ri < 3 && ci >= cells - 3) || (ri >= cells - 3 && ci < 3)) return null;
          return on ? (
            <rect key={`${ri}-${ci}`} x={o + ci * cellSize} y={o + ri * cellSize} width={cellSize - 0.5} height={cellSize - 0.5} fill="#000" />
          ) : null;
        })
      )}
      {corner(o, o)}
      {corner(o + (cells - 3) * cellSize, o)}
      {corner(o, o + (cells - 3) * cellSize)}
    </svg>
  );
}

interface CardFrontProps {
  student: Student;
  forExport?: boolean;
}

const CardFront = React.forwardRef<HTMLDivElement, CardFrontProps>(
  ({ student }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: 242, height: 385, fontFamily: "'Lato', sans-serif" }}
        className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md flex-shrink-0"
      >
        {/* Red side banner */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, background: "#c0392b" }}>
          <span
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: 4,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
            }}
          >
            STUDENT
          </span>
        </div>

        {/* Main body */}
        <div className="flex flex-col items-center flex-1 pt-3 px-2">
          <SchoolCrest size={52} />
          <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 600, color: "#1a1a2e", margin: "2px 0 0", letterSpacing: 0.5 }}>
            Grace Schools
          </p>
          <p style={{ fontSize: 9, color: "#777", margin: "1px 0 8px" }}>
            Nursery · Primary · High School
          </p>

          {/* Photo */}
          <div
            className="overflow-hidden bg-gray-100 flex-shrink-0"
            style={{ width: 110, height: 130, border: "2px solid #ddd", marginBottom: 8 }}
          >
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
                  <circle cx="20" cy="15" r="11" fill="#bbb" />
                  <ellipse cx="20" cy="42" rx="18" ry="12" fill="#bbb" />
                </svg>
              </div>
            )}
          </div>

          <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 700, color: "#c0392b", margin: 0, textAlign: "center", letterSpacing: 0.5, lineHeight: 1.2 }}>
            {student.name.toUpperCase()}
          </p>
          <p style={{ fontSize: 10, color: "#555", margin: "2px 0 3px", textAlign: "center" }}>
            {student.email}
          </p>
          <p style={{ fontSize: 9, color: "#888", margin: "0 0 5px" }}>
            {student.className} · {student.session}
          </p>

          {/* Scan label */}
          <div className="flex items-center gap-1 self-start pl-1 mb-1">
            <span style={{ fontSize: 9, color: "#666" }}>Scan Me</span>
            <svg width="18" height="14" viewBox="0 0 22 18">
              <path d="M11 9 Q11 3 17 3" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M11 9 Q11 1 20 1" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
              <circle cx="11" cy="9" r="1.5" fill="#555" />
            </svg>
          </div>

          <QRDisplay data={student.qrData} size={78} />

          {/* Footer */}
          <div
            className="w-full text-center mt-auto"
            style={{ background: "#c0392b", padding: "8px 0", marginLeft: -8, marginRight: -8, width: "calc(100% + 16px)" }}
          >
            <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 11, fontWeight: 600, color: "#fff", letterSpacing: 2 }}>
              PAY SMART WITH XPAY
            </span>
          </div>
        </div>
      </div>
    );
  }
);

CardFront.displayName = "CardFront";
export default CardFront;