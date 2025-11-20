import { z } from "zod";

const CountrySchema = z.object({
  name: z.object({ official: z.string() }),
  flags: z.object({ svg: z.string().optional(), png: z.string().optional() }).optional(),
  flag: z.string().optional(),
  region: z.string().optional(),
  capital: z.union([z.array(z.string()), z.string()]).optional()
});

let cache = { data: null, ts: 0 };

function headers() {
  const h = { "User-Agent": "FlagMaster/1.0", Accept: "application/json" };
  if (process.env.COUNTRIES_API_KEY) h["x-api-key"] = process.env.COUNTRIES_API_KEY;
  return h;
}

export async function fetchAllCountriesWithRetry(fetchFn = fetch, retries = 3, delayMs = 400) {
  const base = process.env.COUNTRIES_API_BASE || "https://restcountries.com/v3.1/all?fields=name,flags,region,capital";
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchFn(base, { headers: headers() });
      if (!res.ok) {
        if (res.status >= 500) throw new Error("server_error");
        throw new Error("client_error");
      }
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("invalid_data");
      const valid = json.filter((c) => CountrySchema.safeParse(c).success);
      const normalized = normalize(valid);
      if (!normalized.length) throw new Error("invalid_catalog");
      return normalized;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  const err = lastErr?.message || "api_unavailable";
  const e = new Error(err);
  e.code = "api_unavailable";
  throw e;
}

function normalize(list) {
  return list
    .filter((c) => (c?.name?.official) && ((c.flags?.svg) || (c.flags?.png) || c.flag))
    .map((c) => ({
      name: { official: c.name.official },
      flag: c.flags?.svg || c.flags?.png || c.flag,
      region: c.region || "",
      capital: Array.isArray(c.capital) ? (c.capital[0] || "") : (c.capital || "")
    }));
}

export async function getCountriesCatalogWithCache(fetchFn = fetch) {
  const ttl = Number(process.env.COUNTRIES_CACHE_TTL_MS || 12 * 60 * 60 * 1000);
  const now = Date.now();
  if (cache.data && now - cache.ts < ttl) return { data: cache.data };
  try {
    const data = await fetchAllCountriesWithRetry(fetchFn);
    cache = { data, ts: now };
    return { data: cache.data };
  } catch (e) {
    if (cache.data) return { data: cache.data };
    const err = new Error("countries_unavailable");
    err.code = "countries_unavailable";
    throw err;
  }
}

export function __resetCache() {
  cache = { data: null, ts: 0 };
}