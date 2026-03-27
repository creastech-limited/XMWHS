import React, { useState, useEffect } from "react";

export interface Student {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  qrData: string;
  className: string;
  session: string;
  admissionNumber: string;
}

async function toBase64(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  try {
    const encodedUrl = url.replace(/ /g, "%20");
    const res = await fetch(encodedUrl, { mode: "cors", credentials: "include" });
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
        crossOrigin="anonymous"
        alt="QR Code"
        width={size}
        height={size}
        style={{
          objectFit: "contain",
          display: "block",
          imageRendering: "pixelated",
          maxWidth: "100%",
          maxHeight: "100%",
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
      const v = ((seed * (row + 3) * (col + 7) * 2654435761) >>> 0);
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="#fff" />
      {grid.map((row, ri) =>
        row.map((on, ci) => {
          const isCorner =
            (ri < 3 && ci < 3) || (ri < 3 && ci >= cells - 3) || (ri >= cells - 3 && ci < 3);
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
const RW = CARD_W * SCALE;
const RH = CARD_H * SCALE;

const CardFront = React.forwardRef<HTMLDivElement, CardFrontProps>(({ student }, ref) => {
  const [photoSrc, setPhotoSrc] = useState<string>(student.photoUrl);
  const [qrSrc, setQrSrc] = useState<string>(student.qrData);

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
        {/* ── Red side banner — matches system preview style ── */}
        <div
          style={{
            width: 48,
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
              fontSize: 22,
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
            paddingTop: 12,
            paddingLeft: 8,
            paddingRight: 8,
            paddingBottom: 0,
            overflow: "hidden",
          }}
        >
          {/* Logo */}
          <img
            src="/graceschhollogo.png"
            alt="Grace Schools"
            crossOrigin="anonymous"
            style={{
              width: 108,
              height: 108,
              objectFit: "contain",
              display: "block",
              flexShrink: 0,
            }}
          />

          {/* Photo — no border, no background box, just the raw image */}
          <div
            style={{
              width: 150,
              height: 152,
              marginTop: 6,
              marginBottom: 0,
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
            }}
          >
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={student.name}
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <svg width="60" height="72" viewBox="0 0 60 72" fill="none">
                <circle cx="30" cy="22" r="18" fill="#ccc" />
                <ellipse cx="30" cy="60" rx="26" ry="18" fill="#ccc" />
              </svg>
            )}
          </div>

          {/* Student Name — margin-top gives breathing room below photo */}
          <p
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 17,
              fontWeight: 700,
              color: RED,
              margin: "8px 0 2px",
              textAlign: "center",
              letterSpacing: 0.5,
              lineHeight: 1.2,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {student.name.toUpperCase()}
          </p>

          {/* Email */}
          <p
            style={{
              fontSize: 10,
              color: "#555",
              margin: "0 0 8px",
              textAlign: "center",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {student.email}
          </p>

          {/* QR Code — Scan Me label removed */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              flexShrink: 0,
              marginBottom: 6,
            }}
          >
            <QRDisplay data={qrSrc} size={130} />
          </div>

          {/* Footer — Adm No, bold */}
          <div
            style={{
              background: RED,
              width: "100%",
              padding: "10px 0",
              textAlign: "center",
              flexShrink: 0,
              marginTop: "auto",
            }}
          >
            <span
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 1.5,
              }}
            >
              Adm No: {student.admissionNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

CardFront.displayName = "CardFront";
export default CardFront;