import React, { useState, useEffect } from "react";

export interface Student {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  qrData: string;
  className: string;
  session: string;
}

// Converts a URL to a base64 data URL so html2canvas can embed it without CORS issues
async function toBase64(url: string): Promise<string> {
  try {
    const encodedUrl = url.replace(/ /g, "%20");
    const res = await fetch(encodedUrl, {
      mode: "cors",
      credentials: "include", // include auth cookies if your API requires them
    });
    if (!res.ok) return url;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

function QRDisplay({ data, size = 80 }: { data: string; size?: number }) {
  const isImage =
    data.startsWith("data:image") ||
    data.startsWith("http") ||
    data.startsWith("/uploads");

  if (isImage) {
    return (
      <img
        src={data}
        crossOrigin="anonymous" // ← ADDED: prevents canvas taint
        alt="QR Code"
        width={size}
        height={size}
        style={{
          objectFit: "contain",
          display: "block",
          imageRendering: "pixelated",
        }}
      />
    );
  }

  const seed = data.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = 11;
  const cellSize = size / (cells + 2);
  const o = cellSize;
  const grid = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      const v = (seed * (row + 3) * (col + 7) * 2654435761) >>> 0;
      return v % 3 !== 0;
    })
  );
  const corner = (x: number, y: number) => (
    <g key={`c${x}${y}`}>
      <rect x={x} y={y} width={cellSize * 3} height={cellSize * 3} fill="#000" rx="1" />
      <rect
        x={x + cellSize * 0.5}
        y={y + cellSize * 0.5}
        width={cellSize * 2}
        height={cellSize * 2}
        fill="#fff"
        rx="0.5"
      />
      <rect
        x={x + cellSize}
        y={y + cellSize}
        width={cellSize}
        height={cellSize}
        fill="#000"
        rx="0.3"
      />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      <rect width={size} height={size} fill="#fff" />
      {grid.map((row, ri) =>
        row.map((on, ci) => {
          const isCorner =
            (ri < 3 && ci < 3) ||
            (ri < 3 && ci >= cells - 3) ||
            (ri >= cells - 3 && ci < 3);
          if (isCorner) return null;
          return on ? (
            <rect
              key={`${ri}-${ci}`}
              x={o + ci * cellSize}
              y={o + ri * cellSize}
              width={cellSize - 0.6}
              height={cellSize - 0.6}
              fill="#000"
            />
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
}

const RED = "#c0392b";

const CARD_W = 204;
const CARD_H = 323;
const SCALE = 2;
const RW = CARD_W * SCALE; // 408
const RH = CARD_H * SCALE; // 646

const CardFront = React.forwardRef<HTMLDivElement, CardFrontProps>(
  ({ student }, ref) => {
    const [photoSrc, setPhotoSrc] = useState<string>(student.photoUrl);
    const [qrSrc, setQrSrc] = useState<string>(student.qrData);

    // Convert photo URL → base64 so html2canvas can embed it without CORS errors
    useEffect(() => {
      if (
        student.photoUrl &&
        !student.photoUrl.startsWith("data:") &&
        (student.photoUrl.startsWith("http") || student.photoUrl.startsWith("/"))
      ) {
        toBase64(student.photoUrl).then(setPhotoSrc);
      } else {
        setPhotoSrc(student.photoUrl);
      }
    }, [student.photoUrl]);

    // Convert QR URL → base64 if it's an image URL
    useEffect(() => {
      if (
        student.qrData &&
        !student.qrData.startsWith("data:") &&
        (student.qrData.startsWith("http") || student.qrData.startsWith("/"))
      ) {
        toBase64(student.qrData).then(setQrSrc);
      } else {
        setQrSrc(student.qrData);
      }
    }, [student.qrData]);

    return (
      // Outer wrapper — visual size only (204×323), clips the 2× inner div
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          overflow: "hidden",
          borderRadius: 7,
          border: "1px solid #ddd",
          boxShadow: "0 3px 14px rgba(0,0,0,0.13)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Inner 2× render div — this is what html2canvas captures */}
        <div
          ref={ref}
          style={{
            width: RW,
            height: RH,
            transform: `scale(${1 / SCALE})`,
            transformOrigin: "top left",
            fontFamily: "'Lato', sans-serif",
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            background: "#fff",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* ── Red STUDENT side banner ── */}
          <div
            style={{
              width: 52,
              background: RED,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 7,
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
                userSelect: "none",
              }}
            >
              STUDENT
            </span>
          </div>

          {/* ── Main body ── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 16,
              paddingLeft: 10,
              paddingRight: 10,
              paddingBottom: 0,
              overflow: "hidden",
            }}
          >
            {/* School Logo */}
            <img
              src="/graceschhollogo.png"
              alt="Grace Schools"
              crossOrigin="anonymous" // ← ADDED: prevents canvas CORS taint
              style={{
                width: 150,
                height: 150,
                objectFit: "contain",
                display: "block",
              }}
            />

            {/* Student photo */}
            <div
              style={{
                width: 150,
                height: 175,
                border: "3px solid #bbb",
                background: "#f0f0f0",
                marginBottom: 10,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={student.name}
                  crossOrigin="anonymous" // ← ADDED: prevents canvas CORS taint
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ddd",
                  }}
                >
                  <svg width="54" height="66" viewBox="0 0 54 66" fill="none">
                    <circle cx="27" cy="20" r="16" fill="#bbb" />
                    <ellipse cx="27" cy="56" rx="24" ry="16" fill="#bbb" />
                  </svg>
                </div>
              )}
            </div>

            {/* Student name */}
            <p
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: RED,
                margin: "0 0 2px",
                textAlign: "center",
                letterSpacing: 0.6,
                lineHeight: 1.2,
              }}
            >
              {student.name.toUpperCase()}
            </p>

            {/* Email */}
            <p
              style={{
                fontSize: 12,
                color: "#555",
                margin: "0 0 8px",
                textAlign: "center",
              }}
            >
              {student.email}
            </p>

            {/* Scan Me + signal icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                alignSelf: "flex-start",
                paddingLeft: 4,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 11, color: "#555" }}>Scan Me</span>
              <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                <circle cx="5" cy="10" r="2.2" fill="#555" />
                <path
                  d="M9 10 Q9 6 13.5 6"
                  stroke="#555"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M9 10 Q9 2.5 17 2.5"
                  stroke="#555"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                <path
                  d="M9 10 Q9 -1 21 -1"
                  stroke="#555"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.3"
                />
              </svg>
            </div>

            {/* QR code */}
            <QRDisplay data={qrSrc} size={140} />

            <div style={{ flex: 1 }} />

            {/* Footer stripe */}
            <div
              style={{
                background: RED,
                width: "calc(100% + 20px)",
                marginLeft: -10,
                marginRight: -10,
                padding: "11px 0",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  letterSpacing: 3,
                }}
              >
                PAY SMART WITH XPAY
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CardFront.displayName = "CardFront";
export default CardFront;