import React from 'react';
import { useApp } from '../context/AppContext';

export default function TabBar() {
  const { tabs, activeTabId, setActiveTabId, closeTab } = useApp();

  return (
    <div style={{ 
      height: '45px', 
      backgroundColor: '#1e293b', 
      borderBottom: '1px solid #334155', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 10px', 
      gap: '10px', 
      width: '100%', 
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* אזור הלשוניות */}
      <div style={{ display: 'flex', gap: '5px', flex: 1, overflow: 'hidden', height: '100%', alignItems: 'center' }}>
        
        {/* טאב הבית קבוע */}
        <div 
          onClick={() => setActiveTabId('home')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: activeTabId === 'home' ? '#0f172a' : 'transparent', 
            color: activeTabId === 'home' ? '#38bdf8' : '#94a3b8', 
            borderRadius: '6px 6px 0 0', 
            cursor: 'pointer', 
            fontSize: '13px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: activeTabId === 'home' ? '1px solid #334155' : '1px solid transparent',
            borderBottom: activeTabId === 'home' ? '1px solid #0f172a' : '1px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          🏠 דף הבית
        </div>

        {/* טאבים דינמיים שנוספו */}
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          return (
            <div 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              style={{ 
                padding: '8px 14px', 
                backgroundColor: isActive ? '#0f172a' : 'transparent', 
                color: isActive ? '#38bdf8' : '#94a3b8', 
                borderRadius: '6px 6px 0 0', 
                cursor: 'pointer', 
                fontSize: '13px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                border: isActive ? '1px solid #334155' : '1px solid transparent',
                borderBottom: isActive ? '1px solid #0f172a' : '1px solid transparent',
                marginBottom: '-1px',
                position: 'relative',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <span>{tab.type === 'tasks' ? '📋' : '📝'} {tab.title}</span>
              <button 
                onClick={(e) => closeTab(tab.id, e)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#64748b', 
                  cursor: 'pointer', 
                  fontSize: '11px', 
                  padding: '2px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#334155'; e.target.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#64748b'; }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}