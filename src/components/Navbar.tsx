import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Home', path: '/' },
  { label: 'Pokedex', path: '/pokedex' },
  { label: 'Team Builder', path: '/team-builder' },
  { label: 'About', path: '/about' },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-night/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div>
          <span className="text-lg font-semibold tracking-[0.18em] text-poke">POKE 3D</span>
        </div>
        <nav className="flex w-full items-center gap-2 overflow-x-auto text-sm font-medium text-slate-300 md:w-auto md:gap-3">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-4 py-2 transition ${
                  isActive ? 'bg-white/10 text-white shadow-glow' : 'hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
