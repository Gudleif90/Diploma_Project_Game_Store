import logger from "./logger";

const CACHE_KEY = "cachedGamesIgdb";

const img = (imageId, size) =>
  `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;

const GENRE_NAMES = { "Role-playing (RPG)": "RPG", Sport: "Sports" };

const platformFamily = (name = "") => {
  if (/playstation/i.test(name)) return "PlayStation";
  if (/xbox/i.test(name)) return "Xbox";
  if (/nintendo|switch|wii/i.test(name)) return "Nintendo";
  if (/^pc|windows/i.test(name)) return "PC";
  return null;
};

const adaptGame = (g) => {
  const genres = (g.genres || []).map((x) => ({
    id: x.id,
    name: GENRE_NAMES[x.name] || x.name,
  }));
  if ((g.themes || []).some((t) => t.name === "Action")) {
    genres.push({ id: "action", name: "Action" });
  }

  const families = [
    ...new Set((g.platforms || []).map((p) => platformFamily(p.name)).filter(Boolean)),
  ];
  const shot = g.screenshots?.[0]?.image_id;
  const cover = g.cover?.image_id;
  const companies = g.involved_companies || [];

  return {
    id: g.id,
    name: g.name,
    background_image: shot
      ? img(shot, "screenshot_big")
      : cover
      ? img(cover, "cover_big")
      : null,
    metacritic: g.aggregated_rating ? Math.round(g.aggregated_rating) : null,
    released: g.first_release_date
      ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10)
      : null,
    genres,
    parent_platforms: families.map((name) => ({ platform: { name } })),
    description_raw: g.summary || "",
    website: g.websites?.[0]?.url || "",
    developers: companies.filter((c) => c.developer).map((c) => ({ name: c.company?.name })),
    publishers: companies.filter((c) => c.publisher).map((c) => ({ name: c.company?.name })),
    screenshots: (g.screenshots || []).map((s) => img(s.image_id, "screenshot_big")),
  };
};

const sendRequest = async (url) => {
  const res = await window.fetch(url);
  if (!res.ok) throw new Error(`Games API error: ${res.status}`);
  const data = await res.json();
  return { results: data.map(adaptGame) };
};

const storeGames = async (url) => {
  let data = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  if (Object.keys(data).length === 0) {
    data = await sendRequest(url);
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    logger.debug("FETCHED DATA");
  }
  return data;
};

const fetchGames = (url) => storeGames(url);

const fetchGameDetails = async (url) => {
  const { results } = await sendRequest(url);
  if (!results.length) throw new Error("Game not found");
  return results[0];
};

export { sendRequest, storeGames, fetchGames, fetchGameDetails, adaptGame };