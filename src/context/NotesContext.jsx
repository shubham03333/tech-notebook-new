import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();

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

    console.log('[NotesProvider] Loading data for user:', currentUser.uid);
    loadNotes(currentUser.uid);
    loadCategories(currentUser.uid);
  }, [currentUser]);

  // -----------------------------
  // Load notes from Firestore
  // -----------------------------
  const loadNotes = async (userId) => {
    try {
      console.log('[NotesProvider] loadNotes for', userId);
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      console.log('[NotesProvider] Loaded notes:', notesData);
      setNotes(notesData);
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

      console.log('[NotesProvider] Loaded categories:', catNames);
      setCategories(catNames);

      // Optional: auto-select first category
      if (!selectedCategory && catNames.length > 0) {
        setSelectedCategory(catNames[0]);
      }
    } catch (error) {
      console.error('[NotesProvider] Error loading categories:', error);
      setCategories(['Default', 'Linux', 'SQL', 'DevOps']);
    }
  };

  // -----------------------------
  // Add note
  // -----------------------------
  const addNote = async (note) => {
    try {
      if (!currentUser) {
        console.error('[NotesProvider] addNote called with no currentUser');
        alert('You must be logged in to add notes.');
        return;
      }

      console.log('[NotesProvider] addNote payload:', note);

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

      console.log('[NotesProvider] Note added with id:', docRef.id);
      setNotes((prev) => [newNote, ...prev]);
    } catch (error) {
      console.error(
        '[NotesProvider] Error adding note:',
        error.message,
        error.code,
        error
      );
      alert('Failed to save note. Please check console and try again.');
    }
  };

  // -----------------------------
  // Update note
  // -----------------------------
  const updateNote = async (id, updates) => {
    try {
      if (!currentUser) {
        console.error('[NotesProvider] updateNote called with no currentUser');
        alert('You must be logged in to update notes.');
        return;
      }

      console.log('[NotesProvider] updateNote id:', id, 'updates:', updates);

      await updateDoc(doc(db, 'notes', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
      );
    } catch (error) {
      console.error(
        '[NotesProvider] Error updating note:',
        error.message,
        error.code,
        error
      );
      alert('Failed to update note. Please check console and try again.');
    }
  };

  // -----------------------------
  // Delete note
  // -----------------------------
  const deleteNote = async (id) => {
    try {
      if (!currentUser) {
        console.error('[NotesProvider] deleteNote called with no currentUser');
        alert('You must be logged in to delete notes.');
        return;
      }

      console.log('[NotesProvider] deleteNote id:', id);

      await deleteDoc(doc(db, 'notes', id));
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error(
        '[NotesProvider] Error deleting note:',
        error.message,
        error.code,
        error
      );
      alert('Failed to delete note. Please check console and try again.');
    }
  };

  // -----------------------------
  // Add category
  // -----------------------------
  const addCategory = async (category) => {
    try {
      if (!currentUser) {
        console.error(
          '[NotesProvider] addCategory called with no currentUser'
        );
        alert('You must be logged in to add categories.');
        return;
      }

      const trimmed = category?.trim();
      if (!trimmed) {
        console.warn('[NotesProvider] Empty category name, ignoring');
        return;
      }

      console.log('[NotesProvider] addCategory:', trimmed);

      await addDoc(collection(db, 'categories'), {
        name: trimmed,
        userId: currentUser.uid
      });

      setCategories((prev) => [...prev, trimmed]);
    } catch (error) {
      console.error(
        '[NotesProvider] Error adding category:',
        error.message,
        error.code,
        error
      );
      alert('Failed to add category. Please check console and try again.');
    }
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
        addCategory
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};
