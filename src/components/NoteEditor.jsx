import React, { useState, useEffect, useRef } from 'react';
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
  const [isDeleting, setIsDeleting] = useState(false);
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
      // Removed automatic popup open on no selectedNote
      // setShowCreatePopup(true);
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
        setSelectedNote(null); // Close the edit view after saving existing note
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
      const timer = setTimeout(async () => {
        try {
          await updateNote(selectedNote.id, { content });
        } catch (error) {
          console.error('Auto-save failed:', error);
          // Silently fail to avoid interrupting user
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, isNew, selectedNote, updateNote]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    // Create a temporary print view
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-content { max-width: none; }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${content.replace(/\n/g, '<br>')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export
    alert('PDF export not implemented yet');
  };

  const handleDelete = async () => {
    if (selectedNote && window.confirm('Are you sure you want to delete this note?')) {
      setIsDeleting(true);
      try {
        await deleteNote(selectedNote.id);
        // Clear the selected note after deletion
        setSelectedNote(null);
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (showCreatePopup) {
    return (
      <>
        <div className="popup-overlay" onClick={() => setShowCreatePopup(false)}></div>
        <div className="popup-container">
          <form
            className="popup-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-title"
            style={{maxWidth: '95vw', padding: '20px'}}
          >
            <button
              type="button"
              className="close-button"
              onClick={() => setShowCreatePopup(false)}
              aria-label="Close create note popup"
            >
              ×
            </button>
            <h2 id="popup-title">Create New Note</h2>

            <div className="form-group">
              <label htmlFor="note-title">Title</label>
              <input
                id="note-title"
                type="text"
                placeholder="Enter note title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="note-category">Category</label>
              <select
                id="note-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="note-tags">Tags</label>
              <input
                id="note-tags"
                type="text"
                placeholder="Enter tags (comma separated)"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="note-content">Content</label>
              <textarea
                id="note-content"
                placeholder="Write your note content here (Markdown supported)"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={15}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowCreatePopup(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-button"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Create Note'}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  if (!selectedNote)
    return (
      <div className="note-editor">
        Select or create a note{' '}
        <button onClick={() => setShowCreatePopup(true)}>Create New Note</button>
      </div>
    );

  return (
    <div className="note-editor" style={{padding: '12px', maxWidth: '100%'}}>
      <h2>Edit Note</h2>
      <div className="editor-controls" style={{gap: '8px'}}>
        <button onClick={() => setIsPreview(!isPreview)} style={{padding: '6px 12px'}}>
          {isPreview ? 'Edit' : 'Preview'}
        </button>
        <button onClick={handleSave} disabled={isSaving} style={{padding: '6px 12px'}}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handlePrint} style={{padding: '6px 12px'}}>Print</button>
        <button onClick={handleExportPDF} style={{padding: '6px 12px'}}>Export PDF</button>
        <button onClick={handleDelete} style={{ backgroundColor: '#e53e3e', color: 'white', padding: '6px 12px' }}>Delete</button>
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
          style={{padding: '12px', fontSize: '14px', boxSizing: 'border-box', width: '100%', resize: 'vertical', minHeight: '150px'}}
        />
      )}
    </div>
  );
};

export default NoteEditor;
