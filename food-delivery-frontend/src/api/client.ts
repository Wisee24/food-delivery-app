const TOKEN_STORAGE_KEY = 'fd_jwt_token';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures in restricted contexts
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token, skipAuth = false, signal } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const resolvedToken = skipAuth ? null : (token ?? getStoredToken());
  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      0,
      'Unable to reach the backend server at ' +
        `${API_BASE_URL}. Please ensure Spring Boot is running on port 8080.`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  let parsed: unknown = undefined;

  if (text && contentType.includes('application/json')) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  } else if (text) {
    parsed = text;
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuth && unauthorizedHandler) {
      unauthorizedHandler();
    }

    const message = extractErrorMessage(response.status, parsed);
    throw new ApiError(response.status, message, parsed);
  }

  return parsed as T;
}

function extractErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg;
    }
  }

  switch (status) {
    case 400:
      return 'Invalid request. Please check your input values.';
    case 401:
      return 'Your session has expired or the credentials are invalid.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred with the current resource state.';
    default:
      return `Request failed with status ${status}.`;
  }
}
