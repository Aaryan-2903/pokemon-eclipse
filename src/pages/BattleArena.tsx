import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import usePokemonSearch from '../hooks/usePokemonSearch';
import type { PokemonDetail } from '../hooks/usePokemonSearch';

const BATTLE_RECORD_KEY = 'pokemon-3d-battle-record';
const BASE_URL = 'https://pokeapi.co/api/v2';
const MAX_RANDOM_POKEMON = 151;

type BattleStatus = 'selecting' | 'loading-enemy' | 'ready' | 'player-turn' | 'enemy-turn' | 'won' | 'lost';

type BattleRecord = {
  wins: number;
  losses: number;
};

type BattleLog = {
  id: number;
  text: string;
};

function formatName(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character: string) => character.toUpperCase());
}

function getArtwork(pokemon: PokemonDetail) {
  return pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
}

function getStat(pokemon: PokemonDetail, statName: string) {
  return pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
}

function getMaxHp(pokemon: PokemonDetail) {
  return Math.max(60, getStat(pokemon, 'hp') * 2);
}

function getStoredRecord(): BattleRecord {
  try {
    const storedRecord = window.localStorage.getItem(BATTLE_RECORD_KEY);
    if (!storedRecord) return { wins: 0, losses: 0 };

    const parsedRecord = JSON.parse(storedRecord) as BattleRecord;
    return {
      wins: Number.isFinite(parsedRecord.wins) ? parsedRecord.wins : 0,
      losses: Number.isFinite(parsedRecord.losses) ? parsedRecord.losses : 0,
    };
  } catch {
    return { wins: 0, losses: 0 };
  }
}

function calculateDamage(attacker: PokemonDetail, defender: PokemonDetail) {
  const attack = getStat(attacker, 'attack') + getStat(attacker, 'special-attack') * 0.65;
  const defense = getStat(defender, 'defense') + getStat(defender, 'special-defense') * 0.55;
  const speedBonus = getStat(attacker, 'speed') > getStat(defender, 'speed') ? 1.08 : 1;
  const variance = 0.88 + Math.random() * 0.24;

  return Math.max(10, Math.round((attack * speedBonus * variance) / Math.max(2.4, defense / 30)));
}

function PokemonBattleCard({
  pokemon,
  hp,
  maxHp,
  label,
  align = 'left',
  cardRef,
}: {
  pokemon: PokemonDetail | null;
  hp: number;
  maxHp: number;
  label: string;
  align?: 'left' | 'right';
  cardRef?: RefObject<HTMLDivElement>;
}) {
  const hpPercent = maxHp ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const imageUrl = pokemon ? getArtwork(pokemon) : null;

  return (
    <div
      ref={cardRef}
      className={`min-h-[320px] sm:min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-night/95 p-5 shadow-glow sm:p-6 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <div className={`flex items-start justify-between gap-4 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-poke">{label}</p>
          <h2 className="mt-2 truncate text-3xl font-semibold capitalize text-white">
            {pokemon ? pokemon.name : 'Awaiting pick'}
          </h2>
        </div>
        <div className="shrink-0 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300">
          HP {Math.max(0, hp)} / {maxHp || 0}
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-poke to-pokeSoft transition-[width] duration-300"
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      <div className="mt-8 flex min-h-[180px] items-center justify-center rounded-[1.5rem] bg-white/5 p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={pokemon?.name}
            className="h-40 w-40 max-w-full object-contain drop-shadow-[0_28px_70px_rgb(var(--color-accent-rgb)_/_0.24)] sm:h-56 sm:w-56"
          />
        ) : (
          <div className="text-sm text-slate-500">Select a Pokemon to enter the arena.</div>
        )}
      </div>

      {pokemon ? (
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {['attack', 'defense', 'speed', 'hp'].map((statName) => (
            <div key={statName} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{formatName(statName)}</p>
              <p className="mt-1 text-lg font-semibold text-white">{getStat(pokemon, statName)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BattleArena() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [playerPokemon, setPlayerPokemon] = useState<PokemonDetail | null>(null);
  const [enemyPokemon, setEnemyPokemon] = useState<PokemonDetail | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [status, setStatus] = useState<BattleStatus>('selecting');
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [record, setRecord] = useState<BattleRecord>(() => getStoredRecord());
  const [enemyError, setEnemyError] = useState<string | null>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);
  const enemyCardRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  const { results, loadingList, loadingResults, errorList, errorResults } = usePokemonSearch(searchTerm);
  const playerMaxHp = useMemo(() => (playerPokemon ? getMaxHp(playerPokemon) : 0), [playerPokemon]);
  const enemyMaxHp = useMemo(() => (enemyPokemon ? getMaxHp(enemyPokemon) : 0), [enemyPokemon]);
  const isSearching = loadingList || loadingResults;
  const searchError = errorList || errorResults;
  const battleOver = status === 'won' || status === 'lost';

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchTerm(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    window.localStorage.setItem(BATTLE_RECORD_KEY, JSON.stringify(record));
  }, [record]);

  const addLog = (text: string) => {
    logIdRef.current += 1;
    setBattleLog((currentLog) => [{ id: logIdRef.current, text }, ...currentLog].slice(0, 5));
  };

  const animateHit = (target: 'player' | 'enemy') => {
    const element = target === 'player' ? playerCardRef.current : enemyCardRef.current;
    if (!element) return;

    gsap.fromTo(
      element,
      { x: target === 'player' ? -10 : 10, filter: 'brightness(1.45)' },
      { x: 0, filter: 'brightness(1)', duration: 0.28, ease: 'elastic.out(1, 0.5)', clearProps: 'transform,filter' }
    );
  };

  const fetchRandomEnemy = async (playerId: number) => {
    setStatus('loading-enemy');
    setEnemyError(null);

    try {
      let enemyId = Math.floor(Math.random() * MAX_RANDOM_POKEMON) + 1;
      if (enemyId === playerId) {
        enemyId = (enemyId % MAX_RANDOM_POKEMON) + 1;
      }

      const response = await fetch(`${BASE_URL}/pokemon/${enemyId}`);
      if (!response.ok) {
        throw new Error('Unable to summon an enemy Pokemon.');
      }

      const enemy = (await response.json()) as PokemonDetail;
      setEnemyPokemon(enemy);
      setEnemyHp(getMaxHp(enemy));
      setStatus('ready');
      addLog(`${formatName(enemy.name)} entered the arena.`);
    } catch (error) {
      setEnemyError(error instanceof Error ? error.message : 'Unable to summon an enemy Pokemon.');
      setStatus('selecting');
    }
  };

  const selectPokemon = (pokemon: PokemonDetail) => {
    setPlayerPokemon(pokemon);
    setPlayerHp(getMaxHp(pokemon));
    setEnemyPokemon(null);
    setEnemyHp(0);
    setBattleLog([]);
    addLog(`${formatName(pokemon.name)} is ready to battle.`);
    void fetchRandomEnemy(pokemon.id);
  };

  const startBattle = () => {
    if (!playerPokemon || !enemyPokemon) return;

    const playerStarts = getStat(playerPokemon, 'speed') >= getStat(enemyPokemon, 'speed');
    setStatus(playerStarts ? 'player-turn' : 'enemy-turn');
    addLog(playerStarts ? 'Your Pokemon moves first.' : 'Enemy Pokemon moves first.');

    if (!playerStarts) {
      window.setTimeout(() => enemyAttack(), 650);
    }
  };

  const finishBattle = (result: 'won' | 'lost') => {
    setStatus(result);
    setRecord((currentRecord) => ({
      wins: currentRecord.wins + (result === 'won' ? 1 : 0),
      losses: currentRecord.losses + (result === 'lost' ? 1 : 0),
    }));
  };

  const enemyAttack = () => {
    if (!playerPokemon || !enemyPokemon) return;

    const damage = calculateDamage(enemyPokemon, playerPokemon);
    animateHit('player');
    setPlayerHp((currentHp) => {
      const nextHp = Math.max(0, currentHp - damage);
      addLog(`${formatName(enemyPokemon.name)} hit for ${damage} damage.`);

      if (nextHp <= 0) {
        finishBattle('lost');
      } else {
        setStatus('player-turn');
      }

      return nextHp;
    });
  };

  const playerAttack = () => {
    if (!playerPokemon || !enemyPokemon || status !== 'player-turn') return;

    const damage = calculateDamage(playerPokemon, enemyPokemon);
    animateHit('enemy');
    setEnemyHp((currentHp) => {
      const nextHp = Math.max(0, currentHp - damage);
      addLog(`${formatName(playerPokemon.name)} hit for ${damage} damage.`);

      if (nextHp <= 0) {
        finishBattle('won');
      } else {
        setStatus('enemy-turn');
        window.setTimeout(() => enemyAttack(), 800);
      }

      return nextHp;
    });
  };

  const resetBattle = () => {
    setEnemyPokemon(null);
    setEnemyHp(0);
    setStatus(playerPokemon ? 'loading-enemy' : 'selecting');
    setBattleLog([]);

    if (playerPokemon) {
      setPlayerHp(getMaxHp(playerPokemon));
      void fetchRandomEnemy(playerPokemon.id);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-[0.24em] text-poke">Battle Arena</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Challenge a wild Pokemon.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Choose a fighter from live PokeAPI data, face a random opponent, and trade attacks until one HP bar drops.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center md:w-auto md:min-w-[240px]">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Wins</p>
            <p className="mt-1 text-2xl font-semibold text-poke">{record.wins}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Losses</p>
            <p className="mt-1 text-2xl font-semibold text-white">{record.losses}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow sm:p-6">
            <label htmlFor="battle-search" className="text-sm uppercase tracking-[0.22em] text-slate-400">
              Choose Your Pokemon
            </label>
            <input
              id="battle-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Pikachu, Gengar, Dragonite..."
              className="mt-4 w-full rounded-3xl border border-white/10 bg-night/80 px-5 py-4 text-sm text-white outline-none transition duration-200 focus:border-poke focus:ring-2 focus:ring-poke/20"
            />

            <div className="mt-5 grid max-h-[520px] gap-3 overflow-y-auto pr-1">
              {searchError ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-100">
                  {searchError}
                </div>
              ) : isSearching ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-white/10 bg-night/80">
                  <div className="h-10 w-10 rounded-full border-4 border-white/10 border-t-poke animate-spin" />
                </div>
              ) : results.length ? (
                results.map((pokemon) => {
                  const imageUrl = getArtwork(pokemon);
                  const isSelected = playerPokemon?.id === pokemon.id;

                  return (
                    <button
                      key={pokemon.id}
                      type="button"
                      onClick={() => selectPokemon(pokemon)}
                      className={`flex items-center gap-4 rounded-2xl border p-3 text-left transition hover:border-poke/40 hover:bg-white/10 ${
                        isSelected ? 'border-poke/60 bg-poke/10' : 'border-white/10 bg-night/80'
                      }`}
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-2">
                        {imageUrl ? <img src={imageUrl} alt={pokemon.name} className="h-full w-full object-contain" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">#{pokemon.id.toString().padStart(3, '0')}</p>
                        <h2 className="mt-1 truncate text-lg font-semibold capitalize text-white">{pokemon.name}</h2>
                        <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-slate-400">
                          {pokemon.types.map((typeEntry) => typeEntry.type.name).join(' / ')}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-night/80 p-8 text-center text-sm text-slate-400">
                  Search the Pokedex to pick your battler.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Battle Log</h2>
            <div className="mt-4 space-y-3">
              {battleLog.length ? (
                battleLog.map((entry) => (
                  <p key={entry.id} className="rounded-2xl bg-night/80 px-4 py-3 text-sm text-slate-300">
                    {entry.text}
                  </p>
                ))
              ) : (
                <p className="rounded-2xl bg-night/80 px-4 py-3 text-sm text-slate-500">
                  Select a Pokemon to begin.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <PokemonBattleCard
              pokemon={playerPokemon}
              hp={playerHp}
              maxHp={playerMaxHp}
              label="Your Pokemon"
              cardRef={playerCardRef}
            />
            <PokemonBattleCard
              pokemon={enemyPokemon}
              hp={enemyHp}
              maxHp={enemyMaxHp}
              label="Enemy Pokemon"
              align="right"
              cardRef={enemyCardRef}
            />
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 text-center shadow-glow sm:p-6">
            {enemyError ? <p className="mb-4 text-sm text-red-200">{enemyError}</p> : null}
            {battleOver ? (
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-poke">
                  {status === 'won' ? 'Victory' : 'Defeat'}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  {status === 'won' ? 'You won the battle.' : 'Your Pokemon fainted.'}
                </h2>
                <button
                  type="button"
                  onClick={resetBattle}
                  className="mt-6 rounded-full bg-poke px-6 py-3 text-sm font-semibold text-white transition hover:bg-pokeSoft"
                >
                  New Opponent
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-slate-300">
                  {status === 'selecting'
                    ? 'Pick a Pokemon from the Pokedex list.'
                    : status === 'loading-enemy'
                      ? 'Summoning a random opponent...'
                      : status === 'ready'
                        ? 'Opponent ready. Start when you are.'
                        : status === 'enemy-turn'
                          ? 'Enemy is attacking...'
                          : 'Your turn. Choose your attack.'}
                </p>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={startBattle}
                    disabled={status !== 'ready'}
                    className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
                  >
                    Start Battle
                  </button>
                  <button
                    type="button"
                    onClick={playerAttack}
                    disabled={status !== 'player-turn'}
                    className="rounded-full bg-poke px-6 py-3 text-sm font-semibold text-white transition hover:bg-pokeSoft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                  >
                    Attack
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BattleArena;
