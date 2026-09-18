import { OptimizationHistoryItem, OptimizeRequest, OptimizeResponse } from '../types';

const HISTORY_KEY = 'gridwise_optimization_history';
const MAX_HISTORY_ITEMS = 20;

export function loadHistory(): OptimizationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistoryItem(
  request: OptimizeRequest,
  response: OptimizeResponse
): OptimizationHistoryItem[] {
  try {
    const history = loadHistory();
    const newItem: OptimizationHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      scenario_id: response.scenario_id,
      total_cost_bdt: response.total_cost_bdt,
      total_grid_kwh: response.total_grid_kwh,
      peak_grid_kwh: response.peak_grid_kwh,
      request,
      response,
    };
    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return loadHistory();
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore storage errors
  }
}
