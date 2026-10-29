import { readFile, writeFile } from "node:fs/promises";

const DATA = new URL("../../Tank-Reserviour/", import.meta.url);
const read = async (file) => JSON.parse(await readFile(new URL(file, DATA), "utf8"));
const title = (s = "") => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

const reservoirs = await read("reservoirs_data.json");
const riverReadings = (await read("realtime_river_levels.json")).observations;
const canals = await read("cropcalender.json");

const rivers = new Map();
for (const o of riverReadings) {
  if (!o.basin || !o.station) continue;
  if (!rivers.has(o.basin)) rivers.set(o.basin, new Set());
  rivers.get(o.basin).add(o.station);
}

const entries = [
  ...reservoirs.map((r) => ({ name: r.name, type: "tank", detail: [title(r.division), title(r.district)].filter(Boolean).join(", ") })),
  ...[...rivers].map(([name, stations]) => ({ name, type: "river", detail: `Gauges: ${[...stations].sort().join(", ")}` })),
  ...canals.map((c) => ({
    name: c.section ? `${c.tank_name} · ${c.section}` : `${c.tank_name} canals`,
    type: "canal",
    detail: `${c.tank_name} scheme`,
  })),
];

const seen = new Set();
const unique = entries.filter((e) => {
  const key = `${e.type}:${e.name.toLowerCase()}`;
  return !seen.has(key) && seen.add(key);
});
unique.sort((a, b) => a.name.localeCompare(b.name));

await writeFile(new URL("../lib/coverage.json", import.meta.url), JSON.stringify(unique) + "\n");
const count = (type) => unique.filter((e) => e.type === type).length;
console.log(`lib/coverage.json: ${count("tank")} tanks, ${count("river")} rivers, ${count("canal")} canals`);
