import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TaskSidebar() {
  const { 
    workspaces, setWorkspaces, boards, setBoards, activeBoardId, setActiveBoardIdForCurrentTab, 
    activeMenu, setActiveMenu, openColorPickerId, setOpenColorPickerId, 
    setDeleteTarget, updateWorkspaceName, updateWorkspaceColor, 
    moveWorkspace, toggleWorkspaceCollapse, updateBoardName, moveBoard, addBoard, addWorkspace, defaultColors,
    setAdvancedPickerTarget
  } = useApp();

  const sidebarRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // משתני עזר מעקב לגרירה
  const [draggedWsId, setDraggedWsId] = useState(null);
  const [draggedBoardId, setDraggedBoardId] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (!event.target.closest('.menu-container') && !event.target.closest('.picker-container')) {
          setActiveMenu(null);
          setOpenColorPickerId(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setActiveMenu, setOpenColorPickerId]);

  // --- לוגיקת גרירת וורקספייסים ---
  const handleWsDragStart = (e, id) => {
    setDraggedWsId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleWsDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedWsId || draggedWsId === targetId) return;

    const startIndex = workspaces.findIndex(w => w.id === draggedWsId);
    const targetIndex = workspaces.findIndex(w => w.id === targetId);
    if (startIndex === -1 || targetIndex === -1) return;

    const updated = [...workspaces];
    const [removed] = updated.splice(startIndex, 1);
    updated.splice(targetIndex, 0, removed);
    setWorkspaces(updated);
    setDraggedWsId(null);
  };

  // --- לוגיקת גרירת לוחות ---
  const handleBoardDragStart = (e, id) => {
    e.stopPropagation();
    setDraggedBoardId(id);
  };

  const handleBoardDrop = (e, targetBoardId, targetWorkspaceId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // מקרה א': גרירת לוח מעל לוח אחר
    if (draggedBoardId) {
      if (draggedBoardId === targetBoardId) return;
      const srcBoard = boards.find(b => b.id === draggedBoardId);
      const tgtBoard = boards.find(b => b.id === targetBoardId);
      if (!srcBoard || !tgtBoard) return;

      // עדכון הוורקספייס של לוח המקור במידה והועבר וורקספייס
      const updatedBoards = boards.map(b => b.id === draggedBoardId ? { ...b, workspaceId: tgtBoard.workspaceId } : b);
      
      // סידור מחדש של המיקום ברשימה
      const startIndex = updatedBoards.findIndex(b => b.id === draggedBoardId);
      const targetIndex = updatedBoards.findIndex(b => b.id === targetBoardId);
      const [removed] = updatedBoards.splice(startIndex, 1);
      updatedBoards.splice(targetIndex, 0, removed);

      setBoards(updatedBoards);
      setDraggedBoardId(null);
    }
  };

  const handleDropOnWorkspaceHeader = (e, targetWorkspaceId) => {
    e.preventDefault();
    // מקרה ב': גרירת לוח ישירות אל כותרת הוורקספייס (העברת קבוצה לוורקספייס ריק או כללי)
    if (draggedBoardId) {
      setBoards(boards.map(b => b.id === draggedBoardId ? { ...b, workspaceId: targetWorkspaceId } : b));
      setDraggedBoardId(null);
    }
  };

  if (isCollapsed) {
    return (
      <div style={{ width: '20px', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 90 }}>
        <button onClick={() => setIsCollapsed(false)} style={{ position: 'absolute', right: '2px', top: '15px', background: '#334155', border: '1px solid #475569', color: '#38bdf8', borderRadius: '4px', cursor: 'pointer', padding: '5px 2px', fontSize: '10px', zIndex: 100 }}>◀</button>
      </div>
    );
  }

  return (
    <div ref={sidebarRef} style={{ width: '310px', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '20px 10px', overflowX: 'hidden', position: 'relative', flexShrink: 0 }}>
      
      <button onClick={() => setIsCollapsed(true)} style={{ position: 'absolute', left: '10px', top: '18px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }} title="הסתר סיידבר">▶</button>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '20px', paddingRight: '5px' }}>ניהול משימות</h3>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px', overflowY: 'auto', overflowX: 'hidden' }}>
        {workspaces.map(ws => (
          <div 
            key={ws.id} 
            draggable
            onDragStart={(e) => handleWsDragStart(e, ws.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleWsDrop(e, ws.id)}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', border: draggedWsId === ws.id ? '1px dashed #38bdf8' : '1px solid transparent', borderRadius: '6px', padding: '4px' }}
          >
            
            {/* שורת כותרת וורקספייס */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnWorkspaceHeader(e, ws.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 5px' }}
            >
              <button onClick={() => toggleWorkspaceCollapse(ws.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', padding: '0 2px', transform: ws.isCollapsed ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</button>

              <div className="picker-container" style={{ position: 'relative' }}>
                <div onClick={() => setOpenColorPickerId(openColorPickerId === ws.id ? null : ws.id)} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: ws.color, cursor: 'pointer', border: '1px solid #475569' }} />
                {openColorPickerId === ws.id && (
                  <div style={{ position: 'absolute', right: '0', top: '22px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '6px', zIndex: 50, width: '100px' }}>
                    {defaultColors.map(c => (
                      <div key={c} onClick={() => updateWorkspaceColor(ws.id, c)} style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer' }} />
                    ))}
                    <div onClick={() => { setAdvancedPickerTarget({ type: 'ws', id: ws.id, current: ws.color }); setOpenColorPickerId(null); }} style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px' }}>🎨</div>
                  </div>
                )}
              </div>

              {/* הוספת סמן גרירה ויזואלי להבנה נוחה */}
              <span style={{ color: '#475569', cursor: 'grab', fontSize: '12px', userSelect: 'none' }}>☰</span>

              <input value={ws.name} onChange={(e) => updateWorkspaceName(ws.id, e.target.value)} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: ws.color, fontSize: '14px', fontWeight: 'bold', outline: 'none', textAlign: 'right' }} />
              
              <div className="menu-container" style={{ position: 'relative' }}>
                <button onClick={() => setActiveMenu(activeMenu?.id === ws.id ? null : { type: 'ws', id: ws.id })} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}>⋮</button>
                {activeMenu?.type === 'ws' && activeMenu?.id === ws.id && (
                  <div style={{ position: 'absolute', left: '10px', top: '20px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '5px', zIndex: 40, display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
                    <button onClick={() => moveWorkspace(ws.id, 'up')} className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 10px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }}>הזז למעלה ↑</button>
                    <button onClick={() => moveWorkspace(ws.id, 'down')} className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 10px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }}>הזז למטה ↓</button>
                    <button onClick={() => setDeleteTarget({ type: 'ws', id: ws.id })} className="menu-item-delete" style={{ background: 'none', border: 'none', color: '#ef4444', padding: '8px 10px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', borderTop: '1px solid #334155', borderRadius: '4px' }}>מחק 🗑️</button>
                  </div>
                )}
              </div>
            </div>

            {/* רשימת הלוחות */}
            {!ws.isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '15px', minHeight: '30px' }}>
                {boards.filter(b => b.workspaceId === ws.id).map(board => (
                  <div 
                    key={board.id} 
                    draggable
                    onDragStart={(e) => handleBoardDragStart(e, board.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleBoardDrop(e, board.id, ws.id)}
                    onClick={() => setActiveBoardIdForCurrentTab(board.id)}
                    style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative', backgroundColor: activeBoardId === board.id ? '#0f172a' : 'transparent', borderRadius: '6px', padding: '2px 5px', cursor: 'pointer', border: draggedBoardId === board.id ? '1px dashed #38bdf8' : '1px solid transparent' }}
                  >
                    <span style={{ color: '#475569', fontSize: '10px', paddingLeft: '5px', cursor: 'grab' }}>⋮⋮</span>
                    <span style={{ flex: 1, padding: '6px 5px', color: activeBoardId === board.id ? '#38bdf8' : '#cbd5e1', fontSize: '14px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {board.name}
                    </span>
                    
                    <div className="menu-container" style={{ position: 'relative' }}>
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu?.id === board.id ? null : { type: 'board', id: board.id }); }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px', padding: '0 5px' }}>⋮</button>
                      {activeMenu?.type === 'board' && activeMenu?.id === board.id && (
                        <div style={{ position: 'absolute', left: '10px', top: '20px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '5px', zIndex: 40, display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
                          <button onClick={(e) => { e.stopPropagation(); moveBoard(board.id, 'up'); }} className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 10px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }}>הזז למעלה ↑</button>
                          <button onClick={(e) => { e.stopPropagation(); moveBoard(board.id, 'down'); }} className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 10px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }}>הזז למטה ↓</button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'board', id: board.id }); }} className="menu-item-delete" style={{ background: 'none', border: 'none', color: '#ef4444', padding: '8px 10px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', borderTop: '1px solid #334155', borderRadius: '4px' }}>מחק 🗑️</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={() => addBoard(ws.id)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', padding: '5px 10px' }}>＋ הוסף לוח</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={addWorkspace} style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>＋ WORKSPACE חדש</button>
    </div>
  );
}