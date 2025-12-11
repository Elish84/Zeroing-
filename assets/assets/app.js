// ===== Zeroing App (Plain JS) =====

// טבלת יחס נשק -> יחס קליקים לקובייה (אפשר לעדכן לפי הנהלים שלכם)
const WEAPON_RATIOS = {
  // דוגמה:
  // 'M4-iron': { elevClicksPerSquare: 3, windClicksPerSquare: 3 }
  'M16-iron': null,
  'M16-optic': null,
  'M16-trijicon': null,
  'M4-iron': null,
  'M4-optic': null,
  'M4-trijicon': null,
  'Tavor': null
};

const state = {
  mode: 'desired',          // desired | ruler | hits
  image: null,
  pixelsPerCm: null,
  desiredHit: null,
  ruler: [],
  hits: [],
  config: {
    gridSizeCm: 1,
    elevClicksPerSquare: 0,
    windClicksPerSquare: 0
  },
  result: null
};

// ===== מצביעים לאלמנטים =====
const el = {
  unitCompany: document.getElementById('unitCompany'),
  unitPlatoon: document.getElementById('unitPlatoon'),
  weaponType: document.getElementById('weaponType'),
  gridSizeCm: document.getElementById('gridSizeCm'),
  elevClicksPerSquare: document.getElementById('elevClicksPerSquare'),
  windClicksPerSquare: document.getElementById('windClicksPerSquare'),
  btnConfirmRatios: document.getElementById('btnConfirmRatios'),
  fileInput: document.getElementById('zeroingImage'),
  canvas: document.getElementById('zeroingCanvas'),
  modeLabel: document.getElementById('modeLabel'),
  btnDesiredHit: document.getElementById('btnDesiredHit'),
  btnRuler: document.getElementById('btnRuler'),
  btnHits: document.getElementById('btnHits'),
  btnClearHits: document.getElementById('btnClearHits'),
  btnCompute: document.getElementById('btnCompute'),
  resultText: document.getElementById('resultText'),
  btnMakeCert: document.getElementById('btnMakeCert'),
  btnDownloadCert: document.getElementById('btnDownloadCert'),
  btnOpenWhatsApp: document.getElementById('btnOpenWhatsApp'),
  certCanvas: document.getElementById('certCanvas')
};

const ctx = el.canvas.getContext('2d');
const certCtx = el.certCanvas.getContext('2d');

// ===== עוזרים =====
function setMode(mode) {
  state.mode = mode;
  let label = 'מצב: ';
  if (mode === 'desired') label += 'נקודת רצויה';
  else if (mode === 'ruler') label += 'סרגל 1 ס"מ';
  else if (mode === 'hits') label += 'סימון פגיעות';
  el.modeLabel.textContent = label;
  draw();
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function avg(points) {
  const n = points.length;
  if (!n) return null;
  let sx = 0, sy = 0;
  points.forEach(p => { sx += p.x; sy += p.y; });
  return { x: sx / n, y: sy / n };
}

function pxToCm(px) {
  if (!state.pixelsPerCm) return null;
  return px / state.pixelsPerCm;
}

function cmToSquares(cm) {
  return cm / state.config.gridSizeCm;
}

function updateRatiosFromWeapon() {
  const key = el.weaponType.value;
  const ratio = WEAPON_RATIOS[key];
  if (!ratio) return; // אם לא הוגדר, לא עושים כלום
  el.elevClicksPerSquare.value = ratio.elevClicksPerSquare;
  el.windClicksPerSquare.value = ratio.windClicksPerSquare;
  applyRatiosFromInputs();
}

function applyRatiosFromInputs() {
  state.config.gridSizeCm = parseFloat(el.gridSizeCm.value) || 1;
  state.config.elevClicksPerSquare = parseFloat(el.elevClicksPerSquare.value) || 0;
  state.config.windClicksPerSquare = parseFloat(el.windClicksPerSquare.value) || 0;
}

// ===== ציור קנבס =====
function clearCanvas() {
  ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
}

function draw() {
  clearCanvas();
  if (!state.image) return;

  // מציירים את התמונה
  ctx.drawImage(state.image, 0, 0, el.canvas.width, el.canvas.height);

  // נקודת פגיעה רצויה
  if (state.desiredHit) {
    drawCross(state.desiredHit.x, state.desiredHit.y, '#22c55e');
    label(state.desiredHit.x + 6, state.desiredHit.y - 8, 'רצוי', '#22c55e');
  }

  // סרגל
  if (state.ruler.length === 2) {
    const [a, b] = state.ruler;
    drawLine(a, b, '#38bdf8');
    drawCircle(a.x, a.y, 5, '#38bdf8');
    drawCircle(b.x, b.y, 5, '#38bdf8');
    const d = dist(a, b);
    label((a.x + b.x) / 2, (a.y + b.y) / 2 - 10,
      `1 ס"מ (${d.toFixed(1)}px)`, '#38bdf8');
  } else if (state.ruler.length === 1) {
    drawCircle(state.ruler[0].x, state.ruler[0].y, 5, '#38bdf8');
  }

  // פגיעות
  if (state.hits.length) {
    state.hits.forEach(p => drawCircle(p.x, p.y, 5, '#ef4444'));
    const c = avg(state.hits);
    if (c) {
      drawCross(c.x, c.y, '#ef4444');
      label(c.x + 6, c.y - 8, 'מרכז קבוצה', '#ef4444');
    }
  }
}

function drawCircle(x, y, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCross(x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 8, y);
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y + 8);
  ctx.stroke();
}

function drawLine(a, b, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function label(x, y, text, color) {
  ctx.fillStyle = color;
  ctx.font = 'bold 13px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

// ===== אירועים =====

// בחירת נשק
el.weaponType.addEventListener('change', updateRatiosFromWeapon);

// אישור יחס קובייה–קליקים
el.btnConfirmRatios.addEventListener('click', () => {
  applyRatiosFromInputs();
  alert('יחס קובייה-קליקים עודכן.');
});

// העלאת תמונה
el.fileInput.addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.image = img;

    // התאמת גודל התמונה לקנבס, תוך שמירה על גודל סביר
    const maxW = 1600;
    const maxH = 1200;
    let w = img.width;
    let h = img.height;
    const scale = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * scale);
    h = Math.round(h * scale);

    el.canvas.width = w;
    el.canvas.height = h;

    draw();
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

// מצבי עבודה
el.btnDesiredHit.addEventListener('click', () => setMode('desired'));
el.btnRuler.addEventListener('click', () => {
  state.ruler = [];
  state.pixelsPerCm = null;
  setMode('ruler');
});
el.btnHits.addEventListener('click', () => setMode('hits'));
el.btnClearHits.addEventListener('click', () => {
  state.hits = [];
  draw();
});

// קליק על הקנבס
el.canvas.addEventListener('click', (ev) => {
  if (!state.image) return;
  const rect = el.canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;

  if (state.mode === 'desired') {
    state.desiredHit = { x, y };
  } else if (state.mode === 'ruler') {
    state.ruler.push({ x, y });
    if (state.ruler.length > 2) {
      state.ruler = state.ruler.slice(-2);
    }
    if (state.ruler.length === 2) {
      const dpx = dist(state.ruler[0], state.ruler[1]);
      state.pixelsPerCm = dpx; // שתי נקודות = 1 ס"מ
    }
  } else if (state.mode === 'hits') {
    state.hits.push({ x, y });
  }

  draw();
});

// חישוב תיקון
el.btnCompute.addEventListener('click', () => {
  if (!state.desiredHit) {
    alert('יש לסמן נקודת פגיעה רצויה.');
    return;
  }
  if (state.hits.length === 0) {
    alert('יש לסמן לפחות פגיעה אחת.');
    return;
  }
  if (!state.pixelsPerCm) {
    alert('יש למדוד 1 ס"מ על הדף (סרגל) לפני החישוב.');
    return;
  }

  applyRatiosFromInputs();

  const center = avg(state.hits);
  const dxPx = center.x - state.desiredHit.x; // חיובי = מחוץ ימינה
  const dyPx = center.y - state.desiredHit.y; // חיובי = למטה

  const dxCm = pxToCm(dxPx);
  const dyCm = pxToCm(dyPx);

  const dxSquares = cmToSquares(Math.abs(dxCm));
  const dySquares = cmToSquares(Math.abs(dyCm));

  const elevClicks = Math.round(dySquares * state.config.elevClicksPerSquare);
  const windClicks = Math.round(dxSquares * state.config.windClicksPerSquare);

  const horizDir = dxCm > 0 ? 'ימינה' : dxCm < 0 ? 'שמאלה' : '—';
  const vertDir = dyCm > 0 ? 'מטה' : dyCm < 0 ? 'מעלה' : '—';

  state.result = { dxCm, dyCm, elevClicks, windClicks, horizDir, vertDir };

  el.resultText.textContent =
    `תיקון: צידוד ${windClicks} קליקים ${horizDir} | ` +
    `גובה ${elevClicks} קליקים ${vertDir}`;
});

// ===== תעודת איפוס =====
function drawCertificate() {
  const c = el.certCanvas;
  const ctx2 = certCtx;
  ctx2.clearRect(0, 0, c.width, c.height);

  // רקע ומסגרת
  ctx2.fillStyle = '#020617';
  ctx2.fillRect(0, 0, c.width, c.height);
  ctx2.strokeStyle = '#374151';
  ctx2.lineWidth = 4;
  ctx2.strokeRect(20, 20, c.width - 40, c.height - 40);

  // כותרת
  ctx2.fillStyle = '#e5e7eb';
  ctx2.font = 'bold 40px system-ui';
  ctx2.textAlign = 'center';
  ctx2.fillText('תעודת איפוס', c.width / 2, 80);

  // טקסט כללי
  ctx2.textAlign = 'left';
  ctx2.font = '16px system-ui';
  const ts = new Date().toLocaleString('he-IL');
  ctx2.fillText(`תאריך/שעה: ${ts}`, 60, 120);
  ctx2.fillText(`פלוגה: ${el.unitCompany.value || '—'} | מחלקה: ${el.unitPlatoon.value || '—'}`, 60, 150);

  const selectedWeapon = el.weaponType.options[el.weaponType.selectedIndex];
  const weaponLabel = selectedWeapon && selectedWeapon.textContent ? selectedWeapon.textContent : '—';
  ctx2.fillText(`נשק: ${weaponLabel}`, 60, 180);

  if (state.result) {
    const { elevClicks, windClicks, horizDir, vertDir } = state.result;
    ctx2.fillText(
      `תיקון כוונת: צידוד ${windClicks} קליקים ${horizDir}, גובה ${elevClicks} קליקים ${vertDir}`,
      60, 210
    );
  }

  // תצוגה ממוזערת של הקנבס (אם יש תמונה)
  if (el.canvas.width && el.canvas.height) {
    const thumbW = 320;
    const ratio = el.canvas.height / el.canvas.width;
    const thumbH = thumbW * ratio;

    ctx2.drawImage(
      el.canvas,
      0, 0, el.canvas.width, el.canvas.height,
      c.width - thumbW - 60, 130, thumbW, thumbH
    );

    ctx2.strokeStyle = '#374151';
    ctx2.strokeRect(c.width - thumbW - 60, 130, thumbW, thumbH);
    ctx2.fillStyle = '#94a3b8';
    ctx2.font = '14px system-ui';
    ctx2.fillText('צילום דף איפוס (ממוזער)', c.width - thumbW - 60, 120);
  }

  // שורת חתימה
  ctx2.fillStyle = '#94a3b8';
  ctx2.font = '14px system-ui';
  ctx2.fillText('חתימת המדריך: ____________________', 60, c.height - 80);
}

el.btnMakeCert.addEventListener('click', () => {
  drawCertificate();
  const dataURL = el.certCanvas.toDataURL('image/png');
  el.btnDownloadCert.href = dataURL;
  alert('התעודה נוצרה. לחץ על "הורד תעודת איפוס כתמונה" כדי לשמור.');
});

el.btnOpenWhatsApp.addEventListener('click', () => {
  const msg = encodeURIComponent('תעודת איפוס נוצרה. מצורפת התמונה לאחר הורדה/שיתוף.');
  window.open(`https://wa.me/?text=${msg}`, '_blank');
});

// אתחול ראשוני
applyRatiosFromInputs();
setMode('desired');
