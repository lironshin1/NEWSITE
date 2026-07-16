import React from 'react';
import { useApp } from '../context/AppContext';

export default function DeleteModal() {
  const { deleteTarget, setDeleteTarget, confirmDelete } = useApp();
  if (!deleteTarget) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '25px', width: '350px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
        <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#f8fafc' }}>אישור מחיקה</h4>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '25px' }}>
          האם אתה בטוח שברצונך למחוק את {deleteTarget.type === 'ws' ? 'אזור העבודה כולל כל הלוחות שבו' : 'הלוח הנבחר'}? פעולה זו אינה ניתנת לביטול.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button onClick={confirmDelete} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>כן, מחק</button>
          <button onClick={() => setDeleteTarget(null)} style={{ backgroundColor: '#475569', color: '#cbd5e1', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}