import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import SearchBar from './components/SearchBar';
import Login from './components/Login';
import Signup from './components/Signup';
import SuperUserNotesPage from './components/SuperUserNotesPage';
import { NotesProvider, useNotes } from './context/NotesContext';
import { useAuth } from './context/AuthContext';
import './App.css';
// import './App.css';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="login-container">
        <Login />
        <Signup />
      </div>
    );
  }

  return (
    <NotesProvider>
      <AppContent />
    </NotesProvider>
  );
}

function AppContent() {
  const { searchQuery, selectedNote } = useNotes();
  const { isSuperUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [superUserView, setSuperUserView] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className={`app ${sidebarOpen ? '' : 'sidebar-closed'} ${searchQuery ? 'searching' : ''}`}>
      <SearchBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {isSuperUser && (
        <button className="superuser-toggle-btn" onClick={() => setSuperUserView(!superUserView)}>
          {superUserView ? 'Back to My Notes' : 'View All Notes (SuperUser)'}
        </button>
      )}

      {superUserView ? (
        <SuperUserNotesPage />
      ) : searchQuery ? (
        <>
          <NoteEditor />
          <NoteList />
        </>
      ) : (
        <>
          <NoteEditor />
          {!selectedNote && <NoteList />}
        </>
      )}

      <button
        className="dark-mode-toggle"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>
      <div className="scroll-buttons">
        <button
          className="scroll-to-top"
          onClick={scrollToTop}
          title="Scroll to Top"
        >
          ⬆️
        </button>
        <button
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          title="Scroll to Bottom"
        >
          ⬇️
        </button>
      </div>
    </div>
  );
}

export default App;
