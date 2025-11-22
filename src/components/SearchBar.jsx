import React, { useEffect } from 'react';
import { useNotes } from '../context/NotesContext';

const SearchBar = ({ onMenuClick }) => {
  const { searchQuery, setSearchQuery } = useNotes();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-input').focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="search-bar">
      <button className="menu-button" onClick={onMenuClick}>
        ☰
      </button>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          className="search-input"
          type="text"
          placeholder="Search notes... (Ctrl+K)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', paddingRight: '30px' }}
        />
        {searchQuery && (
          <button
            className="clear-button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#666'
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
