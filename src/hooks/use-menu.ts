import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBase } from '@/lib/api-utils';
import type { MenuItem } from '@/lib/menu-api-contract';

const API_URL = getApiBase('menu');

export function useMenu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<MenuItem[]>(API_URL);
        setMenu(res.data);
      } catch (err) {
        console.error('[useMenu]: Failed to fetch menu', err);
        setMenu([]);
        setError('Could not load menu. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  return { menu, loading, error };
}
