import { withCors } from "../_lib/cors.js";
import { getCountriesCatalogWithCache } from "../_lib/countriesService.js";

let deck = [];
let deckIndex = 0;
let lastOfficial = null;
export let metrics = { totalServed: 0, repeatsPrevented: 0, cycles: 0, uniqueThisCycle: new Set(), catalogSize: 0, lastSnapshot: { uniqueRate: 0, repeatFreq: 0, utilization: 0, served: 0, cycle: 0 } };

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sample(arr, n, exclude) {
  const s = [];
  while (s.length < n) {
    const c = pickRandom(arr);
    if (exclude && c.name.official === exclude.name.official) continue;
    if (!s.find((x) => x.name.official === c.name.official)) s.push(c);
  }
  return s;
}

async function getCountries() {
  const { data } = await getCountriesCatalogWithCache();
  metrics.catalogSize = data.length;
  if (!deck.length) {
    deck = Array.from({ length: data.length }, (_, i) => i).sort(() => Math.random() - 0.5);
    deckIndex = 0;
    metrics.uniqueThisCycle = new Set();
    metrics.cycles += 1;
  }
  return data;
}

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const list = await getCountries();
    if (!list || list.length < 4) return res.status(502).json({ error: "countries_unavailable" });
    if (deckIndex >= deck.length) {
      deck = Array.from({ length: list.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      deckIndex = 0;
      metrics.uniqueThisCycle = new Set();
      metrics.cycles += 1;
    }
    let idx = deck[deckIndex];
    let chosen = list[idx];
    if (lastOfficial && chosen.name.official === lastOfficial) {
      metrics.repeatsPrevented += 1;
      const nextIdx = deckIndex + 1 < deck.length ? deck[deckIndex + 1] : deck[0];
      idx = nextIdx;
      chosen = list[idx];
      if (deckIndex + 1 < deck.length) {
        const tmp = deck[deckIndex];
        deck[deckIndex] = deck[deckIndex + 1];
        deck[deckIndex + 1] = tmp;
      }
    }
    deckIndex += 1;
    metrics.totalServed += 1;
    metrics.uniqueThisCycle.add(chosen.name.official);
    lastOfficial = chosen.name.official;
    const incorrect = sample(list, 3, chosen);
    const options = [...incorrect.map((c) => c.name.official), chosen.name.official].sort(() => Math.random() - 0.5);
    const uniqueRate = metrics.catalogSize ? Math.round((metrics.uniqueThisCycle.size / metrics.catalogSize) * 100) : 0;
    const repeatFreq = metrics.totalServed ? Math.round((metrics.repeatsPrevented / metrics.totalServed) * 100) : 0;
    const utilization = uniqueRate;
    metrics.lastSnapshot = { uniqueRate, repeatFreq, utilization, served: metrics.totalServed, cycle: metrics.cycles };
    res.status(200).json({ flag: chosen.flag, region: chosen.region, capital: chosen.capital, correct: chosen.name.official, options, metrics: metrics.lastSnapshot });
  } catch (e) {
    res.status(502).json({ error: "countries_unavailable" });
  }
}

export default withCors(handler);