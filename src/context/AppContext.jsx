import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // ניהול טאבים והערות
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [memos, setMemos] = useState('');

  // דאטה מערכת המשימות הגלובלי
  const [workspaces, setWorkspaces] = useState([{ id: 'w1', name: 'MAIN WORKSPACE', color: '#64748b', isCollapsed: false }]);
  const [boards, setBoards] = useState([]);
  const [groups, setGroups] = useState([]);

  // תפריטים ומודאלים
  const [activeMenu, setActiveMenu] = useState(null); 
  const [openColorPickerId, setOpenColorPickerId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [advancedPickerTarget, setAdvancedPickerTarget] = useState(null); 

  const defaultColors = ['#64748b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // טעינה ראשונית אוטומטית מהמחשב (Auto Load) + מנגנון ניקוי נקודות מהזיכרון
  useEffect(() => {
    const savedData = localStorage.getItem('june_app_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.workspaces) setWorkspaces(parsed.workspaces);
        if (parsed.boards) {
          // מנקה באופן אקטיבי כל תו נקודה שעלול היה להישמר בשמות העמודות ב-LocalStorage
          const cleanedBoards = parsed.boards.map(b => {
            const cols = b.columns || { item: 'ITEM', status: 'סטטוס', text: 'טקסט', number: 'מספר' };
            return {
              ...b,
              columns: {
                item: String(cols.item || 'ITEM').replace(/\./g, '').trim(),
                status: String(cols.status || 'סטטוס').replace(/\./g, '').trim(),
                text: String(cols.text || 'טקסט').replace(/\./g, '').trim(),
                number: String(cols.number || 'מספר').replace(/\./g, '').trim(),
              }
            };
          });
          setBoards(cleanedBoards);
        }
        if (parsed.groups) setGroups(parsed.groups);
        if (parsed.memos) setMemos(parsed.memos);
        if (parsed.tabs) setTabs(parsed.tabs);
        if (parsed.activeTabId) setActiveTabId(parsed.activeTabId);
      } catch (e) {
        console.error("שגיאה בטעינת הנתונים האוטומטית", e);
      }
    }
  }, []);

  // שמירה אוטומטית ברקע בכל שינוי דאטה (Auto Save)
  useEffect(() => {
    const dataToSave = { workspaces, boards, groups, memos, tabs, activeTabId };
    localStorage.setItem('june_app_data', JSON.stringify(dataToSave));
  }, [workspaces, boards, groups, memos, tabs, activeTabId]);

  // פונקציות שמירה וטעינה ידניות (עבור תפריט File)
  const saveToFile = () => {
    const dataStr = JSON.stringify({ workspaces, boards, groups, memos, tabs, activeTabId }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `june_tasks_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.workspaces) setWorkspaces(parsed.workspaces);
        if (parsed.boards) setBoards(parsed.boards);
        if (parsed.groups) setGroups(parsed.groups);
        if (parsed.memos) setMemos(parsed.memos);
        if (parsed.tabs) setTabs(parsed.tabs);
        if (parsed.activeTabId) setActiveTabId(parsed.activeTabId);
        alert("הנתונים נטענו בהצלחה!");
      } catch (err) {
        alert("קובץ לא תקין.");
      }
    };
    reader.readAsText(file);
  };

  // פונקציות טאבים
  const openTab = (type, title) => {
    const newTabId = `${type}-${Date.now()}`;
    setTabs([...tabs, { id: newTabId, title, type, activeBoardId: null }]);
    setActiveTabId(newTabId);
    setIsMenuOpen(false);
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    const filteredTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(filteredTabs);
    if (activeTabId === tabId) {
      setActiveTabId(filteredTabs.length > 0 ? filteredTabs[filteredTabs.length - 1].id : 'home');
    }
  };

  const setActiveBoardIdForCurrentTab = (boardId) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, activeBoardId: boardId } : t));
  };

  const activeBoardId = tabs.find(t => t.id === activeTabId)?.activeBoardId || null;

  // פונקציות וורקספייס
  const addWorkspace = () => {
    const newId = `w-${Date.now()}`;
    setWorkspaces([...workspaces, { id: newId, name: 'WORKSPACE חדש', color: '#64748b', isCollapsed: false }]);
  };

  const updateWorkspaceName = (id, newName) => {
    setWorkspaces(workspaces.map(w => w.id === id ? { ...w, name: newName } : w));
  };

  const updateWorkspaceColor = (id, color) => {
    setWorkspaces(workspaces.map(w => w.id === id ? { ...w, color } : w));
    setOpenColorPickerId(null);
  };

  const toggleWorkspaceCollapse = (id) => {
    setWorkspaces(workspaces.map(w => w.id === id ? { ...w, isCollapsed: !w.isCollapsed } : w));
  };

  const moveWorkspace = (id, direction) => {
    const index = workspaces.findIndex(w => w.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workspaces.length) return;
    const updated = [...workspaces];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setWorkspaces(updated);
  };

  // פונקציות לוחות
  const addBoard = (workspaceId) => {
    const newId = `b-${Date.now()}`;
    setBoards([...boards, { 
      id: newId, 
      workspaceId, 
      name: 'לוח חדש',
      columns: { item: 'ITEM', status: 'סטטוס', text: 'טקסט', number: 'מספר' }
    }]);
    setActiveBoardIdForCurrentTab(newId);
    
    const groupId = `g-${Date.now()}`;
    setGroups([...groups, { id: groupId, boardId: newId, name: 'קבוצה 1', color: '#3b82f6', isCollapsed: false, items: [] }]);
  };

  const updateBoardName = (id, newName) => {
    setBoards(boards.map(b => b.id === id ? { ...b, name: newName } : b));
  };

  const updateColumnName = (boardId, columnKey, newName) => {
    // מונע הזנת נקודות גם בזמן הקלדה חיה
    const sanitizedName = String(newName).replace(/\./g, '');
    setBoards(boards.map(b => b.id === boardId ? {
      ...b,
      columns: { ...b.columns, [columnKey]: sanitizedName }
    } : b));
  };

  const moveBoard = (id, direction) => {
    const board = boards.find(b => b.id === id);
    if (!board) return;
    
    const wsBoards = boards.filter(b => b.workspaceId === board.workspaceId);
    const index = wsBoards.findIndex(b => b.id === id);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= wsBoards.length) return;
    
    const updatedWsBoards = [...wsBoards];
    const [moved] = updatedWsBoards.splice(index, 1);
    updatedWsBoards.splice(newIndex, 0, moved);
    
    const otherBoards = boards.filter(b => b.workspaceId !== board.workspaceId);
    setBoards([...otherBoards, ...updatedWsBoards]);
  };

  // פונקציות קבוצות
  const addGroup = () => {
    if (!activeBoardId) return;
    const newId = `g-${Date.now()}`;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setGroups([...groups, { id: newId, boardId: activeBoardId, name: 'קבוצה חדשה', color: randomColor, isCollapsed: false, items: [] }]);
  };

  const updateGroupName = (id, newName) => {
    setGroups(groups.map(g => g.id === id ? { ...g, name: newName } : g));
  };

  const toggleGroupCollapse = (id) => {
    setGroups(groups.map(g => g.id === id ? { ...g, isCollapsed: !g.isCollapsed } : g));
  };

  const updateGroupColor = (id, color) => {
    setGroups(groups.map(g => g.id === id ? { ...g, color } : g));
    setOpenColorPickerId(null);
  };

  const moveGroup = (id, direction) => {
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) return;
    
    const currentGroup = groups[index];
    const boardGroupIndices = groups
      .map((g, i) => (g.boardId === currentGroup.boardId ? i : null))
      .filter(v => v !== null);
      
    const innerIndex = boardGroupIndices.indexOf(index);
    const targetInnerIndex = direction === 'up' ? innerIndex - 1 : innerIndex + 1;
    
    if (targetInnerIndex < 0 || targetInnerIndex >= boardGroupIndices.length) return;
    
    const targetIndex = boardGroupIndices[targetInnerIndex];
    const updatedGroups = [...groups];
    const temp = updatedGroups[index];
    updatedGroups[index] = updatedGroups[targetIndex];
    updatedGroups[targetIndex] = temp;
    
    setGroups(updatedGroups);
  };

  const updateItemName = (groupId, itemId, newName) => {
    setGroups(groups.map(g => g.id === groupId ? {
      ...g,
      items: g.items.map(item => item.id === itemId ? { ...item, name: newName } : item)
    } : g));
  };

  const updateItemValue = (groupId, itemId, key, value) => {
    setGroups(groups.map(g => g.id === groupId ? {
      ...g,
      items: g.items.map(item => item.id === itemId ? { ...item, [key]: value } : item)
    } : g));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === 'ws') {
      setWorkspaces(workspaces.filter(w => w.id !== id));
      setBoards(boards.filter(b => b.workspaceId !== id));
    } else if (type === 'board') {
      setBoards(boards.filter(b => b.id !== id));
      if (activeBoardId === id) setActiveBoardIdForCurrentTab(null);
    } else if (type === 'group') {
      setGroups(groups.filter(g => g.id !== id));
    }
    setDeleteTarget(null);
    setActiveMenu(null);
  };

  const addItem = (groupId, itemName) => {
    if (!itemName.trim()) return;
    setGroups(groups.map(g => g.id === groupId ? { 
      ...g, 
      items: [...g.items, { 
        id: `i-${Date.now()}`, 
        name: itemName,
        status: '', 
        textValue: '', 
        numberValue: '' 
      }] 
    } : g));
  };

  return (
    <AppContext.Provider value={{
      tabs, setTabs, activeTabId, setActiveTabId, isMenuOpen, setIsMenuOpen, memos, setMemos,
      workspaces, boards, activeBoardId, setActiveBoardIdForCurrentTab, groups, activeMenu, setActiveMenu,
      openColorPickerId, setOpenColorPickerId, deleteTarget, setDeleteTarget, defaultColors,
      advancedPickerTarget, setAdvancedPickerTarget, saveToFile, loadFromFile,
      openTab, closeTab, addWorkspace, updateWorkspaceName, updateWorkspaceColor, moveWorkspace, toggleWorkspaceCollapse,
      addBoard, updateBoardName, updateColumnName, moveBoard, confirmDelete, addGroup, updateGroupName, toggleGroupCollapse, updateGroupColor, moveGroup, 
      addItem, updateItemName, updateItemValue,
      setWorkspaces, setBoards, setGroups
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}