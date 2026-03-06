import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, createContext } from 'react';
import { api } from './lib/api';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import BoardEditor from './pages/BoardEditor';
import BoardPlay from './pages/BoardPlay';
import './App.css';

export const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, logout }}>
      <BrowserRouter>
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/create" element={<BoardEditor />} />
            <Route path="/board/:id/edit" element={<BoardEditor />} />
            <Route path="/board/:id" element={<BoardPlay />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
