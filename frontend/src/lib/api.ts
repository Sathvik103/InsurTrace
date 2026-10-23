/**
 * VeriSure API client.
 *
 * - Resolves the backend base URL from NEXT_PUBLIC_API_URL (baked in at build time).
 *   A production build without it does NOT silently call localhost; requests
 *   fail with a `config` error the UI can explain.
 * - Attaches the signed-in user's bearer token (Supabase session or demo persona).
 * - Normalises every failure into an ApiError with a kind the UI can act on.
 */

import { getAuthToken, supabase } from '@/lib/supabase';

const configuredBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') || '';
const isProductionBuild = process.env.NODE_ENV === 'production';

export const API_BASE_URL = configuredBase || (isProductionBuild ? '' : 'http://localhost:8000');
export const API_CONFIGURED = Boolean(API_BASE_URL);

export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export type ApiErrorKind = 'config' | 'network' | 'timeout' | 'auth' | 'forbidden' | 'not_found' | 'validation' | 'rate_limited' | 'server';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  detail?: string;
  requestId?: string;

  constructor(kind: ApiErrorKind, message: string, opts: { status?: number; detail?: string; requestId?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = opts.status;
    this.detail = opts.detail;
    this.requestId = opts.requestId;
  }
}

/** Plain-language explanation for an API failure, suitable for end users. */
export function describeApiError(err: unknown): { title: string; message: string; retryable: boolean } {
  if (!(err instanceof ApiError)) {
    return { title: 'Something went wrong', message: 'An unexpected error occurred. Please try again.', retryable: true };
  }
  switch (err.kind) {
    case 'config':
      return {
        title: 'Backend not configured',
        message: 'This deployment is not connected to the VeriSure API, so calculations, saving and other server features are unavailable.',
        retryable: false,
      };
    case 'network':
      return {
        title: 'Cannot reach the VeriSure server',
        message: 'The server could not be reached. Check your connection; if the server was idle it may take up to a minute to wake up.',
        retryable: true,
      };
    case 'timeout':
      return {
        title: 'The server is taking too long',
        message: 'The request timed out. The server may be starting up. Please try again in a moment.',
        retryable: true,
      };
    case 'auth':
      return { title: 'Please sign in again', message: err.detail || 'Your session has expired.', retryable: false };
    case 'forbidden':
      return { title: 'Not permitted', message: err.detail || 'Your account does not have access to this action.', retryable: false };
    case 'not_found':
      return { title: 'Not found', message: err.detail || 'The record could not be found or you do not have access to it.', retryable: false };
    case 'validation':
      return { title: 'Please check your details', message: err.detail || 'Some of the information provided is invalid.', retryable: false };
    case 'rate_limited':
      return { title: 'Too many requests', message: 'Please wait a moment before trying again.', retryable: true };
    default:
      return {
        title: 'Server error',
        message: `The server could not complete this request.${err.requestId ? ` Reference: ${err.requestId}` : ''}`,
        retryable: true,
      };
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409 || status === 413 || status === 415 || status === 422 || status === 400) return 'validation';
  if (status === 429) return 'rate_limited';
  return 'server';
}

function formatDetail(detail: unknown): string | undefined {
  if (!detail) return undefined;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors: [{ loc, msg }]
    return detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : String(d)))
      .join('; ');
  }
  return undefined;
}

async function resolveToken(): Promise<string | null> {
  const stored = getAuthToken();
  if (stored?.startsWith('dev-')) return stored;
  try {
    // Returns a refreshed access token when the stored one has expired.
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || stored;
  } catch {
    return stored;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** JSON body (serialised automatically) or FormData. */
  body?: unknown;
  /** Milliseconds before the request is aborted. Default 30s (free-tier hosts can cold-start slowly). */
  timeoutMs?: number;
  /** Send without the Authorization header. */
  anonymous?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_CONFIGURED) {
    throw new ApiError('config', 'NEXT_PUBLIC_API_URL is not configured for this build.');
  }
  const { body, timeoutMs = 30000, anonymous, headers, signal, ...rest } = options;
  const finalHeaders = new Headers(headers);
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }
  if (!anonymous) {
    const token = await resolveToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort(signal.reason));

  let res: Response;
  try {
    res = await fetch(getApiEndpoint(path), { ...rest, headers: finalHeaders, body: payload, signal: controller.signal });
  } catch (e) {
    if (controller.signal.aborted && controller.signal.reason === 'timeout') {
      throw new ApiError('timeout', `Request to ${path} timed out`);
    }
    if (signal?.aborted) throw e;
    throw new ApiError('network', `Network request to ${path} failed`);
  } finally {
    clearTimeout(timer);
  }

  const requestId = res.headers.get('x-request-id') || undefined;
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail = formatDetail(data && typeof data === 'object' ? (data as { detail?: unknown }).detail : undefined);
    throw new ApiError(kindForStatus(res.status), detail || `HTTP ${res.status}`, { status: res.status, detail, requestId });
  }
  return data as T;
}
