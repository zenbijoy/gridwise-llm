import { OptimizeRequest, OptimizeResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export interface ApiError extends Error {
  status?: number;
  retryAfter?: number;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function checkReady(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/ready`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ready';
  } catch {
    return false;
  }
}

export async function optimizeEnergy(request: OptimizeRequest): Promise<OptimizeResponse> {
  const requestId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const res = await fetch(`${API_BASE_URL}/optimize-energy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(request),
    });

    if (res.ok) {
      return (await res.json()) as OptimizeResponse;
    }

    const err: ApiError = new Error();
    err.status = res.status;

    if (res.status === 429) {
      const retryHeader = res.headers.get('Retry-After');
      const retrySeconds = retryHeader ? parseInt(retryHeader, 10) : 60;
      err.retryAfter = retrySeconds;
      err.message = `Rate limit reached. Please wait ${retrySeconds} seconds before optimizing again.`;
      throw err;
    }

    if (res.status === 400) {
      try {
        const data = await res.json();
        err.message = data.detail || 'The request inputs were invalid. Please review your scenario configuration.';
      } catch {
        err.message = 'Invalid scenario parameters or formatting.';
      }
      throw err;
    }

    if (res.status === 413) {
      err.message = 'The scenario payload is too large. Please shorten operator notes or scenario data.';
      throw err;
    }

    if (res.status === 500) {
      err.message = 'The optimization service could not produce a verified plan. Please review your constraints and try again.';
      throw err;
    }

    err.message = `Unexpected error from optimization server (HTTP ${res.status}).`;
    throw err;
  } catch (error: unknown) {
    if ((error as ApiError).status) {
      throw error;
    }
    const netErr: ApiError = new Error(
      'Unable to connect to the GridWise backend server. Please verify the service is running.'
    );
    netErr.status = 0;
    throw netErr;
  }
}
