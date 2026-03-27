import React from "react";

const CARD_W = 204;
const CARD_H = 323;
const SCALE = 2;
const RW = CARD_W * SCALE;
const RH = CARD_H * SCALE;

const RED = "#c0392b";

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
        {/* ── Content area ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "12px 16px 0",
            overflow: "hidden",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <img
              src="/graceschhollogo.png"
              alt="Grace Schools"
              style={{
                width: 110,
                height: 110,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* Get in touch bar */}
          <div
            style={{
              background: RED,
              borderRadius: 4,
              textAlign: "center",
              padding: "5px 0",
              marginBottom: 8,
              width: "100%",
            }}
          >
            <span
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              Get in touch
            </span>
          </div>

          {/* Contact details */}
          <div
            style={{
              fontSize: 8.5,
              color: "#333",
              lineHeight: 1.6,
              marginBottom: 9,
              textAlign: "center",
            }}
          >
            Plot 241 Ajagba Street, Gbagada Estate,<br />
            Phase I P.O. Box 1050, Lagos, Nigeria.<br />
            <strong>Tel:</strong> +234 (0)8023061105, (0)9021687291-4<br />
            +234 (0)8108650100, (0)8100654449<br />
            +234 (0)8108631063, (0)8106814184<br />
            <strong>Email:</strong> admissions@graceschools.net<br />
            <strong>Website:</strong> graceschools.net
          </div>

          {/* Terms header */}
          <div
            style={{
              border: `1.5px solid ${RED}`,
              borderRadius: 4,
              textAlign: "center",
              padding: "4px 0",
              marginBottom: 7,
            }}
          >
            <span
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 10.5,
                fontWeight: 600,
                color: RED,
                letterSpacing: 0.5,
              }}
            >
              TERMS &amp; CONDITIONS / USAGE
            </span>
          </div>

          {/* Terms list */}
          <ol
            style={{
              fontSize: 8,
              color: "#333",
              lineHeight: 1.7,
              paddingLeft: 14,
              margin: "0 0 8px",
              textAlign: "left",
            }}
          >
            <li>This ID card is the property of Grace Schools.</li>
            <li>Valid only for the currently enrolled student.</li>
            <li>Lost or damaged cards must be reported immediately.</li>
            <li>Xpay functionality subject to separate terms.</li>
            <li>Holder agrees to all Grace Schools &amp; Xpay policies.</li>
          </ol>

          {/* In Collaboration With + Xpay logo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "auto",
              marginBottom: 8,
            }}
          >
            <p
              style={{
                fontSize: 8.5,
                color: "#777",
                fontStyle: "italic",
                margin: "0 0 5px",
              }}
            >
              In Collaboration With
            </p>
            <img
              src="/xpay.jpeg"
              alt="Xpay"
              style={{
                width: 70,
                height: 70,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            background: RED,
            padding: "8px 12px",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: 8.5, color: "#fff", margin: 0, lineHeight: 1.6 }}>
            For customer service: 09019832344 or 09154110883<br />
            Email: customersupport@xpay.ng
          </p>
        </div>
      </div>
    </div>
  );
});

CardBack.displayName = "CardBack";
export default CardBack;