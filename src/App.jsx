import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <div className="min-h-screen bg-secondary dark:bg-dark transition-colors duration-300">
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

export default App;