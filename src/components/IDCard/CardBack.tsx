import React from "react";

const CARD_W = 204;
const CARD_H = 323;
const SCALE = 2;
const RW = CARD_W * SCALE;
const RH = CARD_H * SCALE;

const CardBack = React.forwardRef<HTMLDivElement>((_, ref) => {
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
          flexDirection: "column",
          background: "#fff",
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Main content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 20px 0", overflow: "hidden" }}>

          {/* School logo + name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 10 }}>
            <img
              src="/graceschhollogo.png"
              alt="Grace Schools"
              style={{ width: 150, height: 150, objectFit: "contain", display: "block" }}
            />
           
          </div>

          {/* Get in touch */}
          <div style={{ background: "#c0392b", borderRadius: 4, textAlign: "center", padding: "6px 0", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: 1 }}>
              Get in touch
            </span>
          </div>

          {/* Contact details */}
          <div style={{ fontSize: 10, color: "#333", lineHeight: 1.6, marginBottom: 10, textAlign: "center" }}>
            <strong>Address:</strong> Plot 241 Ajidagan Street,<br />
            Gbagada Estate, Phase I P.O. Box 1050, Lagos, Nigeria.<br />
            <strong>Tel:</strong> +234-(0)8023061195, (0)9021687291-4,<br />
            +234-(0)8108650100, (0)8108644495,<br />
            +234-(0)8108631053, (0)8108814184<br />
            <strong>Email:</strong> admissions@graceschools.net<br />
            <strong>Website:</strong> graceschools.net
          </div>

          {/* Terms header */}
          <div style={{ border: "1.5px solid #c0392b", borderRadius: 4, textAlign: "center", padding: "5px 0", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 12, fontWeight: 600, color: "#c0392b", letterSpacing: 0.8 }}>
              TERMS &amp; CONDITIONS / USAGE
            </span>
          </div>

          {/* Terms list */}
          <ol style={{ fontSize: 10, color: "#333", lineHeight: 1.65, paddingLeft: 16, margin: "0 0 10px" }}>
            <li>This ID card is the property of Grace Schools.</li>
            <li>This card is valid only for the currently enrolled student</li>
            <li>Lost or damaged cards must be reported immediately</li>
            <li>Xpay functionality is subject to separate terms and conditions</li>
            <li>By using this card, the holder agrees to all Grace Schools and Xpay policies</li>
          </ol>

          {/* In Collaboration With + Xpay logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 10, color: "#777", fontStyle: "italic", margin: "0 0 6px" }}>
              In Collaboration With
            </p>
            <img
              src="/xpay.jpeg"
              alt="Xpay"
              style={{ width: 90, height: 100, objectFit: "contain", display: "block" }}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ background: "#c0392b", padding: "8px 16px", textAlign: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: "#fff", margin: 0, lineHeight: 1.6 }}>
            For customer service, contact 07084755837 or 09154110883.<br />
            Email: customersupport@xpay.ng
          </p>
        </div>
      </div>
    </div>
  );
});

CardBack.displayName = "CardBack";
export default CardBack;