/**
 * DataCache Engine
 * Universal Browser Compatibility (Chrome, Firefox, Safari, Edge, Brave, Opera, Mobile)
 * Safe Storage + Dual Fetch (/api/data -> /data/*.json fallback) + Stale-While-Revalidate
 */

export interface VersionInfo {
  version: string;
  updatedAt: string;
  versions: Record<string, string>;
}

type Listener = (data: any) => void;

function safeStorageGet(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch (e) {
    // Privacy modes / cookies blocked in Safari, Brave, Firefox
  }
  return null;
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    // Storage blocked / quota exceeded
  }
}

function safeStorageRemove(key: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (e) {}
}

class DataCacheService {
  public cache: Map<string, any> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();
  private versionInfo: VersionInfo | null = null;
  private isCheckingVersion = false;

  constructor() {
    this.initVersionCheck();
  }

  /**
   * Dual fetch attempt with automatic fallback from /api/data/:key to /data/:key.json
   */
  private async fetchRemoteData(key: string): Promise<any | null> {
    const timestamp = Date.now();
    const fetchOptions: RequestInit = {
      cache: "no-cache",
      headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" }
    };

    // Endpoint 1: Server API
    try {
      const res = await fetch(`/api/data/${key}?t=${timestamp}`, fetchOptions);
      if (res.ok) {
        const json = await res.json();
        if (json !== null && json !== undefined) return json;
      }
    } catch (e) {
      // Server API error or offline
    }

    // Endpoint 2: Static Public JSON fallback
    try {
      const res = await fetch(`/data/${key}.json?t=${timestamp}`, fetchOptions);
      if (res.ok) {
        const json = await res.json();
        if (json !== null && json !== undefined) return json;
      }
    } catch (e) {
      // Static file fetch failed
    }

    return null;
  }

  /**
   * Initializes and checks version.json against local storage
   */
  async initVersionCheck(): Promise<VersionInfo | null> {
    if (this.isCheckingVersion) return this.versionInfo;
    this.isCheckingVersion = true;

    try {
      let latestVersion: VersionInfo | null = null;
      const res = await fetch(`/api/version?t=${Date.now()}`).catch(() => null);
      if (res && res.ok) {
        latestVersion = await res.json();
      } else {
        const resStatic = await fetch(`/data/version.json?t=${Date.now()}`).catch(() => null);
        if (resStatic && resStatic.ok) {
          latestVersion = await resStatic.json();
        }
      }

      if (latestVersion) {
        const storedVersionStr = safeStorageGet("app_data_version_info");
        const storedVersionInfo: VersionInfo | null = storedVersionStr ? JSON.parse(storedVersionStr) : null;

        this.versionInfo = latestVersion;
        safeStorageSet("app_data_version_info", JSON.stringify(latestVersion));

        if (storedVersionInfo && storedVersionInfo.versions) {
          // Keep local cache intact for smooth offline & refresh persistence, revalidate in background
          for (const key of Object.keys(latestVersion.versions)) {
            const newVer = latestVersion.versions[key];
            const oldVer = storedVersionInfo.versions[key];
            if (newVer !== oldVer) {
              // Delete both memory and localStorage cache so fresh data is fetched immediately
              this.cache.delete(key);
              safeStorageRemove(`cached_json_${key}`);
              if (key === "settings") safeStorageRemove("cached_logo_settings");
              if (key === "nav") safeStorageRemove("cached_nav_links");
              if (key === "downloads") safeStorageRemove("cached_downloads");

              // Immediately fetch remote data for updated key
              this.fetchRemoteData(key).then(remote => {
                if (remote !== null && remote !== undefined) {
                  this.setLocalData(key, remote);
                }
              });
            }
          }
        }
      }
    } catch (err) {
      // Silent error handler for privacy blocked environments
    } finally {
      this.isCheckingVersion = false;
    }
    return this.versionInfo;
  }

  /**
   * Universal Data Loading (Stale-While-Revalidate):
   * 1. Check in-memory or safe LocalStorage cache.
   * 2. If no cache, fetch directly from server/JSON immediately.
   * 3. If cache exists, return it instantly AND trigger a background revalidation.
   * 4. Update memory & safe storage and notify active UI subscribers on changes.
   */
  async getData<T>(key: string, defaultValue: T): Promise<T> {
    let result = defaultValue;
    let hasMemoryOrStorageCache = false;

    // 1. In-memory
    if (this.cache.has(key)) {
      result = this.cache.get(key) as T;
      hasMemoryOrStorageCache = true;
    } else {
      // 2. Safe LocalStorage
      const cached = safeStorageGet(`cached_json_${key}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed !== null && parsed !== undefined) {
            this.cache.set(key, parsed);
            result = parsed as T;
            hasMemoryOrStorageCache = true;
          }
        } catch (e) {}
      }
    }

    if (!hasMemoryOrStorageCache) {
      // Synchronous fetch on first load
      const remote = await this.fetchRemoteData(key);
      if (remote !== null && remote !== undefined) {
        result = remote as T;
        this.setLocalData(key, remote);
      } else {
        this.cache.set(key, defaultValue);
      }
    } else {
      // Background revalidation (Stale-While-Revalidate)
      this.fetchRemoteData(key).then((remote) => {
        if (remote !== null && remote !== undefined) {
          if (JSON.stringify(remote) !== JSON.stringify(this.cache.get(key))) {
            this.setLocalData(key, remote);
          }
        }
      });
    }

    return result;
  }

  /**
   * Sets data locally, updating memory, safe LocalStorage, and notifying active listeners
   */
  setLocalData(key: string, data: any) {
    this.cache.set(key, data);
    const jsonStr = JSON.stringify(data);
    safeStorageSet(`cached_json_${key}`, jsonStr);
    if (key === "settings") {
      safeStorageSet("cached_logo_settings", jsonStr);
    } else if (key === "nav") {
      safeStorageSet("cached_nav_links", jsonStr);
    } else if (key === "downloads") {
      safeStorageSet("cached_downloads", jsonStr);
    }
    this.notify(key, data);
  }

  /**
   * Subscribes a callback to changes for a specific key
   */
  subscribe(key: string, listener: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(listener);
      }
    };
  }

  private notify(key: string, data: any) {
    const set = this.listeners.get(key);
    if (set) {
      set.forEach((fn) => fn(data));
    }
  }

  /**
   * Bump version locally when Admin makes changes
   */
  bumpVersionLocally(key: string) {
    if (!this.versionInfo) {
      this.versionInfo = {
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
        versions: {}
      };
    }
    const now = Date.now().toString();
    this.versionInfo.versions[key] = now;
    this.versionInfo.updatedAt = new Date().toISOString();
    safeStorageSet("app_data_version_info", JSON.stringify(this.versionInfo));
  }
}

export const dataCache = new DataCacheService();

