import React, { useEffect, useState, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TabBar from './components/TabBar';
import TaskSidebar from './components/TaskSidebar';
import DeleteModal from './components/DeleteModal';
import AdvancedColorPicker from './components/AdvancedColorPicker';

const closeWindow = () => window.close();

function MainLayout() {
  const { 
    activeTabId, tabs, boards, activeBoardId, groups, setGroups, memos, setMemos, 
    toggleGroupCollapse, setOpenColorPickerId, openColorPickerId, 
    updateGroupColor, updateGroupName, updateColumnName, addItem, updateItemName, updateItemValue, addGroup, activeMenu, 
    setActiveMenu, moveGroup, setDeleteTarget, updateWorkspaceColor, 
    advancedPickerTarget, setAdvancedPickerTarget, saveToFile, loadFromFile, openTab
  } = useApp();

  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [draggedGroupId, setDraggedGroupId] = useState(null);
  const [canDragGroupId, setCanDragGroupId] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // ארכיטקטורת עמודות דינמית
  const [visibleColumns, setVisibleColumns] = useState([
    { id: 'col-0', type: 'item' },
    { id: 'col-1', type: 'status' },
    { id: 'col-2', type: 'text' },
    { id: 'col-3', type: 'number' },
    { id: 'col-4', type: 'date' },
    { id: 'col-5', type: 'time' },
    { id: 'col-6', type: 'formula' }
  ]);
  
  const [activeColumnMenu, setActiveColumnMenu] = useState(null); 
  const [isChangeTypeOpen, setIsChangeTypeOpen] = useState(false); 
  const [columnToDelete, setColumnToDelete] = useState(null); 
  const [columnMenuCoords, setColumnMenuCoords] = useState({ top: 0, left: 0 });

  const [draggedColId, setDraggedColId] = useState(null);
  const [isAddColMenuOpen, setIsAddColMenuOpen] = useState(false);
  const [addColMenuCoords, setAddColMenuCoords] = useState({ top: 0, left: 0 });

  const [activeTimePicker, setActiveTimePicker] = useState(null); 
  const [timeInput, setTimeInput] = useState({ hours: '0', minutes: '0', seconds: '0' });

  const [formulaModalColId, setFormulaModalColId] = useState(null);
  const [formulaInputValue, setFormulaInputValue] = useState('');
  
  const [renameModalColId, setRenameModalColId] = useState(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  // --- סטייטים חדשים לניהול דינמי ואינטראקטיבי של הסטטוסים ---
  const [statusOptions, setStatusOptions] = useState({
    high: { label: 'גבוה', color: '#ef4444' },    
    medium: { label: 'בינוני', color: '#f59e0b' }, 
    low: { label: 'נמוך', color: '#10b981' }      
  });
  const [activeStatusDropdown, setActiveStatusDropdown] = useState(null); // { groupId, itemId, colId, coords }
  const [isStatusEditModalOpen, setIsStatusEditModalOpen] = useState(false);

  const [columnFormulas, setColumnFormulas] = useState({
    'col-6': '[מספר] * [זמן]' 
  });

  const [colWidths, setColWidths] = useState({
    'col-0': 220,
    'col-1': 130,
    'col-2': 150,
    'col-3': 110,
    'col-4': 140,
    'col-5': 140,
    'col-6': 130
  });

  const resizingRef = useRef(null);

  const currentTab = tabs.find(tab => tab.id === activeTabId);
  const boardIdToRender = currentTab?.activeBoardId || activeBoardId;
  const currentBoard = boards.find(b => b.id === boardIdToRender);
  
  const columns = currentBoard?.columns || { 
    item: 'ITEM', status: 'סטטוס', text: 'טקסט', number: 'מספר',
    date: 'ציר זמן', time: 'זמן', formula: 'נוסחה'
  };

  const extraFixedColumnsWidth = 40 + 8;
  const totalTableWidth = visibleColumns.reduce((sum, col) => sum + (colWidths[col.id] || 0), 0) + extraFixedColumnsWidth + 40;

  useEffect(() => {
    const styleId = 'june-app-styles';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      .menu-item:hover { background-color: #1e293b !important; color: #38bdf8 !important; }
      .menu-item-delete:hover { background-color: #7f1d1d !important; color: #fca5a5 !important; }
      .file-dropdown-item:hover { background-color: #334155 !important; color: #fff !important; }
      
      table { table-layout: fixed; border-collapse: separate; border-spacing: 0; }
      td { overflow: hidden; white-space: nowrap; }
      th { overflow: visible !important; white-space: nowrap; }
      
      .no-drag { -webkit-app-region: no-drag; }
      .win-btn:hover { background-color: #334155 !important; }
      .win-close-btn:hover { background-color: #ef4444 !important; color: white !important; }
      select option { background-color: #1e293b; color: #f8fafc; }
      
      .task-row:hover { background-color: #243146 !important; }
      .task-row:hover input { background-color: #2d3d52 !important; }
      
      .monday-checkbox {
        width: 15px !important;
        height: 15px !important;
        accent-color: #38bdf8 !important;
        cursor: pointer !important;
        opacity: 1 !important;
        display: inline-block !important;
      }
      
      .banner-action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 11px;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 6px;
        transition: all 0.15s;
      }
      .banner-action-btn:hover { background-color: #334155; color: #f8fafc; }
      
      .resizer-element {
        position: absolute;
        left: -4px;
        top: 0;
        bottom: 0;
        width: 8px;
        cursor: col-resize;
        user-select: none;
        z-index: 30;
        background-color: transparent;
        transition: background-color 0.1s;
      }
      .resizer-element:hover { background-color: #38bdf8 !important; }
      
      .table-scroll::-webkit-scrollbar { height: 8px; display: block !important; }
      .table-scroll::-webkit-scrollbar-track { background: #151f32; border-radius: 4px; }
      .table-scroll::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      .table-scroll::-webkit-scrollbar-thumb:hover { background: #38bdf8; }
      
      .add-column-header-btn {
        background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 4px;
        width: 28px; height: 28px; cursor: pointer; font-size: 16px; font-weight: bold;
        display: flex; align-items: center; justify: center; transition: all 0.15s;
      }
      .add-column-header-btn:hover { background-color: #334155; color: #ffffff; }

      .variable-injector-btn {
        background-color: #334155; color: #cbd5e1; border: 1px solid #475569; border-radius: 4px;
        padding: 4px 10px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.1s;
      }
      .variable-injector-btn:hover { background-color: #38bdf8; color: #0f172a; }
    `;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingRef.current) return;
      const { colKey, startX, startWidth } = resizingRef.current;
      const deltaX = startX - e.clientX; 
      const newWidth = Math.max(40, startWidth + deltaX); 
      setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };
    const handleMouseUp = () => { resizingRef.current = null; document.body.style.cursor = 'default'; };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  useEffect(() => {
    function handleGlobalClick(event) {
      if (!event.target.closest('.menu-container') && !event.target.closest('.picker-container') && !event.target.closest('.global-floating-menu')) {
        setActiveMenu(null); setOpenColorPickerId(null); setActiveColumnMenu(null); setIsChangeTypeOpen(false); setIsAddColMenuOpen(false);
        setActiveStatusDropdown(null); // סגירה אוטומטית של תפריט הסטטוס בלחיצה בחוץ
      }
    }
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [setActiveMenu, setOpenColorPickerId]);

  const startResize = (e, colId) => {
    e.preventDefault(); e.stopPropagation();
    resizingRef.current = { colKey: colId, startX: e.clientX, startWidth: colWidths[colId] };
    document.body.style.cursor = 'col-resize';
  };

  const moveColumn = (colId, direction) => {
    const idx = visibleColumns.findIndex(c => c.id === colId);
    if (idx === -1) return;
    let newIdx = direction === 'left' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= visibleColumns.length) return; 
    const updated = [...visibleColumns];
    const [moved] = updated.splice(idx, 1);
    updated.splice(newIdx, 0, moved);
    setVisibleColumns(updated);
  };

  const changeColumnType = (colId, newType) => {
    const updated = visibleColumns.map(c => c.id === colId ? { ...c, type: newType } : c);
    setVisibleColumns(updated);
  };

  const handleAddNewColumn = (typeKey) => {
    const newId = `col-${Date.now()}`;
    setVisibleColumns([...visibleColumns, { id: newId, type: typeKey }]);
    setColWidths(prev => ({ ...prev, [newId]: 140 })); 
    setIsAddColMenuOpen(false);
  };

  const handleColDrop = (e, targetColId) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetColId) return;
    const srcIdx = visibleColumns.findIndex(c => c.id === draggedColId);
    const tgtIdx = visibleColumns.findIndex(c => c.id === targetColId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const updated = [...visibleColumns];
    const [removed] = updated.splice(srcIdx, 1);
    updated.splice(tgtIdx, 0, removed);
    setVisibleColumns(updated);
    setDraggedColId(null);
  };

  const evaluateFormulaValue = (formulaStr, item) => {
    if (!formulaStr) return "0.00";
    let expression = formulaStr;

    visibleColumns.forEach(c => {
      const colTitle = columns[c.id] || columns[c.type] || c.type.toUpperCase();
      const placeholder = `[${colTitle}]`;
      
      if (expression.includes(placeholder)) {
        let numericVal = 0;
        const cellData = item[c.id];

        if (c.type === 'number') {
          numericVal = parseFloat(cellData) || 0;
        } else if (c.type === 'time') {
          const t = cellData || { hours: 0, minutes: 0, seconds: 0 };
          numericVal = (parseFloat(t.hours) || 0) + ((parseFloat(t.minutes) || 0) / 60) + ((parseFloat(t.seconds) || 0) / 3600);
        }
        expression = expression.replaceAll(placeholder, numericVal);
      }
    });

    try {
      const sanitizedExpression = expression.replace(/[^0-9.+\-*/() ]/g, '');
      const evalResult = Function(`"use strict"; return (${sanitizedExpression})`)();
      return typeof evalResult === 'number' && !isNaN(evalResult) ? evalResult.toFixed(2) : "0.00";
    } catch (err) {
      return "נוסחה שגויה";
    }
  };

  const openTimePickerModal = (e, groupId, itemId, colId, currentVal) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTimePicker({ groupId, itemId, colId, coords: { top: rect.bottom + 4, left: rect.left } });
    setTimeInput(currentVal || { hours: '0', minutes: '0', seconds: '0' });
  };

  const saveTimePickerValue = () => {
    if (!activeTimePicker) return;
    const { groupId, itemId, colId } = activeTimePicker;
    updateItemValue(groupId, itemId, colId, timeInput);
    setActiveTimePicker(null);
  };

  const handleGroupDragStart = (e, id) => { setDraggedGroupId(id); };
  const handleGroupDrop = (e, targetGroupId) => {
    e.preventDefault();
    if (!draggedGroupId || draggedGroupId === targetGroupId) return;
    const startIndex = groups.findIndex(g => g.id === draggedGroupId);
    const targetIndex = groups.findIndex(g => g.id === targetGroupId);
    if (startIndex === -1 || targetIndex === -1) return;
    const updated = [...groups]; const [removed] = updated.splice(startIndex, 1);
    updated.splice(targetIndex, 0, removed); setGroups(updated);
    setDraggedGroupId(null); setCanDragGroupId(null);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItemIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const deleteSelectedItems = () => {
    const updatedGroups = groups.map(group => ({ ...group, items: group.items.filter(item => !selectedItemIds.includes(item.id)) }));
    setGroups(updatedGroups); setSelectedItemIds([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', direction: 'rtl', overflow: 'hidden', position: 'relative', border: '1px solid #1e293b', boxSizing: 'border-box' }}>
      
      {/* סרגל עליון */}
      <div style={{ height: '35px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', padding: '0', fontSize: '13px', zIndex: 110, userSelect: 'none', windowAppRegion: 'drag', WebkitAppRegion: 'drag' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingRight: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#38bdf8', padding: '0 5px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚛</span><span style={{ fontSize: '11px', letterSpacing: '0.5px' }}>JUNE</span>
          </div>
          <div className="file-menu-container no-drag" style={{ position: 'relative' }}>
            <span onClick={() => !isFileMenuOpen && setIsFileMenuOpen(true)} style={{ cursor: 'pointer', color: isFileMenuOpen ? '#38bdf8' : '#cbd5e1', fontWeight: 'bold', padding: '5px 10px', display: 'inline-block' }}>File</span>
            {isFileMenuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '28px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '5px 0', minWidth: '150px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', zIndex: 120 }}>
                <div onClick={() => { openTab('tasks', `ניהול משימות ${tabs.filter(t => t.type === 'tasks').length + 1}`); setIsFileMenuOpen(false); }} className="file-dropdown-item" style={{ padding: '8px 15px', cursor: 'pointer', color: '#38bdf8', fontWeight: 'bold', textAlign: 'right', borderBottom: '1px solid #233142' }}>＋ טאב משימות חדש</div>
                <div onClick={() => { saveToFile(); setIsFileMenuOpen(false); }} className="file-dropdown-item" style={{ padding: '8px 15px', cursor: 'pointer', color: '#cbd5e1', textAlign: 'right' }}>שמור גיבוי (Save)</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', direction: 'ltr' }} className="no-drag">
          <div onClick={closeWindow} className="win-close-btn" style={{ width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', transition: 'background-color 0.1s', fontSize: '14px', height: '100%' }}>✕</div>
        </div>
      </div>

      <TabBar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <TaskSidebar />
        <div style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* שורת חיפוש ובקרה */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 30px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <input type="text" placeholder="חפש בלוח..." style={{ width: '100%', padding: '8px 12px 8px 35px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', color: '#f8fafc', fontSize: '13px', outline: 'none', textAlign: 'right' }} />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>🔍</span>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>🔔</button>
          </div>

          {/* לוחות וקבוצות */}
          <div className="overflow-y-auto" style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px', overflowX: 'hidden', width: '100%', boxSizing: 'border-box', paddingBottom: selectedItemIds.length > 0 ? '90px' : '30px' }}>
            {boardIdToRender && (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>{currentBoard?.name}</h2>

                {groups.filter(g => g.boardId === boardIdToRender).map(group => {
                  const groupItemIds = group.items.map(item => item.id);
                  const isAllGroupSelected = groupItemIds.length > 0 && groupItemIds.every(id => selectedItemIds.includes(id));
                  
                  const toggleGroupSelection = () => {
                    if (isAllGroupSelected) setSelectedItemIds(prev => prev.filter(id => !groupItemIds.includes(id)));
                    else setSelectedItemIds(prev => [...new Set([...prev, ...groupItemIds])]);
                  };

                  return (
                    <div 
                      key={group.id} 
                      draggable={canDragGroupId === group.id}
                      onDragStart={(e) => handleGroupDragStart(e, group.id)}
                      onDragEnd={() => setCanDragGroupId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleGroupDrop(e, group.id)}
                      style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '18px', position: 'relative', width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: group.isCollapsed ? '0' : '18px' }}>
                        <span onMouseDown={() => setCanDragGroupId(group.id)} onMouseUp={() => setCanDragGroupId(null)} style={{ color: '#475569', cursor: 'grab', fontSize: '15px', userSelect: 'none' }}>☰</span>
                        <button onClick={() => toggleGroupCollapse(group.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', transform: group.isCollapsed ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</button>
                        <input value={group.name} onChange={(e) => updateGroupName(group.id, e.target.value)} style={{ backgroundColor: 'transparent', color: group.color, border: 'none', fontSize: '18px', fontWeight: 'bold', outline: 'none', width: '250px' }} />
                      </div>

                      {!group.isCollapsed && (
                        <div className="table-scroll" style={{ display: 'block', overflowX: 'scroll', width: '100%', maxWidth: '100%', borderRadius: '6px', border: '1px solid #334155' }}>
                          <table style={{ tableLayout: 'fixed', width: `${totalTableWidth}px`, borderCollapse: 'separate', borderSpacing: 0, textAlign: 'right', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ color: '#94a3b8', backgroundColor: '#131f32', height: '38px' }}>
                                
                                <th style={{ width: '40px', textAlign: 'center', borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                                  <input type="checkbox" className="monday-checkbox" checked={isAllGroupSelected} onChange={toggleGroupSelection} />
                                </th>
                                <th style={{ width: '8px', borderBottom: '1px solid #334155', padding: 0 }} />

                                {visibleColumns.map((col) => (
                                  <th 
                                    key={col.id} draggable={true}
                                    onDragStart={(e) => setDraggedColId(col.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleColDrop(e, col.id)}
                                    style={{ 
                                      padding: '0 4px', 
                                      width: `${colWidths[col.id]}px`, 
                                      position: 'relative', 
                                      borderBottom: '1px solid #334155', 
                                      verticalAlign: 'middle', 
                                      zIndex: activeColumnMenu === col.id ? 100 : 10, 
                                      cursor: 'move' 
                                    }}
                                  >
                                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                                      <input 
                                        dir="rtl" 
                                        value={columns[col.id] || columns[col.type] || col.type.toUpperCase()} 
                                        onChange={(e) => updateColumnName(boardIdToRender, col.id, e.target.value)} 
                                        style={{ 
                                          background: 'transparent', 
                                          border: 'none', 
                                          color: '#94a3b8', 
                                          fontWeight: 'bold', 
                                          outline: 'none', 
                                          fontSize: '12px', 
                                          width: '100%', 
                                          paddingRight: '8px', 
                                          paddingLeft: '24px', 
                                          boxSizing: 'border-box',
                                          cursor: 'text' 
                                        }} 
                                        onMouseDown={(e) => e.stopPropagation()} 
                                      />
                                      
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          setActiveColumnMenu(activeColumnMenu === col.id ? null : col.id);
                                          setColumnMenuCoords({ top: rect.bottom + 4, left: rect.right - 160 });
                                          setIsChangeTypeOpen(false);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        style={{
                                          position: 'absolute', left: '2px', top: '50%', transform: 'translateY(-50%)',
                                          background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                                          fontSize: '14px', padding: '0 4px', outline: 'none', zIndex: 5
                                        }}
                                      >
                                        ⋮
                                      </button>
                                    </div>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', backgroundColor: '#334155' }} />
                                    <div className="resizer-element" onMouseDown={(e) => startResize(e, col.id)} />
                                  </th>
                                ))}

                                <th style={{ width: '40px', borderBottom: '1px solid #334155', verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#131f32', padding: '0 6px' }}>
                                  <button className="add-column-header-btn" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setAddColMenuCoords({ top: rect.bottom + 4, left: rect.left }); setIsAddColMenuOpen(!isAddColMenuOpen); }}>＋</button>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map(item => {
                                const isItemSelected = selectedItemIds.includes(item.id);
                                return (
                                  <tr key={item.id} className="task-row" style={{ color: '#cbd5e1', height: '36px' }}>
                                    <td style={{ width: '40px', textAlign: 'center', borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                                      <input type="checkbox" className="monday-checkbox" checked={isItemSelected} onChange={() => toggleItemSelection(item.id)} />
                                    </td>
                                    <td style={{ width: '8px', backgroundColor: group.color, borderBottom: '1px solid #334155' }} />

                                    {visibleColumns.map((col) => {
                                      const currentVal = item[col.id];
                                      
                                      if (col.type === 'item') {
                                        return (
                                          <td key={col.id} style={{ padding: '0 12px', width: `${colWidths[col.id]}px`, borderLeft: '1px solid #334155', borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                                            <input value={item.name} onChange={(e) => updateItemName(group.id, item.id, e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '13px', width: '100%' }} />
                                          </td>
                                        );
                                      }
                                      // 🟩 שדרוג אקטיבי לעמודת סטטוס מותאמת אישית ללא select נייטיבי
                                      if (col.type === 'status') {
                                        const activeOpt = statusOptions[currentVal] || { label: '-', color: '#334155' };
                                        return (
                                          <td 
                                            key={col.id} 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              setActiveStatusDropdown({
                                                groupId: group.id, itemId: item.id, colId: col.id,
                                                coords: { top: rect.bottom + 4, left: rect.left }
                                              });
                                            }}
                                            style={{ padding: 0, width: `${colWidths[col.id]}px`, borderLeft: '1px solid #334155', borderBottom: '1px solid #334155', verticalAlign: 'stretch', cursor: 'pointer' }}
                                          >
                                            <div style={{ width: '100%', height: '36px', backgroundColor: activeOpt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', userSelect: 'none' }}>
                                              {activeOpt.label}
                                            </div>
                                          </td>
                                        );
                                      }
                                      if (col.type === 'text') {
                                        return (
                                          <td key={col.id} style={{ padding: '0 12px', width: `${colWidths[col.id]}px`, borderLeft: '1px solid #334155', borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                                            <input value={currentVal || ''} onChange={(e) => updateItemValue(group.id, item.id, col.id, e.target.value)} placeholder="הקלד טקסט..." style={{ backgroundColor: 'transparent', border: 'none', color: '#cbd5e1', outline: 'none', width: '100%' }} />
                                          </td>
                                        );
                                      }
                                      if (col.type === 'number') {
                                        return (
                                          <td key={col.id} style={{ padding: '0 12px', width: `${colWidths[col.id]}px`, borderLeft: '1px solid #334155', borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                                            <input type="text" value={currentVal || ''} placeholder="0.00" onChange={(e) => { const val = e.target.value; if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) updateItemValue(group.id, item.id, col.id, val); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#38bdf8', outline: 'none', width: '100%', textAlign: 'left', fontFamily: 'monospace' }} />
                                          </td>
                                        );
                                      }
                                      if (col.type === 'date') {
                                        return (
                                          <td key={col.id} style={{ padding: '0 12px', width: `${colWidths[col.id]}px`, borderLeft: '1px solid #334155', borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                                            <input type="date" value={currentVal || ''} onChange={(e) => updateItemValue(group.id, item.id, col.id, e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', color: '#cbd5e1', outline: 'none', fontSize: '13px', width: '100%', cursor: 'pointer' }} />
                                          </td>
                                        );
                                      }
                                      if (col.type === 'time') {
                                        const t = currentVal || { hours: '0', minutes: '0', seconds: '0' };
                                        return (
                                          <td key={col.id} onClick={(e) => openTimePickerModal(e, group.id, item.id, col.id, currentVal)} style={{ padding: '0 12px', width: `${colWidths[col.id]}px`, borderLeft: '1px solid #334155', borderBottom: '1px solid #334155', verticalAlign: 'middle', cursor: 'pointer', color: '#a7f3d0', fontFamily: 'monospace' }}>
                                            {currentVal ? `${t.hours}h ${t.minutes}m ${t.seconds}s` : '00:00:00'}
                                          </td>
                                        );
                                      }
                                      if (col.type === 'formula') {
                                        const currentFormula = columnFormulas[col.id];
                                        const result = evaluateFormulaValue(currentFormula, item);
                                        return (
                                          <td key={col.id} style={{ padding: '0 12px', width: `${colWidths[col.id]}px`, borderLeft: '1px solid #334155', borderBottom: '1px solid #334155', verticalAlign: 'middle', backgroundColor: '#020617', color: '#facc15', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' }}>
                                            {result}
                                          </td>
                                        );
                                      }
                                      return null;
                                    })}

                                    <td style={{ width: '40px', borderBottom: '1px solid #334155' }} />
                                  </tr>
                                );
                              })}
                              
                              <tr style={{ backgroundColor: '#131f32' }}>
                                <td style={{ borderBottom: '1px solid #334155' }} /><td style={{ borderBottom: '1px solid #334155' }} />
                                <td colSpan={visibleColumns.length + 1} style={{ padding: '0 12px', height: '36px', verticalAlign: 'middle', borderBottom: '1px solid #334155' }}>
                                  <input type="text" placeholder="＋ הוסף משימה חדשה..." onKeyDown={(e) => { if (e.key === 'Enter') { addItem(group.id, e.target.value); e.target.value = ''; } }} style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', outline: 'none' }} />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={addGroup} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>＋ הוסף קבוצה חדשה</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* באנר פעולות תחתון צף */}
      {selectedItemIds.length > 0 && (
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '24px', zIndex: 200, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', direction: 'ltr' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{selectedItemIds.length}</div>
            <span style={{ color: '#f8fafc', fontSize: '14px' }}>משימות selected</span>
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: '#334155' }} />
          <button className="banner-action-btn" style={{ color: '#ef4444' }} onClick={() => deleteSelectedItems()}><span>🗑️</span><span>Delete</span></button>
          <button onClick={() => setSelectedItemIds([])} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Global Floating Menu להגדרות עמודה */}
      {activeColumnMenu && (() => {
        const targetCol = visibleColumns.find(c => c.id === activeColumnMenu);
        if (!targetCol) return null;
        return (
          <div className="global-floating-menu" style={{ position: 'fixed', top: `${columnMenuCoords.top}px`, left: `${columnMenuCoords.left}px`, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '6px 0', zIndex: 500, display: 'flex', flexDirection: 'column', minWidth: '160px', boxShadow: '0 10px 25px -3px rgba(0,0,0,0.6)', direction: 'rtl', textAlign: 'right' }}>
            <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', width: '100%' }} onClick={() => {
              setRenameModalColId(targetCol.id);
              setRenameInputValue(columns[targetCol.id] || columns[targetCol.type] || '');
              setActiveColumnMenu(null);
            }}>✏️ עריכת שם</button>
            
            {targetCol.type === 'formula' && (
              <button className="menu-item" style={{ background: 'none', border: 'none', color: '#facc15', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} onClick={() => {
                setFormulaModalColId(targetCol.id);
                setFormulaInputValue(columnFormulas[targetCol.id] || '');
                setActiveColumnMenu(null);
              }}>✏️ הגדרת נוסחה (Formula)</button>
            )}

            <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => { moveColumn(targetCol.id, 'left'); setActiveColumnMenu(null); }}>⬅️ הזז עמודה שמאלה</button>
            <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => { moveColumn(targetCol.id, 'right'); setActiveColumnMenu(null); }}>➡️ הזז עמודה ימינה</button>
            
            <div style={{ position: 'relative' }}>
              <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); setIsChangeTypeOpen(!isChangeTypeOpen); }}>
                <span>🛠️ שינוי סוג עמודה</span><span>◀</span>
              </button>
              {isChangeTypeOpen && (
                <div style={{ position: 'absolute', right: '158px', top: '0', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', padding: '4px 0', minWidth: '130px', display: 'flex', flexDirection: 'column', zIndex: 510 }}>
                  {['item', 'status', 'text', 'number', 'date', 'time', 'formula'].filter(k => k !== targetCol.type).map(typeKey => (
                    <button key={typeKey} className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '6px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => { changeColumnType(targetCol.id, typeKey); setActiveColumnMenu(null); setIsChangeTypeOpen(false); }}>
                      {typeKey === 'item' ? 'ITEM' : typeKey === 'status' ? 'סטטוס' : typeKey === 'text' ? 'טקסט' : typeKey === 'number' ? 'מספר' : typeKey === 'date' ? 'ציר זמן' : typeKey === 'time' ? 'זמן' : 'נוסחה'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="menu-item-delete" style={{ background: 'none', border: 'none', color: '#ef4444', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px', borderTop: '1px solid #334155' }} onClick={() => { setVisibleColumns(prev => prev.filter(c => c.id !== targetCol.id)); setActiveColumnMenu(null); }}>🗑️ מחק עמודה</button>
          </div>
        );
      })()}

      {/* Global Floating Menu להוספת עמודה חדשה */}
      {isAddColMenuOpen && (
        <div className="global-floating-menu" style={{ position: 'fixed', top: `${addColMenuCoords.top}px`, left: `${addColMenuCoords.left}px`, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '6px 0', zIndex: 500, display: 'flex', flexDirection: 'column', minWidth: '150px', boxShadow: '0 10px 25px -3px rgba(0,0,0,0.6)', direction: 'rtl', textAlign: 'right' }}>
          <div style={{ padding: '6px 12px', fontSize: '11px', color: '#64748b', fontWeight: 'bold', borderBottom: '1px solid #233142' }}>בחר סוג עמודה:</div>
          <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleAddNewColumn('status')}>🟩 עמודת סטטוס</button>
          <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleAddNewColumn('text')}>✍️ עמודת טקסט</button>
          <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleAddNewColumn('number')}>🔢 עמודת מספר</button>
          <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleAddNewColumn('date')}>📅 עמודת ציר זמן</button>
          <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleAddNewColumn('time')}>⏰ עמודת זמן</button>
          <button className="menu-item" style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 12px', textAlign: 'right', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleAddNewColumn('formula')}>🧮 עמודת נוסחה</button>
        </div>
      )}

      {/* פופ-אפ הזנת זמן */}
      {activeTimePicker && (
        <div className="global-floating-menu" style={{ position: 'fixed', top: `${activeTimePicker.coords.top}px`, left: `${activeTimePicker.coords.left}px`, backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '15px', zIndex: 550, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', gap: '10px', direction: 'rtl' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>שעות</span>
            <input type="text" value={timeInput.hours} onChange={(e) => setTimeInput({ ...timeInput, hours: e.target.value })} style={{ width: '45px', height: '28px', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #334155', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>דקות</span>
            <input type="text" value={timeInput.minutes} onChange={(e) => setTimeInput({ ...timeInput, minutes: e.target.value })} style={{ width: '45px', height: '28px', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #334155', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>שניות</span>
            <input type="text" value={timeInput.seconds} onChange={(e) => setTimeInput({ ...timeInput, seconds: e.target.value })} style={{ width: '45px', height: '28px', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #334155', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }} />
          </div>
          <button onClick={saveTimePickerValue} style={{ alignSelf: 'flex-end', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '4px', height: '28px', padding: '0 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>שמור</button>
        </div>
      )}

      {/* 👑 תפריט בחירת אופציית סטטוס צף גלובלי צמוד לעמודה */}
      {activeStatusDropdown && (
        <div 
          className="global-floating-menu" 
          style={{ 
            position: 'fixed', top: `${activeStatusDropdown.coords.top}px`, left: `${activeStatusDropdown.coords.left}px`, 
            width: `${colWidths[activeStatusDropdown.colId]}px`, backgroundColor: '#1e293b', border: '1px solid #334155', 
            borderRadius: '6px', padding: '6px', zIndex: 550, display: 'flex', flexDirection: 'column', gap: '5px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
          }}
        >
          {/* אופציית ברירת מחדל ריקה (-) */}
          <div 
            onClick={() => { updateItemValue(activeStatusDropdown.groupId, activeStatusDropdown.itemId, activeStatusDropdown.colId, ''); setActiveStatusDropdown(null); }}
            style={{ padding: '8px', backgroundColor: '#334155', borderRadius: '4px', color: '#ffffff', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
          >
            -
          </div>
          {/* רינדור אופציות דינמי מהסטייט */}
          {Object.entries(statusOptions).map(([key, opt]) => (
            <div 
              key={key}
              onClick={() => { updateItemValue(activeStatusDropdown.groupId, activeStatusDropdown.itemId, activeStatusDropdown.colId, key); setActiveStatusDropdown(null); }}
              style={{ padding: '8px', backgroundColor: opt.color, borderRadius: '4px', color: '#ffffff', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', transition: 'opacity 0.1s' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.85'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {opt.label}
            </div>
          ))}
          {/* ✏️ כפתור פתיחת מודאל עריכת הסטטוסים האינטראקטיבי */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsStatusEditModalOpen(true); setActiveStatusDropdown(null); }}
            style={{ marginTop: '4px', borderTop: '1px solid #334155', paddingTop: '8px', paddingBottom: '2px', backgroundColor: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', width: '100%', outline: 'none' }}
          >
            ⚙️ עריכת סטטוסים
          </button>
        </div>
      )}

      {/* 🛠️ מודאל ניהול ועריכת אופציות סטטוס (Status Management & Editing Modal) */}
      {isStatusEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 600 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '24px', width: '420px', direction: 'rtl', textAlign: 'right', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '16px' }}>ניהול ועריכת סטטוסים 🟩</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {Object.entries(statusOptions).map(([key, opt]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* דוגם צבע דינמי לכל אופציה */}
                  <input 
                    type="color" 
                    value={opt.color} 
                    onChange={(e) => {
                      setStatusOptions(prev => ({ ...prev, [key]: { ...prev[key], color: e.target.value } }));
                    }}
                    style={{ width: '34px', height: '34px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
                  />
                  {/* קלט שם האופציה */}
                  <input 
                    type="text" 
                    value={opt.label} 
                    onChange={(e) => {
                      setStatusOptions(prev => ({ ...prev, [key]: { ...prev[key], label: e.target.value } }));
                    }}
                    style={{ flex: 1, height: '34px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', padding: '0 10px', fontSize: '13px', outline: 'none' }}
                  />
                  {/* לחצן מחיקת אופציה מהמילון */}
                  <button 
                    onClick={() => {
                      setStatusOptions(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                    title="מחק אופציה"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* לחצן הוספת שורה חדשה */}
            <button 
              onClick={() => {
                const newKey = `status_${Date.now()}`;
                setStatusOptions(prev => ({ ...prev, [newKey]: { label: 'סטטוס חדש', color: '#64748b' } }));
              }}
              style={{ width: '100%', backgroundColor: '#334155', color: '#38bdf8', border: '1px solid #475569', borderRadius: '6px', height: '34px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', marginBottom: '24px', transition: 'background-color 0.1s' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#243146'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#334155'}
            >
              ＋ הוסף אופציית סטטוס חדשה
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsStatusEditModalOpen(false)} style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '8px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>סיום וסגירה</button>
            </div>
          </div>
        </div>
      )}

      {/* מודאל עריכת נוסחה מתקדם */}
      {formulaModalColId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 600 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '24px', width: '460px', direction: 'rtl', textAlign: 'right', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '12px' }}>הגדרת נוסחה מתמטית 🧮</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '15px' }}>הקש את הביטוי החשבוני שלך או לחץ על כפתורי העמודות למטה כדי להזריק משתנים:</p>
            
            <input 
              type="text" 
              value={formulaInputValue} 
              onChange={(e) => setFormulaInputValue(e.target.value)} 
              placeholder="לדוגמה: [מספר] * [זמן]"
              style={{ width: '100%', height: '38px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', padding: '0 12px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', marginBottom: '12px' }}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {visibleColumns.map(c => {
                const colTitle = columns[c.id] || columns[c.type] || c.type.toUpperCase();
                if (c.type === 'number' || c.type === 'time') {
                  return (
                    <button key={c.id} className="variable-injector-btn" onClick={() => setFormulaInputValue(prev => prev + `[${colTitle}]`)}>
                      ＋ {colTitle}
                    </button>
                  );
                }
                return null;
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setColumnFormulas({ ...columnFormulas, [formulaModalColId]: formulaInputValue }); setFormulaModalColId(null); }} style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>שמור נוסחה</button>
              <button onClick={() => setFormulaModalColId(null)} style={{ backgroundColor: '#334155', color: '#cbd5e1', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* מודאל פנימי עבור עריכת שם עמודה */}
      {renameModalColId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 600 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '24px', width: '360px', direction: 'rtl', textAlign: 'right', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '12px' }}>עריכת שם עמודה ✏️</h3>
            
            <input 
              type="text" 
              value={renameInputValue} 
              onChange={(e) => setRenameInputValue(e.target.value)} 
              style={{ width: '100%', height: '36px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', padding: '0 12px', fontSize: '14px', outline: 'none', marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { if (renameInputValue.trim()) { updateColumnName(boardIdToRender, renameModalColId, renameInputValue); } setRenameModalColId(null); }} style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>עדכן שם</button>
              <button onClick={() => setRenameModalColId(null)} style={{ backgroundColor: '#334155', color: '#cbd5e1', padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}