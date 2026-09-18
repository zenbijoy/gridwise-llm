import { useEffect, useState, useCallback } from 'react';
import { checkHealth } from '../services/api';
import { HealthState } from '../types';

export function useHealthCheck(intervalMs: number = 20000) {
  const [status, setStatus] = useState<HealthState>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const poll = useCallback(async () => {
    const isOk = await checkHealth();
    setStatus(isOk ? 'online' : 'offline');
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs]);

  return { status, lastChecked, refresh: poll };
}
