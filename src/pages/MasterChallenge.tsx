import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { PokemonDetail } from '../hooks/usePokemonSearch';

const BASE_URL = 'https://pokeapi.co/api/v2';
const TOTAL_ROUNDS = 10;
const ROUND_SECONDS = 15;
const MASTER_STATS_KEY = 'pokemon-3d-master-challenge-stats';
const MASTER_LEADERBOARD_KEY = 'pokemon-3d-master-challenge-leaderboard';
const MASTER_SFX_KEY = 'pokemon-3d-master-challenge-sfx';

type GameStatus = 'idle' | 'loading' | 'playing' | 'feedback' | 'game-over';
type HintKey = 'type' | 'letter' | 'fifty';

type PokemonListItem = {
  name: string;
  url: string;
};

type ChallengeStats = {
  gamesPlayed: number;
  correctAnswers: number;
  totalAnswers: number;
  highestScore: number;
  currentStreak: number;
  longestStreak: number;
  xp: number;
};

type LeaderboardEntry = {
  id: string;
  score: number;
  correct: number;
  date: string;
};

type RoundState = {
  target: PokemonDetail;
  choices: PokemonListItem[];
  hiddenChoiceNames: string[];
};

const popularPokemonIds = [1, 4, 7, 25, 39, 52, 54, 58, 94, 95, 130, 131, 133, 143, 149, 150, 151];
const skilledPokemonIds = [6, 9, 59, 65, 68, 76, 78, 89, 121, 123, 127, 134, 135, 136, 142, 197, 212, 248];
const rarePokemonIds = [
  144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 289, 330, 350, 373, 376, 377, 378, 379, 380, 381,
  382, 383, 384, 385, 386, 445, 448, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
];

const defaultStats: ChallengeStats = {
  gamesPlayed: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  highestScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  xp: 0,
};

function formatName(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character: string) => character.toUpperCase());
}

function getArtwork(pokemon: PokemonDetail) {
  return pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
}

function getPokemonIdFromUrl(url: string) {
  const match = url.match(/\/pokemon\/(\d+)\//);
  return match ? Number(match[1]) : 1;
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getStoredStats(): ChallengeStats {
  try {
    const storedStats = window.localStorage.getItem(MASTER_STATS_KEY);
    if (!storedStats) return defaultStats;

    return { ...defaultStats, ...(JSON.parse(storedStats) as Partial<ChallengeStats>) };
  } catch {
    return defaultStats;
  }
}

function getStoredLeaderboard(): LeaderboardEntry[] {
  try {
    const storedLeaderboard = window.localStorage.getItem(MASTER_LEADERBOARD_KEY);
    return storedLeaderboard ? (JSON.parse(storedLeaderboard) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function getRank(xp: number) {
  if (xp >= 8500) return 'Pokemon Master';
  if (xp >= 5200) return 'Champion';
  if (xp >= 2800) return 'Elite Trainer';
  if (xp >= 1200) return 'Gym Challenger';
  return 'Rookie Trainer';
}

function getLevel(xp: number) {
  return Math.floor(xp / 500) + 1;
}

function MasterChallenge() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [pokemonPool, setPokemonPool] = useState<PokemonListItem[]>([]);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [usedHints, setUsedHints] = useState<Record<HintKey, boolean>>({ type: false, letter: false, fifty: false });
  const [visibleHints, setVisibleHints] = useState<Record<'type' | 'letter', boolean>>({ type: false, letter: false });
  const [stats, setStats] = useState<ChallengeStats>(() => getStoredStats());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getStoredLeaderboard());
  const [sfxEnabled, setSfxEnabled] = useState(() => window.localStorage.getItem(MASTER_SFX_KEY) !== 'off');
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const answeredRef = useRef(false);
  const deadlineRef = useRef(0);

  const accuracy = stats.totalAnswers ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;
  const level = getLevel(stats.xp);
  const rank = getRank(stats.xp);
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / ROUND_SECONDS) * 100));
  const imageUrl = roundState ? getArtwork(roundState.target) : null;
  const targetTypes = roundState?.target.types.map((entry) => formatName(entry.type.name)).join(' / ') || '';

  const visibleChoices = useMemo(() => {
    if (!roundState) return [];
    return roundState.choices.filter((choice) => !roundState.hiddenChoiceNames.includes(choice.name));
  }, [roundState]);

  useEffect(() => {
    window.localStorage.setItem(MASTER_STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    window.localStorage.setItem(MASTER_LEADERBOARD_KEY, JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    window.localStorage.setItem(MASTER_SFX_KEY, sfxEnabled ? 'on' : 'off');
  }, [sfxEnabled]);

  useEffect(() => {
    if (status !== 'playing') return;

    deadlineRef.current = Date.now() + ROUND_SECONDS * 1000;
    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setTimeLeft(remaining);

      if (remaining <= 0 && !answeredRef.current) {
        answeredRef.current = true;
        handleAnswer(null);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [status, round]);

  const playTone = (kind: 'correct' | 'wrong' | 'hint' | 'finish') => {
    if (!sfxEnabled) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = audioContextRef.current || new AudioContextClass();
    audioContextRef.current = context;
    void context.resume();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const frequencies = {
      correct: [523.25, 659.25],
      wrong: [220, 146.83],
      hint: [392, 493.88],
      finish: [659.25, 783.99],
    };

    oscillator.type = kind === 'wrong' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(frequencies[kind][0], now);
    oscillator.frequency.exponentialRampToValueAtTime(frequencies[kind][1], now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
  };

  const loadPokemonPool = async () => {
    if (pokemonPool.length) return pokemonPool;

    const response = await fetch(`${BASE_URL}/pokemon?limit=500`);
    if (!response.ok) {
      throw new Error('Unable to load Pokemon roster.');
    }

    const data = (await response.json()) as { results: PokemonListItem[] };
    setPokemonPool(data.results);
    return data.results;
  };

  const fetchPokemonDetail = async (id: number) => {
    const response = await fetch(`${BASE_URL}/pokemon/${id}`);
    if (!response.ok) {
      throw new Error('Unable to load Pokemon details.');
    }

    return (await response.json()) as PokemonDetail;
  };

  const getDifficultyPool = (roundNumber: number) => {
    if (roundNumber <= 3) return popularPokemonIds;
    if (roundNumber <= 7) return skilledPokemonIds;
    return rarePokemonIds;
  };

  const prepareRound = async (roundNumber: number) => {
    setStatus('loading');
    setError(null);
    setSelectedName(null);
    setFeedback('');
    setVisibleHints({ type: false, letter: false });
    answeredRef.current = false;

    try {
      const pool = await loadPokemonPool();
      const targetId = pickRandom(getDifficultyPool(roundNumber));
      const target = await fetchPokemonDetail(targetId);
      const decoys = shuffle(pool.filter((pokemon) => pokemon.name !== target.name)).slice(0, 3);
      const answer = pool.find((pokemon) => pokemon.name === target.name) || {
        name: target.name,
        url: `${BASE_URL}/pokemon/${target.id}/`,
      };

      setRoundState({
        target,
        choices: shuffle([answer, ...decoys]),
        hiddenChoiceNames: [],
      });
      setTimeLeft(ROUND_SECONDS);
      setStatus('playing');

      window.setTimeout(() => {
        if (!imageRef.current) return;
        gsap.fromTo(
          imageRef.current,
          { scale: 0.86, opacity: 0, filter: 'brightness(0) blur(8px)' },
          { scale: 1, opacity: 1, filter: 'brightness(0) blur(0px)', duration: 0.45, ease: 'back.out(1.8)' }
        );
      }, 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to start challenge.');
      setStatus('idle');
    }
  };

  const startGame = () => {
    setRound(1);
    setLives(3);
    setScore(0);
    setRoundCorrect(0);
    setUsedHints({ type: false, letter: false, fifty: false });
    void prepareRound(1);
  };

  const finishGame = (finalScore: number, correctCount: number) => {
    const earnedXp = Math.max(40, Math.round(finalScore * 0.45 + correctCount * 25));
    const entry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      score: finalScore,
      correct: correctCount,
      date: new Date().toLocaleDateString(),
    };

    setStats((currentStats) => ({
      gamesPlayed: currentStats.gamesPlayed + 1,
      correctAnswers: currentStats.correctAnswers + correctCount,
      totalAnswers: currentStats.totalAnswers + TOTAL_ROUNDS,
      highestScore: Math.max(currentStats.highestScore, finalScore),
      currentStreak: correctCount === TOTAL_ROUNDS ? currentStats.currentStreak + 1 : 0,
      longestStreak: Math.max(currentStats.longestStreak, correctCount === TOTAL_ROUNDS ? currentStats.currentStreak + 1 : currentStats.currentStreak),
      xp: currentStats.xp + earnedXp,
    }));
    setLeaderboard((currentLeaderboard) => [entry, ...currentLeaderboard].sort((a, b) => b.score - a.score).slice(0, 10));
    setFeedback(`Challenge complete. You earned ${earnedXp} XP.`);
    setStatus('game-over');
    playTone('finish');
  };

  function handleAnswer(answerName: string | null) {
    if (!roundState || status !== 'playing') return;

    answeredRef.current = true;
    const isCorrect = answerName === roundState.target.name;
    const nextCorrect = roundCorrect + (isCorrect ? 1 : 0);
    const nextLives = lives - (isCorrect ? 0 : 1);
    const speedBonus = Math.ceil(timeLeft * 8);
    const roundPoints = isCorrect ? 100 + speedBonus + round * 15 : 0;
    const nextScore = score + roundPoints;

    setSelectedName(answerName);
    setStatus('feedback');
    setFeedback(
      isCorrect
        ? `Correct! +${roundPoints} points with ${Math.ceil(timeLeft)}s left.`
        : `Wrong. It was ${formatName(roundState.target.name)}.`
    );
    setScore(nextScore);
    setRoundCorrect(nextCorrect);
    setLives(nextLives);
    playTone(isCorrect ? 'correct' : 'wrong');

    if (imageRef.current) {
      gsap.to(imageRef.current, { filter: 'brightness(1)', scale: 1.08, duration: 0.3, ease: 'power2.out' });
    }

    if (arenaRef.current) {
      if (isCorrect) {
        gsap.fromTo(arenaRef.current, { boxShadow: '0 0 0 rgb(var(--color-accent-rgb) / 0)' }, { boxShadow: '0 0 90px rgb(var(--color-accent-rgb) / 0.35)', duration: 0.28, yoyo: true, repeat: 1 });
      } else {
        gsap.fromTo(arenaRef.current, { x: -9 }, { x: 0, duration: 0.34, ease: 'elastic.out(1, 0.4)', clearProps: 'transform' });
      }
    }

    window.setTimeout(() => {
      if (nextLives <= 0 || round >= TOTAL_ROUNDS) {
        finishGame(nextScore, nextCorrect);
        return;
      }

      const nextRound = round + 1;
      setRound(nextRound);
      void prepareRound(nextRound);
    }, 1400);
  }

  const useHint = (hint: HintKey) => {
    if (!roundState || status !== 'playing' || usedHints[hint]) return;

    setUsedHints((currentHints) => ({ ...currentHints, [hint]: true }));
    playTone('hint');

    if (hint === 'type' || hint === 'letter') {
      setVisibleHints((currentHints) => ({ ...currentHints, [hint]: true }));
      return;
    }

    const wrongChoices = roundState.choices.filter((choice) => choice.name !== roundState.target.name);
    setRoundState({
      ...roundState,
      hiddenChoiceNames: shuffle(wrongChoices).slice(0, 2).map((choice) => choice.name),
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-[0.24em] text-poke">Pokemon Master Challenge</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Identify the silhouette. Beat the clock.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Ten rounds, three lives, one shot at becoming a Pokemon Master. Early picks are familiar. Later rounds summon rare and legendary Pokemon.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center md:w-auto md:min-w-[280px]">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Level</p>
            <p className="mt-1 text-2xl font-semibold text-poke">{level}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rank</p>
            <p className="mt-1 text-sm font-semibold text-white">{rank}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <div ref={arenaRef} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                Round {status === 'idle' ? 0 : round} / {TOTAL_ROUNDS}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Score {score}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 w-8 rounded-full ${index < lives ? 'bg-poke shadow-glow' : 'bg-white/10'}`}
                  aria-label={index < lives ? 'Life remaining' : 'Life lost'}
                />
              ))}
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-poke to-pokeSoft transition-[width] duration-100" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-night/90 p-6">
            {imageUrl ? (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Mystery Pokemon silhouette"
                className="h-56 w-56 object-contain drop-shadow-[0_30px_80px_rgb(var(--color-accent-rgb)_/_0.28)] sm:h-72 sm:w-72"
                style={{ filter: status === 'feedback' || status === 'game-over' ? 'brightness(1)' : 'brightness(0)' }}
              />
            ) : (
              <div className="text-center text-slate-400">
                <p className="text-lg font-semibold text-white">Ready for the challenge?</p>
                <p className="mt-2 text-sm">Start a game to load real Pokemon from PokéAPI.</p>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {visibleChoices.map((choice) => {
              const isTarget = roundState?.target.name === choice.name;
              const isSelected = selectedName === choice.name;
              const shouldReveal = status === 'feedback' || status === 'game-over';

              return (
                <button
                  key={choice.name}
                  type="button"
                  onClick={() => handleAnswer(choice.name)}
                  disabled={status !== 'playing'}
                  className={`rounded-2xl border px-5 py-4 text-left text-sm font-semibold capitalize transition hover:border-poke/40 hover:bg-white/10 disabled:cursor-not-allowed ${
                    shouldReveal && isTarget
                      ? 'border-poke/70 bg-poke/15 text-poke'
                      : shouldReveal && isSelected
                        ? 'border-red-500/50 bg-red-500/10 text-red-100'
                        : 'border-white/10 bg-night/80 text-white'
                  }`}
                >
                  {formatName(choice.name)}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-6 text-sm text-slate-300">{feedback || (error ?? 'Use hints carefully. Each one works once per game.')}</p>
            <button
              type="button"
              onClick={startGame}
              disabled={status === 'loading' || status === 'playing' || status === 'feedback'}
              className="rounded-full bg-poke px-6 py-3 text-sm font-semibold text-white transition hover:bg-pokeSoft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
            >
              {status === 'game-over' ? 'Play Again' : status === 'idle' ? 'Start Challenge' : 'Loading...'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Hints</h2>
              <button
                type="button"
                onClick={() => setSfxEnabled((currentValue) => !currentValue)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  sfxEnabled ? 'border-poke/40 bg-poke/15 text-poke' : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                SFX {sfxEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={() => useHint('type')} disabled={usedHints.type || status !== 'playing'} className="rounded-2xl border border-white/10 bg-night/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-poke/40 disabled:cursor-not-allowed disabled:text-slate-600">
                Reveal type {visibleHints.type && targetTypes ? `- ${targetTypes}` : ''}
              </button>
              <button type="button" onClick={() => useHint('letter')} disabled={usedHints.letter || status !== 'playing'} className="rounded-2xl border border-white/10 bg-night/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-poke/40 disabled:cursor-not-allowed disabled:text-slate-600">
                Reveal first letter {visibleHints.letter && roundState ? `- ${roundState.target.name[0].toUpperCase()}` : ''}
              </button>
              <button type="button" onClick={() => useHint('fifty')} disabled={usedHints.fifty || status !== 'playing'} className="rounded-2xl border border-white/10 bg-night/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-poke/40 disabled:cursor-not-allowed disabled:text-slate-600">
                50/50 remove two wrong answers
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Trainer Stats</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ['Games Played', stats.gamesPlayed],
                ['Correct Answers', stats.correctAnswers],
                ['Accuracy', `${accuracy}%`],
                ['Highest Score', stats.highestScore],
                ['Current Streak', stats.currentStreak],
                ['Longest Streak', stats.longestStreak],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-night/80 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Local Leaderboard</h2>
            <div className="mt-5 space-y-3">
              {leaderboard.length ? (
                leaderboard.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl bg-night/80 px-4 py-3 text-sm">
                    <span className="font-semibold text-poke">#{index + 1}</span>
                    <span className="flex-1 text-slate-300">{entry.correct}/{TOTAL_ROUNDS} correct</span>
                    <span className="font-semibold text-white">{entry.score}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-night/80 px-4 py-3 text-sm text-slate-500">No scores yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MasterChallenge;
