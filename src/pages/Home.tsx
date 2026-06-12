import { useState } from 'react';
import { Link } from 'react-router-dom';
import PokeBallScene from '../components/PokeBallScene';

const starters = [
  {
    id: 1,
    name: 'Bulbasaur',
    description: 'A Grass/Poison Pokemon that thrives in verdant forests and absorbs sunlight for energy.',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    types: ['Grass', 'Poison'],
    stats: { HP: 45, Attack: 49, Defense: 49, Speed: 45 },
  },
  {
    id: 4,
    name: 'Charmander',
    description: 'A fiery starter that grows more powerful as its flame burns brighter with every battle.',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
    types: ['Fire'],
    stats: { HP: 39, Attack: 52, Defense: 43, Speed: 65 },
  },
  {
    id: 7,
    name: 'Squirtle',
    description: 'A water-loving turtle Pokemon that can vanish beneath waves and strike with precision.',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
    types: ['Water'],
    stats: { HP: 44, Attack: 48, Defense: 65, Speed: 43 },
  },
];

function Home() {
  const [selectedStarter, setSelectedStarter] = useState(starters[0]);

  return (
    <section className="relative min-h-screen w-full max-w-full overflow-hidden bg-[radial-gradient(circle_at_50%_10%,_rgb(var(--color-accent-rgb)_/_0.2),transparent_22%),radial-gradient(circle_at_76%_48%,_rgba(64,91,210,0.18),transparent_28%),linear-gradient(180deg,#030509_0%,#07101d_45%,#030509_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-75">
        <div className="absolute left-8 top-16 h-24 w-24 rounded-full bg-poke/20 blur-3xl animate-float-slow" />
        <div className="absolute right-8 top-32 h-20 w-20 rounded-full bg-blue-400/20 blur-3xl animate-float" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center overflow-hidden px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid min-h-[calc(100vh-5rem)] min-w-0 gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:gap-16 lg:items-center">
          <div className="min-w-0 space-y-7 pt-10 text-center lg:pt-0 lg:text-left lg:pr-8">
            <div className="hero-badge inline-flex items-center justify-center rounded border border-poke/30 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-poke shadow-[0_0_24px_rgb(var(--color-accent-rgb)_/_0.25)] backdrop-blur-xl sm:text-sm">
              Night signal detected
            </div>

            <div className="space-y-5">
              <h1 className="text-[clamp(3rem,7vw,6.8rem)] font-black leading-[0.92] text-white drop-shadow-[0_0_48px_rgb(var(--color-accent-rgb)_/_0.45)]">
                Pokemon <span className="bg-gradient-to-r from-poke via-white to-[#7da2ff] bg-clip-text text-transparent">Eclipse</span>
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-8 text-slate-300 sm:text-xl lg:mx-0">
                A midnight region wakes under crimson auroras. Choose your partner, step through the storm, and answer the call from the glowing Poke Ball.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
              <Link
                to="/pokedex"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded bg-gradient-to-r from-poke via-pokeSoft to-white/80 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_60px_rgb(var(--color-accent-rgb)_/_0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_120px_rgb(var(--color-accent-rgb)_/_0.3)]"
              >
                <span className="relative z-10">Start Adventure</span>
                <span className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.25),transparent_45%)] opacity-0 transition duration-500 group-hover:opacity-100" />
              </Link>
              <a
                href="#starters"
                className="inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-7 py-4 text-base font-semibold text-white/90 transition duration-300 hover:bg-white/10"
              >
                Choose Starter
              </a>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              {[
                { label: 'Region', value: 'Eclipse Coast' },
                { label: 'Signal', value: 'Crimson Pulse' },
                { label: 'Status', value: 'Storm Rising' },
              ].map((item) => (
                <div key={item.label} className="rounded border border-white/10 bg-black/25 p-4 text-left shadow-[0_0_60px_rgba(255,255,255,0.03)] backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-white sm:text-lg">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[56vh] min-h-[390px] w-full overflow-hidden sm:h-[68vh] lg:h-[calc(100vh-7rem)] lg:min-h-[620px] lg:pl-6">
            <PokeBallScene />
          </div>
        </div>

        <div id="starters" className="mt-12 w-full max-w-full overflow-hidden border-t border-white/10 bg-black/15 px-4 py-12 shadow-[0_0_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">Choose Your Starter</p>
            <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Pick the partner for your first journey.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300 sm:text-lg">
              Select Bulbasaur, Charmander, or Squirtle to begin your adventure with a classic team companion.
            </p>
          </div>

          <div className="grid min-w-0 gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              {starters.map((starter) => {
                const isSelected = starter.name === selectedStarter.name;
                return (
                  <button
                    key={starter.id}
                    type="button"
                    onClick={() => setSelectedStarter(starter)}
                    className={`group relative overflow-hidden rounded-lg border p-5 text-left transition duration-300 ${
                      isSelected
                        ? 'border-poke/70 bg-poke/10 shadow-[0_0_40px_rgb(var(--color-accent-rgb)_/_0.18)]'
                        : 'border-white/10 bg-white/5 hover:border-poke/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-poke via-white to-slate-300 opacity-0 transition duration-300 group-hover:opacity-100" />
                    <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 rounded bg-slate-950/70 p-3">
                        <img src={starter.image} alt={starter.name} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Starter</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{starter.name}</h3>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {starter.types.map((type) => (
                        <span
                          key={type}
                          className="rounded bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border border-white/10 bg-night/95 p-5 shadow-[0_0_80px_rgba(0,0,0,0.2)] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.22em] text-poke">Selected Pokemon</p>
                  <h3 className="mt-3 text-3xl font-semibold text-white">{selectedStarter.name}</h3>
                </div>
                <div className="shrink-0 rounded bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200">
                  #{selectedStarter.id.toString().padStart(3, '0')}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-32 w-32 items-center justify-center rounded bg-white/5 p-4 shadow-inner">
                  <img src={selectedStarter.image} alt={selectedStarter.name} className="h-full w-full object-contain" />
                </div>
                <div className="space-y-4">
                  <p className="text-slate-300">{selectedStarter.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStarter.types.map((type) => (
                      <span key={type} className="rounded bg-poke/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-poke">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {Object.entries(selectedStarter.stats).map(([label, value]) => (
                  <div key={label} className="rounded border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <p className="text-lg font-semibold text-white">{value}</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-poke to-pokeSoft"
                        style={{ width: `${Math.min((value / 85) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="about" className="mt-16 grid gap-6 pb-16 md:grid-cols-3">
          {[
            {
              title: 'Eclipse Coast',
              text: 'A remote shoreline lit by auroras, strange signals, and trainer camps beneath the cliffs.',
            },
            {
              title: 'Crimson Signal',
              text: 'The Poke Ball reacts to moonlight, pulsing when rare Pokemon move through the dark.',
            },
            {
              title: 'First Trial',
              text: 'Cross the ruined observatory and prove your bond before the storm reaches the harbor.',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border border-white/10 bg-white/5 p-8 shadow-[0_0_50px_rgba(0,0,0,0.16)] backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-white">{feature.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Home;
