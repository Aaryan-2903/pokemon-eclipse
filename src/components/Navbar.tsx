import { NavLink } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const links = [
  { label: 'Home', path: '/' },
  { label: 'Pokedex', path: '/pokedex' },
  { label: 'Team Builder', path: '/team-builder' },
  { label: 'Battle Arena', path: '/battle-arena' },
  { label: 'Master Challenge', path: '/master-challenge' },
  { label: 'About', path: '/about' },
];

const THEME_STORAGE_KEY = 'pokemon-3d-theme';
const MUSIC_STORAGE_KEY = 'pokemon-3d-music';
const MUSIC_VOLUME = 0.2;
type ThemeName = 'eclipse-red' | 'midnight-blue';

type MusicEngine = {
  context: AudioContext;
  filter: BiquadFilterNode;
  masterGain: GainNode;
  oscillators: OscillatorNode[];
  intervalId: number;
};

function getInitialTheme(): ThemeName {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'midnight-blue' ? 'midnight-blue' : 'eclipse-red';
}

function createMusicEngine() {
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  const filter = context.createBiquadFilter();
  const oscillators = [context.createOscillator(), context.createOscillator(), context.createOscillator()];

  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  masterGain.gain.value = 0;

  const baseNotes = [130.81, 164.81, 196];
  oscillators.forEach((oscillator, index) => {
    oscillator.type = index === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = baseNotes[index];
    oscillator.detune.value = index === 1 ? 4 : index === 2 ? -5 : 0;
    oscillator.connect(filter);
    oscillator.start();
  });

  filter.connect(masterGain);
  masterGain.connect(context.destination);

  let step = 0;
  const progression = [
    [130.81, 164.81, 196],
    [146.83, 185, 220],
    [164.81, 196, 246.94],
    [123.47, 155.56, 196],
  ];

  const intervalId = window.setInterval(() => {
    const now = context.currentTime;
    const chord = progression[step % progression.length];

    oscillators.forEach((oscillator, index) => {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(chord[index], now, 0.18);
    });

    step += 1;
  }, 1600);

  return {
    context,
    filter,
    masterGain,
    oscillators,
    intervalId,
  };
}

function Navbar() {
  const [theme, setTheme] = useState<ThemeName>(() => getInitialTheme());
  const [musicEnabled, setMusicEnabled] = useState(false);
  const musicEngineRef = useRef<MusicEngine | null>(null);
  const musicStopTimeoutRef = useRef<number | null>(null);
  const isMidnightBlue = theme === 'midnight-blue';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'eclipse-red' ? 'midnight-blue' : 'eclipse-red'));
  };

  const stopMusic = () => {
    const engine = musicEngineRef.current;
    if (!engine) return;

    const now = engine.context.currentTime;
    engine.masterGain.gain.cancelScheduledValues(now);
    engine.masterGain.gain.setValueAtTime(engine.masterGain.gain.value, now);
    engine.masterGain.gain.linearRampToValueAtTime(0, now + 0.6);

    musicStopTimeoutRef.current = window.setTimeout(() => {
      engine.oscillators.forEach((oscillator) => oscillator.stop());
      window.clearInterval(engine.intervalId);
      void engine.context.close();
      musicEngineRef.current = null;
      musicStopTimeoutRef.current = null;
    }, 700);
  };

  const toggleMusic = () => {
    if (musicEnabled) {
      stopMusic();
      setMusicEnabled(false);
      window.localStorage.setItem(MUSIC_STORAGE_KEY, 'off');
      return;
    }

    if (musicStopTimeoutRef.current) {
      window.clearTimeout(musicStopTimeoutRef.current);
      musicStopTimeoutRef.current = null;
    }

    const engine = musicEngineRef.current || createMusicEngine();
    if (!engine) return;

    musicEngineRef.current = engine;
    void engine.context.resume();

    const now = engine.context.currentTime;
    engine.masterGain.gain.cancelScheduledValues(now);
    engine.masterGain.gain.setValueAtTime(engine.masterGain.gain.value, now);
    engine.masterGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + 0.8);

    setMusicEnabled(true);
    window.localStorage.setItem(MUSIC_STORAGE_KEY, 'on');
  };

  useEffect(() => {
    return () => {
      if (musicStopTimeoutRef.current) {
        window.clearTimeout(musicStopTimeoutRef.current);
      }

      const engine = musicEngineRef.current;
      if (engine) {
        engine.oscillators.forEach((oscillator) => oscillator.stop());
        window.clearInterval(engine.intervalId);
        void engine.context.close();
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full max-w-full overflow-x-hidden border-b border-white/10 bg-night/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div className="min-w-0">
          <span className="text-lg font-semibold tracking-[0.18em] text-poke">POKE 3D</span>
        </div>
        <div className="flex w-full max-w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-end">
          <nav className="flex max-w-full flex-wrap items-center gap-2 text-sm font-medium text-slate-300 md:gap-3">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 transition sm:px-4 ${
                    isActive ? 'bg-white/10 text-white shadow-glow' : 'hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleMusic}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.12em] shadow-glow transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-poke/40 sm:px-4 ${
                musicEnabled
                  ? 'border-poke/40 bg-poke/15 text-poke'
                  : 'border-white/10 bg-white/5 text-slate-300'
              }`}
              aria-pressed={musicEnabled}
              aria-label={musicEnabled ? 'Turn background music off' : 'Turn background music on'}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M9 18V6l10-2v12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="16" r="2" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>{musicEnabled ? 'Music ON' : 'Music OFF'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-poke shadow-glow transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-poke/40"
              aria-label={`Switch to ${isMidnightBlue ? 'Eclipse Red' : 'Midnight Blue'} theme`}
              title={isMidnightBlue ? 'Eclipse Red' : 'Midnight Blue'}
            >
              {isMidnightBlue ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M20.5 14.4A7.3 7.3 0 0 1 9.6 3.5 8.6 8.6 0 1 0 20.5 14.4Z"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
