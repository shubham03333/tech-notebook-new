import React, { useEffect, useState } from 'react';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SuperUserNotesPage = () => {
  const { notes, loadNotes } = useNotes();
  const { isSuperUser } = useAuth();
  const [notesWithUserNames, setNotesWithUserNames] = useState([]);

  // Fetch all notes on mount if super user
  useEffect(() => {
    if (isSuperUser) {
      loadNotes(null, true);
    }
  }, [isSuperUser, loadNotes]);

  // Fetch user names for notes
  useEffect(() => {
    const fetchUserNames = async () => {
      const newNotes = await Promise.all(
        notes.map(async (note) => {
          try {
            const userDocRef = doc(db, 'users', note.userId);
            const userDoc = await getDoc(userDocRef);
            const userName = userDoc.exists() ? userDoc.data().name || 'Unknown' : 'Unknown';
            return { ...note, userName };
          } catch (err) {
            console.error('Error fetching user for note:', err);
            return { ...note, userName: 'Unknown' };
          }
        })
      );
      setNotesWithUserNames(newNotes);
    };

    if (notes.length > 0) {
      fetchUserNames();
    } else {
      setNotesWithUserNames([]);
    }
  }, [notes]);

  if (!isSuperUser) {
    return <div>You do not have access to this page.</div>;
  }

  return (
    <div>
      <h2>Super User: All Users' Notes</h2>
      {notesWithUserNames.length === 0 ? (
        <p>No notes available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Note Title</th>
              <th>Note Content</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {notesWithUserNames.map((note) => (
              <tr key={note.id}>
                <td>{note.userName}</td>
                <td>{note.title}</td>
                <td>{note.content}</td>
                <td>{note.updatedAt ? new Date(note.updatedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SuperUserNotesPage;
