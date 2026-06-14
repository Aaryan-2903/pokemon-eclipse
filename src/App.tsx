import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Pokedex from './pages/Pokedex.tsx';
import TeamBuilder from './pages/TeamBuilder.tsx';
import BattleArena from './pages/BattleArena.tsx';
import MasterChallenge from './pages/MasterChallenge.tsx';
import About from './pages/About.tsx';
import AdventurePage from './pages/AdventurePage.tsx';

function App() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-night text-white">
      <Navbar />
      <main className="w-full max-w-full overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pokedex" element={<Pokedex />} />
          <Route path="/team-builder" element={<TeamBuilder />} />
          <Route path="/battle-arena" element={<BattleArena />} />
          <Route path="/master-challenge" element={<MasterChallenge />} />
          <Route path="/about" element={<About />} />
          <Route path="/adventure" element={<AdventurePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
