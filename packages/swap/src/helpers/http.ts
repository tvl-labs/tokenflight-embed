/**
 * Lightweight HTTP client (~1 KB minified) with ky-compatible API.
 *
 * Usage:
 *   const api = createHttp({ prefixUrl: 'https://api.example.com', timeout: 10000 });
 *   const data = await api.get('users', { searchParams: { page: '1' } }).json<User[]>();
 *   const user = await api.post('users', { json: { name: 'Jo' } }).json<User>();
 *   const raw  = await api.get('stream', { timeout: false }); // raw Response
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class HTTPError extends Error {
  readonly response: Response;
  constructor(response: Response) {
    super(`Request failed with status ${response.status} ${response.statusText}`);
    this.name = "HTTPError";
    this.response = response;
  }
}

export class TimeoutError extends Error {
  constructor(url: string) {
    super(`Request to ${url} timed out`);
    this.name = "TimeoutError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HttpOptions {
  prefixUrl?: string;
  timeout?: number | false;
  retry?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  json?: unknown;
  searchParams?: Record<string, string> | URLSearchParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number | false;
}

/** A thenable that also exposes `.json<T>()` and `.text()` shorthand. */
export interface ResponsePromise extends PromiseLike<Response> {
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function buildUrl(base: string | undefined, path: string, searchParams?: Record<string, string> | URLSearchParams): string {
  let url = base ? `${base}/${path}` : path;

  if (searchParams) {
    const params =
      searchParams instanceof URLSearchParams
        ? searchParams
        : new URLSearchParams(searchParams);
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  return url;
}

const RETRY_STATUS = new Set([408, 413, 429, 500, 502, 503, 504]);

async function execute(
  url: string,
  method: string,
  opts: RequestOptions | undefined,
  defaults: HttpOptions,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...defaults.headers,
    ...opts?.headers,
  };

  let body: string | undefined;
  if (opts?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }

  const timeoutMs =
    opts?.timeout !== undefined ? opts.timeout : defaults.timeout;

  const maxAttempts = (defaults.retry ?? 0) + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let controller: AbortController | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs && !opts?.signal) {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller!.abort(), timeoutMs);
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: opts?.signal ?? controller?.signal,
      });

      if (!response.ok) {
        if (attempt < maxAttempts - 1 && RETRY_STATUS.has(response.status)) {
          continue;
        }
        throw new HTTPError(response);
      }

      return response;
    } catch (err) {
      if (err instanceof HTTPError) throw err;

      if (
        err instanceof DOMException &&
        err.name === "AbortError" &&
        !opts?.signal
      ) {
        throw new TimeoutError(url);
      }

      // Network errors: retry if attempts remain
      if (attempt < maxAttempts - 1) continue;
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // Unreachable, but satisfies TypeScript
  throw new Error("Unreachable");
}

function makeResponsePromise(
  method: string,
  path: string,
  opts: RequestOptions | undefined,
  defaults: HttpOptions,
): ResponsePromise {
  const url = buildUrl(defaults.prefixUrl, path, opts?.searchParams);

  // Lazy: only start the fetch when someone awaits or calls .json()/.text()
  let pending: Promise<Response> | undefined;
  const getResponse = () => (pending ??= execute(url, method, opts, defaults));

  return {
    then(onfulfilled, onrejected) {
      return getResponse().then(onfulfilled, onrejected);
    },
    json<T>() {
      return getResponse().then((r) => r.json() as Promise<T>);
    },
    text() {
      return getResponse().then((r) => r.text());
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface HttpInstance {
  get(path: string, opts?: RequestOptions): ResponsePromise;
  post(path: string, opts?: RequestOptions): ResponsePromise;
  put(path: string, opts?: RequestOptions): ResponsePromise;
  patch(path: string, opts?: RequestOptions): ResponsePromise;
  delete(path: string, opts?: RequestOptions): ResponsePromise;
  extend(overrides: Partial<HttpOptions>): HttpInstance;
}

export function createHttp(options: HttpOptions = {}): HttpInstance {
  const defaults: HttpOptions = {
    prefixUrl: options.prefixUrl?.replace(/\/$/, ""),
    timeout: options.timeout ?? 10000,
    retry: options.retry ?? 0,
    headers: options.headers,
  };

  return {
    get: (p, o) => makeResponsePromise("GET", p, o, defaults),
    post: (p, o) => makeResponsePromise("POST", p, o, defaults),
    put: (p, o) => makeResponsePromise("PUT", p, o, defaults),
    patch: (p, o) => makeResponsePromise("PATCH", p, o, defaults),
    delete: (p, o) => makeResponsePromise("DELETE", p, o, defaults),
    extend(overrides) {
      return createHttp({
        ...defaults,
        ...overrides,
        headers: { ...defaults.headers, ...overrides.headers },
      });
    },
  };
}
