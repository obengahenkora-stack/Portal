// Cloudflare Worker: the "helper" between your bet page and the live-score service.
// - Keeps your secret key hidden (set it as a Secret named API_KEY, never paste it in this file).
// - Remembers answers for a while so your visitors don't use up the free 100 requests/day.

// Leagues to show. These are API-Football league IDs. Add or remove numbers freely.
// 39 Premier League, 140 La Liga, 135 Serie A, 78 Bundesliga, 61 Ligue 1,
// 2 Champions League, 570 Ghana Premier League
// (Check the Ghana ID in your API-Football dashboard under "Leagues" if no Ghana matches appear.)
const LEAGUES = [39, 140, 135, 78, 61, 2, 570];

const API = "https://v3.football.api-sports.io/fixtures?date=";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

function dayString(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

async function getDay(date, ttlSeconds, env, ctx) {
  const cache = caches.default;
  const key = new Request("https://cache.invalid/fixtures/" + date);
  const hit = await cache.match(key);
  if (hit) return hit.json();

  const r = await fetch(API + date, { headers: { "x-apisports-key": env.API_KEY } });
  if (!r.ok) throw new Error("Score service returned status " + r.status);
  const j = await r.json();
  const errs = j.errors;
  if (errs && (Array.isArray(errs) ? errs.length : Object.keys(errs).length)) {
    throw new Error(JSON.stringify(errs));
  }

  const list = (j.response || [])
    .filter((f) => LEAGUES.includes(f.league.id))
    .map((f) => ({
      id: f.fixture.id,
      league: f.league.name,
      home: f.teams.home.name,
      away: f.teams.away.name,
      kickoff: f.fixture.date,
      status: f.fixture.status.short,
      elapsed: f.fixture.status.elapsed,
      hg: f.goals.home,
      ag: f.goals.away,
    }));

  ctx.waitUntil(
    cache.put(
      key,
      new Response(JSON.stringify(list), {
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=" + ttlSeconds },
      })
    )
  );
  return list;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    try {
      // Today refreshes every 25 minutes. Yesterday/tomorrow every 3 hours.
      // That is roughly 75 requests a day, under the free limit of 100.
      const today = await getDay(dayString(0), 1500, env, ctx);
      const other = await Promise.all(
        [dayString(-1), dayString(1)].map((d) => getDay(d, 10800, env, ctx).catch(() => []))
      );
      const matches = today.concat(other[0], other[1]);
      return new Response(JSON.stringify({ matches }), { headers: CORS });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers: CORS });
    }
  },
};
