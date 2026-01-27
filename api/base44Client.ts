type Base44Config = {
  appId: string;
  apiKey: string;
  baseUrl?: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
};

type FetchWithRetryOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
  cacheKey?: string;
  cacheTtlMs?: number;
  allowStaleCacheOnError?: boolean;
};

const defaultConfig: Base44Config = {
  appId: '6961ebcfbe883da86dc6fdf4',
  apiKey: 'f43b4814922c4edfbd4ad2a9e662977c',
  baseUrl: 'https://app.base44.com/api/apps',
  requestTimeoutMs: 15000,
  maxRetries: 2
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowMs() {
  return Date.now();
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getCache<T>(key: string): { value: T; storedAt: number } | null {
  return safeJsonParse<{ value: T; storedAt: number }>(localStorage.getItem(key));
}

function setCache<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify({ value, storedAt: nowMs() }));
}

function clearEntityCaches(entityName: string) {
  const prefix = `planetiaOS_cache:${entityName}:`;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

async function fetchWithRetry<T>(
  url: string,
  cfg: Base44Config,
  opts: FetchWithRetryOptions = {}
): Promise<T> {
  const method = opts.method ?? 'GET';
  const timeoutMs = opts.timeoutMs ?? cfg.requestTimeoutMs ?? 15000;
  const retries = opts.retries ?? cfg.maxRetries ?? 2;
  const retryDelayMs = opts.retryDelayMs ?? 600;

  const cacheKey = opts.cacheKey;
  const cacheTtlMs = opts.cacheTtlMs ?? 5 * 60 * 1000;
  const allowStaleCacheOnError = opts.allowStaleCacheOnError ?? true;

  const cached = cacheKey ? getCache<T>(cacheKey) : null;
  const cacheIsFresh = cached ? nowMs() - cached.storedAt <= cacheTtlMs : false;
  if (cached && cacheIsFresh) {
    return cached.value;
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          api_key: cfg.apiKey,
          'Content-Type': 'application/json',
          ...(opts.headers ?? {})
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Base44 HTTP ${res.status}: ${text}`);
      }

      const data = (await res.json()) as T;
      if (cacheKey) setCache(cacheKey, data);
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (cached && allowStaleCacheOnError) {
    return cached.value;
  }

  throw lastErr;
}

function createClient(config?: Partial<Base44Config>) {
  const cfg: Base44Config = { ...defaultConfig, ...(config ?? {}) };

  const entityUrl = (entityName: string, id?: string) =>
    `${cfg.baseUrl}/${cfg.appId}/entities/${entityName}${id ? `/${id}` : ''}`;

  const entities = {
    TrashReport: createEntityApi('TrashReport'),
    FloodReport: createEntityApi('FloodReport'),
    FarmReport: createEntityApi('FarmReport'),
    UserProgress: createEntityApi('UserProgress')
  } as const;

  function createEntityApi(entityName: string) {
    return {
      async list() {
        return fetchWithRetry<any[]>(entityUrl(entityName), cfg, {
          cacheKey: `planetiaOS_cache:${entityName}:list`,
          cacheTtlMs: 60_000
        });
      },
      async filter(filterObj: Record<string, any> = {}, sort?: string, limit?: number) {
        const all = await fetchWithRetry<any[]>(entityUrl(entityName), cfg, {
          cacheKey: `planetiaOS_cache:${entityName}:filter:${JSON.stringify({ filterObj, sort, limit })}`,
          cacheTtlMs: 60_000
        });

        let out = all;
        for (const [k, v] of Object.entries(filterObj)) {
          out = out.filter((row) => {
            const value = (row as any)?.[k];
            if (typeof v === 'object' && v !== null) {
              return JSON.stringify(value) === JSON.stringify(v);
            }
            return value === v;
          });
        }

        if (sort) {
          const isDesc = sort.startsWith('-');
          const key = isDesc ? sort.slice(1) : sort;
          out = [...out].sort((a, b) => {
            const av = (a as any)?.[key];
            const bv = (b as any)?.[key];
            if (av === bv) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return isDesc ? (av < bv ? 1 : -1) : (av < bv ? -1 : 1);
          });
        }

        if (typeof limit === 'number') out = out.slice(0, limit);
        return out;
      },
      async create(payload: Record<string, any>) {
        const created = await fetchWithRetry<any>(entityUrl(entityName), cfg, {
          method: 'POST',
          body: payload
        });
        clearEntityCaches(entityName);
        return created;
      },
      async update(id: string, payload: Record<string, any>) {
        const updated = await fetchWithRetry<any>(entityUrl(entityName, id), cfg, {
          method: 'PUT',
          body: payload
        });
        clearEntityCaches(entityName);
        return updated;
      }
    };
  }

  const auth = {
    async me() {
      const stored = safeJsonParse<{ email?: string }>(localStorage.getItem('planetiaOS_user'));
      return stored?.email ? { email: stored.email } : { email: 'demo@planetiaos.local' };
    },
    logout() {
      localStorage.removeItem('planetiaOS_user');
    }
  };

  const integrations = {
    Core: {
      async UploadFile({ file }: { file: File }) {
        const file_url = URL.createObjectURL(file);
        return { file_url };
      },
      async InvokeLLM(_: any) {
        return {
          properly_disposed: true,
          items_count: 3,
          item_types: ['plastic', 'paper'],
          feedback: 'Looks properly disposed in a bin. Great job!',
          points_awarded: 6
        };
      }
    }
  };

  return { auth, entities, integrations, _config: cfg };
}

export const base44 = createClient();
