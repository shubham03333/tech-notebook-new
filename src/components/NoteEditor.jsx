import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNotes } from '../context/NotesContext';

const NoteEditor = () => {
  const { selectedNote, updateNote, addNote, categories, deleteNote, setSelectedNote } = useNotes();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setCategory(selectedNote.category);
      setTags(selectedNote.tags.join(', '));
      setContent(selectedNote.content);
      setIsNew(false);
      setShowCreatePopup(false);
    } else {
      setTitle('');
      setCategory('');
      setTags('');
      setContent('');
      setIsNew(true);
      setShowCreatePopup(true);
    }
  }, [selectedNote]);

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    setIsSaving(true);
    const noteData = {
      title,
      category: category || categories[0] || '',
      tags: tags.split(',').map(t => t.trim()),
      content,
      favorite: false
    };
    try {
      if (isNew) {
        await addNote(noteData);
        setShowCreatePopup(false); // Close the popup after saving new note
      } else {
        await updateNote(selectedNote.id, noteData);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save
  useEffect(() => {
    if (!isNew && selectedNote) {
      const timer = setTimeout(() => {
        updateNote(selectedNote.id, { content });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, isNew, selectedNote, updateNote]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export
    alert('PDF export not implemented yet');
  };

  const handleDelete = async () => {
    if (selectedNote && window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(selectedNote.id);
        // Clear the selected note after deletion
        setSelectedNote(null);
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  if (showCreatePopup) {
    return (
      <div className="note-editor centered">
        <button className="close-button" onClick={() => setShowCreatePopup(false)}>×</button>
        <h2>Create New Note</h2>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Select Category</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
        <textarea
          placeholder="Content (Markdown)"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={20}
        />
        <button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    );
  }

  if (!selectedNote) return <div className="note-editor">Select or create a note <button onClick={() => setShowCreatePopup(true)}>Create New Note</button></div>;

  return (
    <div className="note-editor">
      <h2>Edit Note</h2>
      <div className="editor-controls">
        <button onClick={() => setIsPreview(!isPreview)}>
          {isPreview ? 'Edit' : 'Preview'}
        </button>
        <button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handlePrint}>Print</button>
        <button onClick={handleExportPDF}>Export PDF</button>
        <button onClick={handleDelete} style={{ backgroundColor: '#e53e3e', color: 'white' }}>Delete</button>
      </div>
      {isPreview ? (
        <div className="preview">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="code-block">
                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                    <button onClick={() => copyToClipboard(String(children))}>Copy</button>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={30}
        />
      )}
    </div>
  );
};

export default NoteEditor;
