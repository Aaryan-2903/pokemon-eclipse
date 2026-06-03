import { useEffect, useRef, useState } from 'react';

const BASE_URL = 'https://pokeapi.co/api/v2';

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    other: {
      'official-artwork': {
        front_default: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
}

interface PokemonListItem {
  name: string;
  url: string;
}

function usePokemonSearch(query: string) {
  const [list, setList] = useState<PokemonListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [results, setResults] = useState<PokemonDetail[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [errorResults, setErrorResults] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, PokemonDetail>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingList(true);
    setErrorList(null);

    fetch(`${BASE_URL}/pokemon?limit=1200`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch Pokédex list.');
        }
        return response.json();
      })
      .then((data) => setList(data.results || []))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setErrorList(error.message || 'Failed to load Pokédex list.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingList(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!list.length) {
      setResults([]);
      return;
    }

    const filter = query.trim().toLowerCase();
    const selectedNames = list
      .filter((pokemon) => pokemon.name.includes(filter))
      .slice(0, 12)
      .map((pokemon) => pokemon.name);

    if (!selectedNames.length) {
      setResults([]);
      setLoadingResults(false);
      setErrorResults(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingResults(true);
    setErrorResults(null);

    Promise.all(
      selectedNames.map(async (name) => {
        const cached = cacheRef.current.get(name);
        if (cached) {
          return cached;
        }

        const response = await fetch(`${BASE_URL}/pokemon/${name}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load Pokémon ${name}.`);
        }

        const data = (await response.json()) as PokemonDetail;
        cacheRef.current.set(name, data);
        return data;
      })
    )
      .then((pokemonList) => {
        if (!controller.signal.aborted) {
          setResults(pokemonList);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setErrorResults(error.message || 'Failed to load Pokémon details.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingResults(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [query, list]);

  return {
    results,
    loadingList,
    errorList,
    loadingResults,
    errorResults,
  };
}

export default usePokemonSearch;
