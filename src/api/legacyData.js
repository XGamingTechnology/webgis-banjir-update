const LEGACY_COMMIT = "ec660f488e83bf8a163f402dad4ba5106e5fe89e";
const LEGACY_RAW = `https://raw.githubusercontent.com/Admin-Raf/genangan/${LEGACY_COMMIT}`;

const SOURCES = {
  points2023: `${LEGACY_RAW}/assets/data/Titik.geojson`,
  points2024: `${LEGACY_RAW}/assets/data/titik2024.geojson`,
  summary2023: `${LEGACY_RAW}/assets/data/data.geojson`,
  summary2024: `${LEGACY_RAW}/assets/data/kabupaten2024.geojson`,
  areas2024: `${LEGACY_RAW}/assets/data/area2024.geojson`,
};

function text(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).trim() || fallback;
}

function numeric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(String(value).replace(/,/g, ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCategory(value) {
  const raw = text(value, "Tidak tersedia");
  const lower = raw.toLowerCase();
  if (lower.includes("tinggi") || lower.includes("berat")) return "Tinggi";
  if (lower.includes("sedang")) return "Sedang";
  if (lower.includes("rendah") || lower.includes("tidak banjir") || lower.includes("ringan")) return "Rendah/Tidak banjir";
  return raw;
}

function resolvePhoto(path) {
  if (!path || path === "Tidak ada foto") return "";
  if (/^https?:\/\//i.test(path)) return path;
  return encodeURI(`${LEGACY_RAW}/${String(path).replace(/^\//, "")}`);
}

function normalizePoint(feature, year, index, sourceName) {
  const p = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  const coordinatePair = feature.geometry?.type === "MultiPoint" ? coords[0] || [] : coords;
  const lng = numeric(p.x) || numeric(coordinatePair[0]);
  const lat = numeric(p.Y) || numeric(coordinatePair[1]);
  const district = text(p.KECAMATAN || p.WADMKC, "Tidak tersedia");
  const village = text(p.DESA, "Tidak tersedia");
  const location = text(p.NAMA_JALAN || p.NAMA_LOKAS || p.Jalan, "Lokasi tidak tersedia");
  const area = numeric(p.LUASAN_GEN || p.Genangan);
  const category = normalizeCategory(p.Kategori || p.kategori);
  const normalizedGeometry = Number.isFinite(lng) && Number.isFinite(lat) && lng && lat
    ? { type: "Point", coordinates: [lng, lat] }
    : feature.geometry;

  return {
    type: "Feature",
    geometry: normalizedGeometry,
    properties: {
      uid: `${year}-${index}-${district}-${location}`,
      year: Number(p.Tahun || year),
      district,
      village,
      location,
      height: text(p.TINGGI_GEN),
      area,
      areaLabel: area ? `${area.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m²` : "—",
      duration: text(p.DURASI_LAM),
      surveyTime: text(p.WAKTU__SUR),
      intensity: text(p.INTENSITAS),
      cause: text(p.PENYEBAB_G),
      subDas: text(p.SUB_DAS),
      category,
      photo: resolvePhoto(p.FOTO),
      lng,
      lat,
      polygonId: p.Polygon_id ?? null,
      source: sourceName,
    },
  };
}

function normalizeSummary(feature, year, index) {
  const p = feature.properties || {};
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      uid: `summary-${year}-${index}`,
      year: Number(p.Tahun || year),
      district: text(p.WADMKC || p.KECAMATAN, "Tidak tersedia"),
      regency: text(p.WADMKK || p.KABUPATEN, "Kabupaten Bandung"),
      category: normalizeCategory(p.Kategori),
      pointCount: numeric(p.Titik),
      inundationArea: numeric(p.Genangan),
    },
  };
}

function normalizeArea(feature, year, index) {
  const p = feature.properties || {};
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      uid: `area-${year}-${index}`,
      year: Number(p.Tahun || year),
      district: text(p.KECAMATAN, "Tidak tersedia"),
      village: text(p.DESA, "Tidak tersedia"),
      location: text(p.NAMA_LOKAS || p.NAMA_JALAN, "Lokasi tidak tersedia"),
      category: normalizeCategory(p.Kategori),
      area: numeric(p.LUASAN_GEN),
    },
  };
}

async function fetchGeoJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

const fallbackPoints = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "Point", coordinates: [107.624491, -7.00752] }, properties: { uid: "fb-1", year: 2024, district: "Baleendah", village: "Baleendah", location: "Jl. Kiastra Manggala", height: "0.4–0.5", area: 1974, areaLabel: "1.974 m²", duration: "2 Jam", surveyTime: "6 Jam", intensity: "Tinggi", cause: "Luapan Sungai Citarum dan tidak ada saluran drainase", subDas: "Baleendah", category: "Tinggi", photo: "", lng: 107.624491, lat: -7.00752, source: "fallback" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [107.580984, -7.047206] }, properties: { uid: "fb-2", year: 2024, district: "Banjaran", village: "Kamasan", location: "Jl. Raya Banjaran", height: "0.2–0.3", area: 236.34, areaLabel: "236,34 m²", duration: "3 Jam", surveyTime: "1 Hari", intensity: "Tinggi", cause: "Tidak ada saluran drainase", subDas: "Baleendah", category: "Sedang", photo: "", lng: 107.580984, lat: -7.047206, source: "fallback" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [107.633233, -6.989984] }, properties: { uid: "fb-3", year: 2024, district: "Bojongsoang", village: "Bojongsoang", location: "Jl. Cijagra", height: "1–1.5", area: 2567.5, areaLabel: "2.567,5 m²", duration: "4 Jam", surveyTime: "3 Hari", intensity: "Tinggi", cause: "Luapan Sungai Citarum dan Sungai Cikapundung", subDas: "Bojongsoang", category: "Tinggi", photo: "", lng: 107.633233, lat: -6.989984, source: "fallback" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [107.565639, -6.954083] }, properties: { uid: "fb-4", year: 2023, district: "Margaasih", village: "Rahayu", location: "Jl. Sadang Rahayu", height: "0.1–0.25", area: 1053, areaLabel: "1.053 m²", duration: "1 Jam", surveyTime: "6 Jam", intensity: "Sedang", cause: "Tidak ada saluran drainase", subDas: "Margahayu", category: "Tinggi", photo: "", lng: 107.565639, lat: -6.954083, source: "fallback" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [107.542833, -7.026056] }, properties: { uid: "fb-5", year: 2023, district: "Soreang", village: "Cingcin", location: "Jl. Gading Tutuka 1", height: "0.1–0.35", area: 1800, areaLabel: "1.800 m²", duration: "3 Jam", surveyTime: "1 Jam", intensity: "Besar", cause: "Saluran drainase tersumbat sampah", subDas: "Soreang", category: "Tinggi", photo: "", lng: 107.542833, lat: -7.026056, source: "fallback" } }
  ]
};

export async function loadLegacyData() {
  const keys = Object.keys(SOURCES);
  const settled = await Promise.allSettled(keys.map((key) => fetchGeoJson(SOURCES[key])));
  const payload = Object.fromEntries(keys.map((key, i) => [key, settled[i].status === "fulfilled" ? settled[i].value : null]));
  const failed = keys.filter((_, i) => settled[i].status === "rejected");

  const points = [
    ...(payload.points2023?.features || []).map((f, i) => normalizePoint(f, 2023, i, "Titik.geojson")),
    ...(payload.points2024?.features || []).map((f, i) => normalizePoint(f, 2024, i, "titik2024.geojson")),
  ];

  const summaries = [
    ...(payload.summary2023?.features || []).map((f, i) => normalizeSummary(f, 2023, i)),
    ...(payload.summary2024?.features || []).map((f, i) => normalizeSummary(f, 2024, i)),
  ];

  const areas = (payload.areas2024?.features || []).map((f, i) => normalizeArea(f, 2024, i));
  const useFallback = points.length === 0;

  return {
    points: useFallback ? fallbackPoints : { type: "FeatureCollection", features: points },
    summaries: { type: "FeatureCollection", features: summaries },
    areas: { type: "FeatureCollection", features: areas },
    mode: useFallback ? "fallback" : failed.length ? "partial" : "live",
    failed,
    sourceCommit: LEGACY_COMMIT,
  };
}
