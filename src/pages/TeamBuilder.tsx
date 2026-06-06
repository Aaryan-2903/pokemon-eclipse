import { useEffect, useMemo, useState } from 'react';
import usePokemonSearch from '../hooks/usePokemonSearch';
import type { PokemonDetail } from '../hooks/usePokemonSearch';

const STORAGE_KEY = 'pokemon-3d-team';
const teamStats = ['hp', 'attack', 'defense', 'speed'];

function formatName(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character: string) => character.toUpperCase());
}

function getArtwork(pokemon: PokemonDetail) {
  return pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
}

function getStat(pokemon: PokemonDetail, statName: string) {
  return pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
}

function getStoredTeam() {
  try {
    const storedTeam = window.localStorage.getItem(STORAGE_KEY);
    if (!storedTeam) return [];
    const parsedTeam = JSON.parse(storedTeam) as PokemonDetail[];
    return Array.isArray(parsedTeam) ? parsedTeam.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function TeamBuilder() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [team, setTeam] = useState<PokemonDetail[]>(() => getStoredTeam());

  const { results, loadingList, errorList, loadingResults, errorResults } = usePokemonSearch(searchTerm);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  }, [team]);

  const teamTotals = useMemo(
    () =>
      teamStats.map((statName) => ({
        name: statName,
        value: team.reduce((total, pokemon) => total + getStat(pokemon, statName), 0),
      })),
    [team]
  );

  const teamTypes = useMemo(() => {
    const typeCounts = new Map<string, number>();
    team.forEach((pokemon) => {
      pokemon.types.forEach((typeEntry) => {
        typeCounts.set(typeEntry.type.name, (typeCounts.get(typeEntry.type.name) || 0) + 1);
      });
    });
    return Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);
  }, [team]);

  const isLoading = loadingList || loadingResults;
  const errorMessage = errorList || errorResults;

  const addPokemon = (pokemon: PokemonDetail) => {
    setTeam((currentTeam) => {
      if (currentTeam.length >= 6 || currentTeam.some((member) => member.id === pokemon.id)) {
        return currentTeam;
      }
      return [...currentTeam, pokemon];
    });
  };

  const removePokemon = (pokemonId: number) => {
    setTeam((currentTeam) => currentTeam.filter((pokemon) => pokemon.id !== pokemonId));
  };

  return (
    <section className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-[0.24em] text-poke">Team Builder</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Build your perfect squad.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Search Pokemon, add up to six partners, and keep your team saved between visits.
          </p>
        </div>
        <div className="w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300 md:w-auto">
          <span className="font-semibold text-white">{team.length}</span> / 6 team slots filled
        </div>
      </div>

      <div className="grid min-w-0 gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="min-w-0 space-y-6">
          <div className="w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow sm:p-8">
            <label htmlFor="team-search" className="text-sm uppercase tracking-[0.22em] text-slate-400">
              Search Pokemon
            </label>
            <input
              id="team-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try pikachu, eevee, charizard..."
              className="mt-4 w-full rounded-3xl border border-white/10 bg-night/80 px-5 py-4 text-sm text-white outline-none transition duration-200 focus:border-poke focus:ring-2 focus:ring-poke/20"
            />
          </div>

          <div className="w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Search Results</h2>
              <p className="text-sm text-slate-400">{isLoading ? 'Loading...' : `${results.length} shown`}</p>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-100">{errorMessage}</div>
            ) : isLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-night/80">
                <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-poke animate-spin" />
              </div>
            ) : results.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((pokemon) => {
                  const imageUrl = getArtwork(pokemon);
                  const alreadyAdded = team.some((member) => member.id === pokemon.id);
                  const teamFull = team.length >= 6;

                  return (
                    <article key={pokemon.id} className="rounded-2xl border border-white/10 bg-night/95 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-2">
                          {imageUrl ? <img src={imageUrl} alt={pokemon.name} className="h-full w-full object-contain" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">#{pokemon.id.toString().padStart(3, '0')}</p>
                          <h3 className="mt-1 truncate text-lg font-semibold capitalize text-white">{pokemon.name}</h3>
                          <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-slate-400">
                            {pokemon.types.map((typeEntry) => typeEntry.type.name).join(' / ')}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addPokemon(pokemon)}
                        disabled={alreadyAdded || teamFull}
                        className="mt-4 w-full rounded-full bg-poke px-4 py-3 text-sm font-semibold text-white transition hover:bg-pokeSoft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                      >
                        {alreadyAdded ? 'Added' : teamFull ? 'Team Full' : 'Add Pokemon'}
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-night/80 p-8 text-center text-slate-400">
                Search for a Pokemon to add to your team.
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Your Team</h2>
              <button
                type="button"
                onClick={() => setTeam([])}
                disabled={!team.length}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
              >
                Clear
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => {
                const pokemon = team[index];
                const imageUrl = pokemon ? getArtwork(pokemon) : null;

                return pokemon ? (
                  <article key={pokemon.id} className="rounded-2xl border border-poke/20 bg-night/95 p-4 shadow-[0_0_36px_rgba(243,36,36,0.08)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-2">
                        {imageUrl ? <img src={imageUrl} alt={pokemon.name} className="h-full w-full object-contain" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-poke">Slot {index + 1}</p>
                        <h3 className="mt-1 truncate text-lg font-semibold capitalize text-white">{pokemon.name}</h3>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pokemon.types.map((typeEntry) => (
                        <span key={typeEntry.type.name} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">
                          {formatName(typeEntry.type.name)}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePokemon(pokemon.id)}
                      className="mt-4 w-full rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-poke/40 hover:bg-poke/10"
                    >
                      Remove
                    </button>
                  </article>
                ) : (
                  <div key={index} className="flex min-h-[184px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-night/50 text-sm text-slate-500">
                    Empty Slot {index + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Team Stats</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {teamTotals.map((stat) => (
                <div key={stat.name} className="rounded-2xl border border-white/10 bg-night/90 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{formatName(stat.name)}</p>
                    <p className="text-xl font-semibold text-white">{stat.value}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-poke to-[#f7a1a1]"
                      style={{ width: `${Math.min((stat.value / 600) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-night/90 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Type Coverage</p>
              {teamTypes.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {teamTypes.map(([type, count]) => (
                    <span key={type} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">
                      {formatName(type)} x{count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Add Pokemon to see your team coverage.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamBuilder;
