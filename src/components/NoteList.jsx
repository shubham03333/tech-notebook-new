import React from 'react';
import { useNotes } from '../context/NotesContext';

const NoteList = () => {
  const { notes, selectedCategory, selectedNote, setSelectedNote, searchQuery, updateNote } = useNotes();

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = searchQuery !== '' || !selectedCategory || note.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (searchQuery === '') return 0; // No sorting if no search query

    const aMatches = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     a.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                     a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const bMatches = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     b.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                     b.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0; // Keep original order if both match or neither matches
  });

  const handleAddNote = () => {
    setSelectedNote(null); // To show create form in editor
  };

  return (
    <div className={`note-list ${searchQuery ? 'searching' : ''}`}>
      <h2>Notes {searchQuery && `(Searching across all categories)`}</h2>
      <button className="create-new-note-btn" onClick={handleAddNote}>Add New Note</button>
      {filteredNotes.map(note => (
        <div
          key={note.id}
          onClick={() => setSelectedNote(note)}
          className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
        >
          <h3>{note.title}</h3>
          <p>{note.content.substring(0, 100)}...</p>
          <div className="tags">
            {note.tags.map(tag => (
              <span key={tag} className={tag.toLowerCase().includes(searchQuery.toLowerCase()) ? 'highlight' : ''}>
                {tag}
              </span>
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); updateNote(note.id, { favorite: !note.favorite }); }}>
            {note.favorite ? '⭐' : '☆'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default NoteList;
