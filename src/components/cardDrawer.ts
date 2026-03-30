/**
 * drawCardFront / drawCardBack
 *
 * Draws ID cards directly onto an HTML Canvas using the 2D API.
 * Physical card: 54 mm × 85.6 mm  @  300 DPI  →  638 × 1012 px
 */

const DPI = 300;
const MM = DPI / 25.4;

export const CARD_PX_W = Math.round(54 * MM);   // 638
export const CARD_PX_H = Math.round(85.6 * MM); // 1012

const RED = '#c0392b';

// ─── helpers ─────────────────────────────────────────────────────────────

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  if (url.startsWith('data:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  try {
    const encoded = url.replace(/ /g, '%20');
    const res = await fetch(encoded, { mode: 'cors', credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawQR(
  ctx: CanvasRenderingContext2D,
  data: string,
  x: number, y: number, size: number
) {
  const seed = data.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = 11;
  const cell = size / (cells + 2);
  const o = cell;

  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#000';

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3);
      if (isCorner) continue;
      const v = ((seed * (r + 3) * (c + 7) * 2654435761) >>> 0);
      if (v % 3 !== 0) ctx.fillRect(x + o + c * cell, y + o + r * cell, cell - 1, cell - 1);
    }
  }

  const drawCorner = (cx: number, cy: number) => {
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy, cell * 3, cell * 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx + cell * 0.5, cy + cell * 0.5, cell * 2, cell * 2);
    ctx.fillStyle = '#000'; ctx.fillRect(cx + cell, cy + cell, cell, cell);
  };
  drawCorner(x + o, y + o);
  drawCorner(x + o + (cells - 3) * cell, y + o);
  drawCorner(x + o, y + o + (cells - 3) * cell);
}

/**
 * Draw image using CONTAIN — full image visible, centred, no cropping.
 * Fills background first to handle letterbox areas.
 */
function drawContainImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
  bgColor = '#ffffff'
) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(dx, dy, dw, dh);

  const srcAspect = img.naturalWidth / img.naturalHeight;
  const dstAspect = dw / dh;

  let destW: number, destH: number, destX: number, destY: number;

  if (srcAspect > dstAspect) {
    // Wider image → fit to width, letterbox top/bottom
    destW = dw;
    destH = dw / srcAspect;
    destX = dx;
    destY = dy + (dh - destH) / 2;
  } else {
    // Taller image → fit to height, letterbox left/right
    destH = dh;
    destW = dh * srcAspect;
    destX = dx + (dw - destW) / 2;
    destY = dy;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, destX, destY, destW, destH);
  ctx.restore();
}

// ─── FRONT ───────────────────────────────────────────────────────────────

export interface CardStudent {
  name: string;
  email: string;
  photoUrl: string;
  qrData: string;
  admissionNumber: string;
}

export async function drawCardFront(
  canvas: HTMLCanvasElement,
  student: CardStudent,
  logoUrl: string
): Promise<void> {
  canvas.width = CARD_PX_W;
  canvas.height = CARD_PX_H;
  const ctx = canvas.getContext('2d')!;
  const W = CARD_PX_W;  // 638
  const H = CARD_PX_H;  // 1012

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // ── Left red banner (~13% width) ─────────────────────────────────────────
  const BANNER = Math.round(W * 0.15); // ~83px
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, BANNER, H);

  // "STUDENT" vertically centred, matching system preview weight
  ctx.save();
  ctx.translate(BANNER / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#fff';
  ctx.font = `1000 ${Math.round(W * 0.080)}px 'Oswald', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '20px';
  ctx.fillText('STUDENT', 0, 0);
  ctx.restore();

  // ── Body geometry ─────────────────────────────────────────────────────────
  const hPad = Math.round(W * 0.032);
  const bx = BANNER + hPad;
  const bw = W - bx - hPad;
  const cx = bx + bw / 2;

  let curY = Math.round(H * 0.018);

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoSize = Math.round(H * 0.180);
  const logoImg = await loadImage(logoUrl);
  if (logoImg) {
    drawContainImage(ctx, logoImg, cx - logoSize / 2, curY, logoSize, logoSize, '#fff');
  } else {
    ctx.fillStyle = '#eee';
    ctx.fillRect(cx - logoSize / 2, curY, logoSize, logoSize);
  }
  curY += logoSize + Math.round(H * 0.01);

  // ── Photo — NO border, NO background, just the image ─────────────────────
  const photoW = Math.round(bw * 0.84);
  const photoH = Math.round(H * 0.35);
  const photoX = cx - photoW / 2;
  const photoY = curY;

  const photoImg = await loadImage(student.photoUrl);
  if (photoImg) {
    // Transparent background — no fill, no stroke
    drawContainImage(ctx, photoImg, photoX, photoY, photoW, photoH, '#ffffff');
  } else {
    // Silhouette placeholder (no box)
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(cx, photoY + photoH * 0.33, photoW * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, photoY + photoH * 0.74, photoW * 0.27, photoH * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  curY = photoY + photoH + Math.round(H * 0.040); 

  // ── Student name ──────────────────────────────────────────────────────────
  const nameFontSize = Math.round(W * 0.045);
  ctx.font = `900 ${nameFontSize}px 'Oswald', sans-serif`;
  ctx.fillStyle = RED;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const nameText = student.name.toUpperCase();
  const maxNameW = bw * 0.95;

  if (ctx.measureText(nameText).width > maxNameW) {
    const parts = nameText.split(' ');
    const mid = Math.ceil(parts.length / 2);
    ctx.fillText(parts.slice(0, mid).join(' '), cx, curY);
    curY += nameFontSize * 1.15;
    ctx.fillText(parts.slice(mid).join(' '), cx, curY);
    curY += nameFontSize * 1.2;
  } else {
    ctx.fillText(nameText, cx, curY);
    curY += nameFontSize * 1.2;
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  const emailFontSize = Math.round(W * 0.030);
  ctx.font = `${emailFontSize}px 'Lato', sans-serif`;
  ctx.fillStyle = '#555';
  ctx.textAlign = 'center';
  let emailText = student.email;
  while (ctx.measureText(emailText).width > bw * 0.95 && emailText.length > 6) {
    emailText = emailText.slice(0, -4) + '…';
  }
  ctx.fillText(emailText, cx, curY);
  curY += emailFontSize * 1.6;

  // ── QR Code — no "Scan Me" label ─────────────────────────────────────────
  const footerH = Math.round(H * 0.068);
  const footerY = H - footerH;
  const availForQR = footerY - Math.round(H * 0.01) - curY;
  const qrSize = Math.min(availForQR, Math.round(bw * 0.78));
  const qrX = cx - qrSize / 2;
  const qrY = curY + (availForQR - qrSize) / 2;

  const isQrImage =
    student.qrData.startsWith('data:image') ||
    student.qrData.startsWith('http') ||
    student.qrData.startsWith('/uploads');

  if (isQrImage) {
    const qrImg = await loadImage(student.qrData);
    if (qrImg) drawContainImage(ctx, qrImg, qrX, qrY, qrSize, qrSize, '#fff');
    else drawQR(ctx, student.qrData, qrX, qrY, qrSize);
  } else {
    drawQR(ctx, student.qrData, qrX, qrY, qrSize);
  }

  // ── Footer — bold Adm No ──────────────────────────────────────────────────
  ctx.fillStyle = RED;
  ctx.fillRect(0, footerY, W, footerH);

  const ftFontSize = Math.round(W * 0.036);
  ctx.font = `900 ${ftFontSize}px 'Oswald', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Adm No: ${student.admissionNumber}`, W / 2, footerY + footerH / 2);
}

// ─── BACK ────────────────────────────────────────────────────────────────

export async function drawCardBack(
  canvas: HTMLCanvasElement,
  logoUrl: string,
  xpayLogoUrl: string
): Promise<void> {
  canvas.width = CARD_PX_W;
  canvas.height = CARD_PX_H;
  const ctx = canvas.getContext('2d')!;
  const W = CARD_PX_W;
  const H = CARD_PX_H;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  const pad = Math.round(W * 0.052);
  const contentW = W - pad * 2;
  let y = Math.round(H * 0.02);

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoSize = Math.round(W * 0.28);
  const logoImg = await loadImage(logoUrl);
  if (logoImg) {
    drawContainImage(ctx, logoImg, W / 2 - logoSize / 2, y, logoSize, logoSize, '#fff');
  } else {
    ctx.fillStyle = '#eee';
    ctx.fillRect(W / 2 - logoSize / 2, y, logoSize, logoSize);
  }
  y += logoSize + Math.round(H * 0.01);

  // ── "Get in touch" bar ───────────────────────────────────────────────────
  const barH = Math.round(H * 0.038);
  ctx.fillStyle = RED;
  roundRect(ctx, pad, y, contentW, barH, 5);
  ctx.fill();
  const barFontSize = Math.round(W * 0.028);
  ctx.font = `600 ${barFontSize}px 'Oswald', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Get in touch', W / 2, y + barH / 2);
  y += barH + Math.round(H * 0.030);

  // ── Contact lines ─────────────────────────────────────────────────────────
  const cFontSize = Math.round(W * 0.030);
  const cLH = cFontSize * 1.55;
  ctx.font = `${cFontSize}px 'Lato', sans-serif`;
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const contactLines = [
    'Plot 241 Ajagba Street, Gbagada Estate,',
    'Phase I P.O. Box 1050, Lagos, Nigeria.',
    'Tel: +234 (0)8023061105, (0)9021687291-4',
    '+234 (0)8108650100, (0)8100654449',
    '+234 (0)8108631063, (0)8106814184',
    'Email: admissions@graceschools.net',
    'Website: graceschools.net',
  ];
  for (const line of contactLines) {
    ctx.fillText(line, W / 2, y);
    y += cLH;
  }
  y += Math.round(H * 0.008);

  // ── Terms header ──────────────────────────────────────────────────────────
  const tHdrH = Math.round(H * 0.040);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  roundRect(ctx, pad, y, contentW, tHdrH, 4);
  ctx.stroke();
  const tHdrFont = Math.round(W * 0.025);
  ctx.font = `600 ${tHdrFont}px 'Oswald', sans-serif`;
  ctx.fillStyle = RED;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TERMS & CONDITIONS / USAGE', W / 2, y + tHdrH / 2);
  y += tHdrH + Math.round(H * 0.025);

  // ── Terms list ────────────────────────────────────────────────────────────
  const tFontSize = Math.round(W * 0.030);
  const tLH = tFontSize * 1.65;
  ctx.font = `${tFontSize}px 'Lato', sans-serif`;
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const terms = [
    '1. This ID card is the property of Grace Schools.',
    '2. Valid only for the currently enrolled student.',
    '3. Lost or damaged cards must be reported immediately.',
    '4. Xpay functionality subject to separate terms.',
    '5. Holder agrees to all Grace Schools & Xpay policies.',
  ];
  for (const term of terms) {
    ctx.fillText(term, pad, y);
    y += tLH;
  }
  y += Math.round(H * 0.014);

  // ── "In Collaboration With" ───────────────────────────────────────────────
  const collabFont = Math.round(W * 0.022);
  ctx.font = `italic ${collabFont}px 'Lato', sans-serif`;
  ctx.fillStyle = '#777';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('In Collaboration With', W / 2, y);
  y += collabFont * 1.6;

  // ── Xpay logo ─────────────────────────────────────────────────────────────
  const xpayH = Math.round(H * 0.08);
  const xpayW = Math.round(xpayH * 0.9);
  const xpayImg = await loadImage(xpayLogoUrl);
  if (xpayImg) {
    drawContainImage(ctx, xpayImg, W / 2 - xpayW / 2, y, xpayW, xpayH, '#fff');
  } else {
    ctx.fillStyle = '#eee';
    ctx.fillRect(W / 2 - xpayW / 2, y, xpayW, xpayH);
    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.round(W * 0.026)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XPAY', W / 2, y + xpayH / 2);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerH = Math.round(H * 0.068);
  const footerY = H - footerH;
  ctx.fillStyle = RED;
  ctx.fillRect(0, footerY, W, footerH);

  const fFont = Math.round(W * 0.022);
  ctx.font = `${fFont}px 'Lato', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('For customer service: 07064755837 or 09154110883', W / 2, footerY + footerH * 0.32);
  ctx.fillText('Email: customersupport@xpay.ng', W / 2, footerY + footerH * 0.68);
}