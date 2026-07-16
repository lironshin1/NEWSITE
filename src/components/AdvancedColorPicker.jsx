import React, { useState, useEffect, useRef } from 'react';

// פונקציות עזר להמרת צבעים
const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
  const toHex = (c) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToCmyk = (r, g, b) => {
  let rNormal = r / 255;
  let gNormal = g / 255;
  let bNormal = b / 255;
  let k = 1 - Math.max(rNormal, gNormal, bNormal);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  let c = Math.round(((1 - rNormal - k) / (1 - k)) * 100);
  let m = Math.round(((1 - gNormal - k) / (1 - k)) * 100);
  let y = Math.round(((1 - bNormal - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
};

const cmykToRgb = (c, m, y, k) => {
  const C = c / 100;
  const M = m / 100;
  const Y = y / 100;
  const K = k / 100;
  const r = Math.round(255 * (1 - C) * (1 - K));
  const g = Math.round(255 * (1 - M) * (1 - K));
  const b = Math.round(255 * (1 - Y) * (1 - K));
  return { r, g, b };
};

export default function AdvancedColorPicker({ initialColor, onConfirm, onCancel }) {
  const [hex, setHex] = useState(initialColor || '#3b82f6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [cmyk, setCmyk] = useState({ c: 76, m: 47, y: 0, k: 4 });
  const [hue, setHue] = useState(217);

  const canvasRef = useRef(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  useEffect(() => {
    const parsed = hexToRgb(hex);
    setRgb(parsed);
    setCmyk(rgbToCmyk(parsed.r, parsed.g, parsed.b));
  }, [hex]);

  // עדכון גלובלי מכל שינוי ב-RGB
  const handleRgbChange = (updatedRgb) => {
    const cleanRgb = {
      r: Math.max(0, Math.min(255, Number(updatedRgb.r || 0))),
      g: Math.max(0, Math.min(255, Number(updatedRgb.g || 0))),
      b: Math.max(0, Math.min(255, Number(updatedRgb.b || 0))),
    };
    setRgb(cleanRgb);
    setHex(rgbToHex(cleanRgb.r, cleanRgb.g, cleanRgb.b));
    setCmyk(rgbToCmyk(cleanRgb.r, cleanRgb.g, cleanRgb.b));
  };

  // עדכון גלובלי מכל שינוי ב-CMYK
  const handleCmykChange = (updatedCmyk) => {
    const cleanCmyk = {
      c: Math.max(0, Math.min(100, Number(updatedCmyk.c || 0))),
      m: Math.max(0, Math.min(100, Number(updatedCmyk.m || 0))),
      y: Math.max(0, Math.min(100, Number(updatedCmyk.y || 0))),
      k: Math.max(0, Math.min(100, Number(updatedCmyk.k || 0))),
    };
    setCmyk(cleanCmyk);
    const calculatedRgb = cmykToRgb(cleanCmyk.c, cleanCmyk.m, cleanCmyk.y, cleanCmyk.k);
    setRgb(calculatedRgb);
    setHex(rgbToHex(calculatedRgb.r, calculatedRgb.g, calculatedRgb.b));
  };

  // רינדור משטח הדירוג (גרדיאנט פוטושופ) על ה-Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let whiteGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    whiteGrad.addColorStop(0, '#fff');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let blackGrad = ctx.createLinearGradient(0, canvas.height, 0, 0);
    blackGrad.addColorStop(0, '#000');
    blackGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [hue]);

  const handleCanvasPointer = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(canvas.height, e.clientY - rect.top));
    
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(x, y, 1, 1).data;
    handleRgbChange({ r: imgData[0], g: imgData[1], b: imgData[2] });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, direction: 'ltr' }}>
      <div style={{ backgroundColor: '#2b2b2b', border: '1px solid #555', borderRadius: '4px', padding: '20px', width: '560px', color: '#fff', boxShadow: '0 15px 30px rgba(0,0,0,0.5)', fontFamily: 'sans-serif', userSelect: 'none' }}>
        
        {/* כותרת החלונית */}
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px', fontWeight: 'bold' }}>Color Picker (June Design)</div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          
          {/* 1. משטח הגרדיאנט המרכזי ( Photoshop Canvas ) */}
          <div style={{ position: 'relative', cursor: 'crosshair' }}
               onMouseDown={(e) => { setIsDraggingCanvas(true); handleCanvasPointer(e); }}
               onMouseMove={(e) => { if (isDraggingCanvas) handleCanvasPointer(e); }}
               onMouseUp={() => setIsDraggingCanvas(false)}
               onMouseLeave={() => setIsDraggingCanvas(false)}>
            <canvas ref={canvasRef} width="220" height="220" style={{ borderRadius: '2px', display: 'block' }} />
          </div>

          {/* 2. מניפת הצבעים הצידית ( Hue Slider ) */}
          <div style={{ width: '20px', height: '220px', background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)', borderRadius: '2px', position: 'relative', cursor: 'row-resize' }}
               onMouseDown={(e) => { setIsDraggingHue(true); const rect = e.currentTarget.getBoundingClientRect(); setHue(Math.round(((e.clientY - rect.top) / 220) * 360)); }}
               onMouseMove={(e) => { if (isDraggingHue) { const rect = e.currentTarget.getBoundingClientRect(); const pct = Math.max(0, Math.min(1, (e.clientY - rect.top) / 220)); setHue(Math.round(pct * 360)); } }}
               onMouseUp={() => setIsDraggingHue(false)}
               onMouseLeave={() => setIsDraggingHue(false)}>
            <div style={{ position: 'absolute', left: '-2px', right: '-2px', top: `${(hue / 360) * 220}px`, height: '4px', backgroundColor: '#fff', border: '1px solid #000', borderRadius: '2px', transform: 'translateY(-2px)' }} />
          </div>

          {/* 3. שדות הזנת נתונים ובקרה (RGB / CMYK / HEX) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            
            {/* בועת התצוגה המקדימה של הצבע */}
            <div style={{ width: '60px', height: '45px', backgroundColor: hex, border: '1px solid #555', borderRadius: '3px', marginBottom: '5px', alignSelf: 'flex-start' }} />

            {/* שדות RGB */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['r', 'g', 'b'].map(channel => (
                <div key={channel} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '15px', textTransform: 'uppercase', color: '#aaa' }}>{channel}:</span>
                  <input type="number" value={rgb[channel]} onChange={(e) => handleRgbChange({ ...rgb, [channel]: e.target.value })} style={{ width: '50px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', padding: '3px', borderRadius: '2px', fontSize: '11px', outline: 'none' }} />
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '5px 0' }} />

            {/* שדות CMYK */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['c', 'm', 'y', 'k'].map(channel => (
                <div key={channel} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '45%' }}>
                  <span style={{ width: '12px', textTransform: 'uppercase', color: '#aaa' }}>{channel}:</span>
                  <input type="number" value={cmyk[channel]} onChange={(e) => handleCmykChange({ ...cmyk, [channel]: e.target.value })} style={{ width: '40px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', padding: '3px', borderRadius: '2px', fontSize: '11px', outline: 'none' }} />
                  <span style={{ color: '#666' }}>%</span>
                </div>
              ))}
            </div>

            {/* שדה HEX */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
              <span style={{ color: '#aaa' }}>#</span>
              <input type="text" value={hex.replace('#', '')} onChange={(e) => setHex('#' + e.target.value)} style={{ width: '75px', backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', padding: '4px', borderRadius: '2px', fontSize: '11px', outline: 'none', fontFamily: 'monospace' }} />
            </div>
          </div>

          {/* 4. כפתורי שליטה (אישור / ביטול סגנון אדובי) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={() => onConfirm(hex)} className="menu-item" style={{ width: '85px', padding: '6px', backgroundColor: '#444', border: '1px solid #666', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>OK</button>
            <button onClick={onCancel} className="menu-item" style={{ width: '85px', padding: '6px', backgroundColor: '#444', border: '1px solid #666', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Cancel</button>
          </div>

        </div>
      </div>
    </div>
  );
}