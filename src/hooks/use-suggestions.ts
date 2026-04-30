import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBase } from '@/lib/api-utils';
import type { Suggestion } from '@/lib/menu-api-contract';

const API_URL = getApiBase('menu/suggestions');

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<Suggestion[]>(API_URL);
        setSuggestions(res.data);
      } catch (err) {
        console.error('[useSuggestions]: Failed to fetch suggestions', err);
        setSuggestions([]);
        setError('Could not load smart suggestions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  return { suggestions, loading, error };
}
