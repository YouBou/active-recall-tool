import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, useParams } from 'react-router-dom';
import { Brain, Layers, BarChart3, Sun, Moon } from 'lucide-react';
import DecksPage from './pages/DecksPage';
import DeckDetailPage from './pages/DeckDetailPage';
import StudyPage from './pages/StudyPage';
import StatsPage from './pages/StatsPage';

// Wrapper that forces StudyPage remount on deckId change, resetting all session state
function StudyPageWithKey() {
  const { deckId } = useParams<{ deckId: string }>();
  return <StudyPage key={deckId} />;
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isStudying = location.pathname.startsWith('/study/');

  if (isStudying) {
    return (
      <div className="app">
        <div className="main-content">
          <Routes>
            <Route path="/study/:deckId" element={<StudyPageWithKey />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="logo">
          <Brain size={24} />
          <span>Active Recall</span>
        </NavLink>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <Layers size={18} />
            <span className="nav-label">デッキ</span>
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''}>
            <BarChart3 size={18} />
            <span className="nav-label">統計</span>
          </NavLink>
        </nav>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'ダークテーマに切り替え' : 'ライトテーマに切り替え'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DecksPage />} />
          <Route path="/deck/:deckId" element={<DeckDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
