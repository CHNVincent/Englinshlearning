import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Admin from './pages/Admin';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <footer className="footer">
          © 2026 EnglishEcho - Master Your Pronunciation
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
