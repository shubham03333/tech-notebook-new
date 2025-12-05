import React, { useState, useEffect, useRef } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import { useNotes } from '../context/NotesContext';
import 'draft-js/dist/Draft.css';


const NoteEditor = () => {
  const { selectedNote, updateNote, addNote, categories, deleteNote, setSelectedNote, getNoteForExport } = useNotes();
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  // remove isPreview state as no markdown preview needed
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  const editorRef = useRef(null);

  // Removed helpers for textarea selection, as the editor is now Draft.js Editor

  // Removed toggleWrap and other markdown wrapping functions, replaced by Draft.js inline style toggling


  // Remove markdown-based indent/outdent and highlight/bold/italic toggles as they are not used with Draft.js

  // Removed: indentSelection, outdentSelection, toggleHighlight, toggleBold, toggleItalic


  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setCategory(selectedNote.category);
      setTags(selectedNote.tags.join(', '));
      if (selectedNote.content) {
        try {
          const parsedContent = JSON.parse(selectedNote.content);
          // Check if parsedContent is valid Draft.js Raw ContentState
          if (parsedContent && typeof parsedContent === 'object' && parsedContent.blocks) {
            const contentState = convertFromRaw(parsedContent);
            setEditorState(EditorState.createWithContent(contentState));
          } else {
            // If not raw Draft.js content, fallback to treat as plain text
            setEditorState(EditorState.createWithContent(ContentState.createFromText(String(selectedNote.content))));
          }
        } catch {
          // If JSON parse fails, treat as plain text
          setEditorState(EditorState.createWithContent(ContentState.createFromText(String(selectedNote.content))));
        }
      } else {
        setEditorState(EditorState.createEmpty());
      }
      setIsNew(false);
      setShowCreatePopup(false);
    } else {
      setTitle('');
      setCategory('');
      setTags('');
      setEditorState(EditorState.createEmpty());
      setIsNew(true);
      // Removed automatic popup open on no selectedNote
      // setShowCreatePopup(true);
    }
  }, [selectedNote]);

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    setIsSaving(true);
    const contentRaw = convertToRaw(editorState.getCurrentContent());
    const noteData = {
      title,
      category: category || categories[0] || '',
      tags: tags.split(',').map(t => t.trim()),
      content: JSON.stringify(contentRaw),
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
          const contentRaw = convertToRaw(editorState.getCurrentContent());
          const contentString = JSON.stringify(contentRaw);
          await updateNote(selectedNote.id, { content: contentString });
        } catch (error) {
          console.error('Auto-save failed:', error);
          // Silently fail to avoid interrupting user
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editorState, isNew, selectedNote, updateNote]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    const contentText = editorState.getCurrentContent().getPlainText('\n');
    // Create a temporary print view
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-content { max-width: none; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${contentText.replace(/\n/g, '<br>')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    if (!selectedNote) {
      alert('No note selected for export.');
      return;
    }
    import('jspdf').then(jsPDFModule => {
      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF();
      const title = selectedNote.title || 'Untitled Note';
      const contentText = editorState.getCurrentContent().getPlainText('\n');

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const maxLineWidth = pageWidth - margin * 2;
      const lineHeight = 10;
      let cursorY = margin;

      // Add title
      doc.setFontSize(18);
      doc.text(title, margin, cursorY);
      cursorY += 15;
      doc.setFontSize(12);

      // Word wrap content lines within page width
      const lines = doc.splitTextToSize(contentText, maxLineWidth);
      lines.forEach(line => {
        if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    }).catch(err => {
      alert('Failed to load PDF export library.');
      console.error(err);
    });
  };

  // Implement export JSON functionality
  const handleExportJSON = () => {
    if (!selectedNote || !selectedNote.id) {
      alert('No note selected for export.');
      return;
    }
    const jsonStr = getNoteForExport(selectedNote.id);
    if (!jsonStr) {
      alert('Failed to get note data for export.');
      return;
    }
    // Create blob and trigger download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = selectedNote.title ? selectedNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'note';
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <div className="popup-container" role="dialog" aria-modal="true" aria-labelledby="popup-title" style={{ maxWidth: '95vw', padding: '20px' }}>
          <button
            type="button"
            className="close-button"
            onClick={() => setShowCreatePopup(false)}
            aria-label="Close create note popup"
            style={{ float: 'right', fontSize: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            ×
          </button>
          <h2 id="popup-title">Create New Note</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
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
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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

            <div
              style={{
                border: '1px solid #ddd',
                minHeight: 150,
                padding: 10,
                cursor: 'text',
              }}
              onClick={() => editorRef.current.focus()}
              aria-label="Note content editor"
            >
              <Editor
                editorState={editorState}
                onChange={setEditorState}
                placeholder="Write your note content here..."
                spellCheck={true}
                ref={editorRef}
              />
            </div>

            <div className="form-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowCreatePopup(false)}
                style={{ marginRight: 8 }}
              >
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Create Note'}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  if (!selectedNote) {
    return (
      <div className="note-editor">
        Select or create a note{' '}
        <button onClick={() => setShowCreatePopup(true)}>Create New Note</button>
      </div>
    );
  }

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleInlineStyle = (inlineStyle) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  return (
    <div className="note-editor" style={{ maxWidth: '100%', padding: 12 }}>
      <h2>Edit Note</h2>
      <div
        className="editor-controls"
        style={{
          marginBottom: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => toggleInlineStyle('BOLD')}
          aria-label="Bold"
          title="Bold"
          style={{ fontWeight: 'bold', padding: '6px 12px' }}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => toggleInlineStyle('ITALIC')}
          aria-label="Italic"
          title="Italic"
          style={{ fontStyle: 'italic', padding: '6px 12px' }}
        >
          I
        </button>
        <button onClick={handleSave} disabled={isSaving} style={{ padding: '6px 12px' }}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handlePrint} style={{ padding: '6px 12px' }}>
          Print
        </button>
        <button onClick={handleDelete} style={{ backgroundColor: '#e53e3e', color: 'white', padding: '6px 12px' }}>
          Delete
        </button>
      </div>
      <div
        onClick={() => editorRef.current.focus()}
        style={{
          border: '1px solid #ddd',
          minHeight: 300,
          padding: 10,
          cursor: 'text',
          whiteSpace: 'pre-wrap',
        }}
        aria-label="Note content editor"
      >
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          placeholder="Write your note content here..."
          spellCheck
          ref={editorRef}
        />
      </div>
    </div>
  );
};

export default NoteEditor;
