import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
// import sampleData from '../utils/sampleData';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, isSuperUser } = useAuth();

  // -----------------------------
  // Load notes from Firestore
  // -----------------------------
  const loadNotes = async (userId, loadAll = false) => {
    try {
      console.log('[NotesProvider] loadNotes for', userId, 'loadAll:', loadAll);
      let q;
      if (loadAll) {
        q = query(
          collection(db, 'notes'),
          orderBy('updatedAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'notes'),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      setNotes(notesData);
      console.log('[NotesProvider] Loaded notes:', notesData);
    } catch (error) {
      console.error('[NotesProvider] Error loading notes:', error);
      setNotes([]);
    }
  };

  // -----------------------------
  // Load categories from Firestore
  // -----------------------------
  const loadCategories = async (userId) => {
    try {
      console.log('[NotesProvider] loadCategories for', userId);
      const q = query(
        collection(db, 'categories'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const catsDocs = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      const catNames =
        catsDocs.length > 0
          ? ['Default', ...catsDocs.map((c) => c.name).filter(c => c !== 'Default')]
          : ['Default', 'Linux', 'SQL', 'DevOps'];

      setCategories(catNames);
      console.log('[NotesProvider] Loaded categories:', catNames);

      if (!selectedCategory && catNames.length > 0) {
        setSelectedCategory(catNames[0]);
      }
    } catch (error) {
      console.error('[NotesProvider] Error loading categories:', error);
      setCategories(['Default', 'Linux', 'SQL', 'DevOps']);
    }
  };

  // -----------------------------
  // Load data when user changes
  // -----------------------------
  useEffect(() => {
    if (!currentUser) {
      console.log('[NotesProvider] No user, clearing data');
      setNotes([]);
      setCategories([]);
      setSelectedCategory(null);
      setSelectedNote(null);
      return;
    }

    loadNotes(currentUser.uid, isSuperUser);
    loadCategories(currentUser.uid);
  }, [currentUser, isSuperUser]);

  // -----------------------------
  // Add note
  // -----------------------------
  const addNote = async (note) => {
    if (!currentUser) {
      alert('You must be logged in to add notes.');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'notes'), {
        ...note,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        versions: []
      });
      const newNote = {
        id: docRef.id,
        ...note,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: []
      };
      setNotes((prev) => [newNote, ...prev]);
      console.log('[NotesProvider] Note added with id:', docRef.id);
    } catch (error) {
      console.error('[NotesProvider] Error adding note:', error);
      alert('Failed to save note. Please check console and try again.');
    }
  };

  // -----------------------------
  // Update note
  // -----------------------------
  const updateNote = async (id, updates) => {
    if (!currentUser) {
      alert('You must be logged in to update notes.');
      return;
    }
    try {
      await updateDoc(doc(db, 'notes', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        )
      );
      console.log('[NotesProvider] Note updated:', id);
    } catch (error) {
      console.error('[NotesProvider] Error updating note:', error);
      alert('Failed to update note. Please check console and try again.');
    }
  };

  // -----------------------------
  // Delete note
  // -----------------------------
  const deleteNote = async (id) => {
    if (!currentUser) {
      alert('You must be logged in to delete notes.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'notes', id));
      setNotes((prev) => prev.filter((note) => note.id !== id));
      console.log('[NotesProvider] Note deleted:', id);
    } catch (error) {
      console.error('[NotesProvider] Error deleting note:', error);
      alert('Failed to delete note. Please check console and try again.');
    }
  };

  // -----------------------------
  // Add category
  // -----------------------------
  const addCategory = async (category) => {
    if (!currentUser) {
      alert('You must be logged in to add categories.');
      return;
    }
    try {
      const trimmed = category?.trim();
      if (!trimmed) {
        console.warn('[NotesProvider] Empty category name, ignoring');
        return;
      }
      await addDoc(collection(db, 'categories'), {
        name: trimmed,
        userId: currentUser.uid
      });
      setCategories((prev) => [...prev, trimmed]);
      console.log('[NotesProvider] Category added:', trimmed);
    } catch (error) {
      console.error('[NotesProvider] Error adding category:', error);
      alert('Failed to add category. Please check console and try again.');
    }
  };

  // Function to get note content as markdown string for export by id
  const getNoteForExport = (id) => {
    const noteToExport = notes.find(note => note.id === id);
    if (!noteToExport) {
      console.error('[NotesProvider] Note not found for export:', id);
      return null;
    }
    // Export only the content as markdown text
    return noteToExport.content || '';
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        categories,
        selectedCategory,
        setSelectedCategory,
        selectedNote,
        setSelectedNote,
        searchQuery,
        setSearchQuery,
        addNote,
        updateNote,
        deleteNote,
        addCategory,
        loadNotes,
        getNoteForExport,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

