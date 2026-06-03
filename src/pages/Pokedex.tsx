import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import usePokemonSearch from '../hooks/usePokemonSearch';
import type { PokemonDetail } from '../hooks/usePokemonSearch';

const spotlightStats = ['hp', 'attack', 'defense', 'speed'];

function formatStatName(stat: string) {
  switch (stat) {
    case 'hp':
      return 'HP';
    case 'attack':
      return 'Attack';
    case 'defense':
      return 'Defense';
    case 'special-attack':
      return 'Sp. Atk';
    case 'special-defense':
      return 'Sp. Def';
    case 'speed':
      return 'Speed';
    default:
      return stat.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function formatPokemonText(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function PokemonDetailModal({
  pokemon,
  onClose,
}: {
  pokemon: PokemonDetail;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const imageUrl = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
  const visibleStats = pokemon.stats.filter((stat) => spotlightStats.includes(stat.stat.name));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const context = gsap.context(() => {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out' });
      gsap.fromTo(
        panelRef.current,
        { y: 34, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.36, ease: 'power3.out' }
      );
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        animateClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      context.revert();
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const animateClose = () => {
    const timeline = gsap.timeline({ onComplete: onClose });
    timeline.to(panelRef.current, { y: 24, opacity: 0, scale: 0.97, duration: 0.22, ease: 'power2.in' });
    timeline.to(backdropRef.current, { opacity: 0, duration: 0.18, ease: 'power2.in' }, '<0.05');
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          animateClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pokemon-modal-title"
    >
      <div
        ref={panelRef}
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(243,36,36,0.18),transparent_26%),linear-gradient(145deg,#080d18_0%,#101827_55%,#05070d_100%)] p-5 shadow-[0_30px_140px_rgba(0,0,0,0.55)] sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-poke">#{pokemon.id.toString().padStart(3, '0')}</p>
            <h2 id="pokemon-modal-title" className="mt-3 text-4xl font-semibold capitalize text-white sm:text-5xl">
              {pokemon.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={animateClose}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            aria-label="Close Pokemon details"
          >
            Close
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-inner">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={pokemon.name}
                className="h-72 w-72 object-contain drop-shadow-[0_30px_80px_rgba(243,36,36,0.25)] sm:h-96 sm:w-96"
              />
            ) : (
              <div className="flex h-72 w-72 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-slate-500">No image</div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {pokemon.types.map((typeEntry) => (
                <span key={typeEntry.type.name} className="rounded-full bg-poke/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-poke">
                  {formatPokemonText(typeEntry.type.name)}
                </span>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {visibleStats.map((stat) => (
                <div key={stat.stat.name} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm uppercase tracking-[0.2em] text-slate-400">{formatStatName(stat.stat.name)}</span>
                    <span className="text-xl font-semibold text-white">{stat.base_stat}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-poke to-[#f7a1a1]"
                      style={{ width: `${Math.min((stat.base_stat / 160) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Height</p>
                <p className="mt-2 text-2xl font-semibold text-white">{(pokemon.height / 10).toFixed(1)} m</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Weight</p>
                <p className="mt-2 text-2xl font-semibold text-white">{(pokemon.weight / 10).toFixed(1)} kg</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Abilities</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pokemon.abilities.map((entry) => (
                  <span key={entry.ability.name} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100">
                    {formatPokemonText(entry.ability.name)}
                    {entry.is_hidden ? ' Hidden' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pokedex() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);

  const { results, loadingList, errorList, loadingResults, errorResults } = usePokemonSearch(searchTerm);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const isLoading = loadingList || loadingResults;
  const errorMessage = errorList || errorResults;

  const statusText = useMemo(() => {
    if (errorMessage) return 'Unable to load Pokemon. Try again later.';
    if (loadingList) return 'Loading Pokedex list...';
    if (loadingResults) return 'Fetching Pokemon details...';
    if (!results.length) return query ? 'No Pokemon matched your search.' : 'Search for a Pokemon by name.';
    return `${results.length} Pokemon found`;
  }, [errorMessage, loadingList, loadingResults, results.length, query]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow sm:p-8">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-poke">Pokedex</p>
            <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Search Pokemon with real PokeAPI data</h1>
            <p className="mt-3 max-w-xl text-slate-300">
              Lookup Pokemon, view official artwork, types, stats, and experience polished loading and error states.
            </p>
          </div>
          <div className="max-w-md w-full">
            <label htmlFor="pokemon-search" className="sr-only">
              Search Pokemon
            </label>
            <input
              id="pokemon-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
              className="w-full rounded-3xl border border-white/10 bg-night/80 px-5 py-4 text-sm text-white outline-none transition duration-200 focus:border-poke focus:ring-2 focus:ring-poke/20"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-night/90 px-6 py-5 text-sm text-slate-300 sm:flex-row sm:justify-between sm:px-8">
          <span>{statusText}</span>
          <span className="text-slate-400">Showing the first 12 matching Pokemon.</span>
        </div>

        {errorMessage ? (
          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-10 text-center text-red-200">
            <p className="text-lg font-semibold">Oops! Something went wrong.</p>
            <p className="mt-2 text-sm text-red-100">{errorMessage}</p>
          </div>
        ) : isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-night/95 p-10">
            <div className="flex flex-col items-center gap-4 text-slate-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/10 border-t-poke/80 text-poke animate-spin" />
              <p className="text-sm">Loading Pokemon data...</p>
            </div>
          </div>
        ) : results.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((pokemon) => {
              const imageUrl =
                pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;

              return (
                <button
                  key={pokemon.id}
                  type="button"
                  onClick={() => setSelectedPokemon(pokemon)}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-night/95 p-6 text-left shadow-[0_20px_80px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-1 hover:border-poke/25 focus:border-poke/50 focus:outline-none focus:ring-2 focus:ring-poke/25"
                  aria-label={`Open details for ${pokemon.name}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">#{pokemon.id.toString().padStart(3, '0')}</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white capitalize">{pokemon.name}</h2>
                    </div>
                    <div className="rounded-3xl bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 shadow-inner">
                      {pokemon.types.map((typeEntry) => typeEntry.type.name).join(' / ')}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center rounded-[2rem] bg-white/5 p-6">
                    {imageUrl ? (
                      <img src={imageUrl} alt={pokemon.name} className="h-36 w-36 object-contain" />
                    ) : (
                      <div className="flex h-36 w-36 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-slate-500">No image</div>
                    )}
                  </div>

                  <div className="mt-6 grid gap-3">
                    {pokemon.stats.map((stat) => (
                      <div key={stat.stat.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <span>{formatStatName(stat.stat.name)}</span>
                          <span className="font-semibold text-white">{stat.base_stat}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-poke to-[#f7a1a1]"
                            style={{ width: `${Math.min((stat.base_stat / 255) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-night/80 p-12 text-center text-slate-400">
            <p className="text-lg">Start typing a Pokemon name above to begin your search.</p>
            <p className="mt-2 text-sm text-slate-500">Example: Pikachu, Charizard, Bulbasaur.</p>
          </div>
        )}
      </div>

      {selectedPokemon ? (
        <PokemonDetailModal pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />
      ) : null}
    </section>
  );
}

export default Pokedex;
