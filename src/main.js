import { loadLegacyData } from "./api/legacyData.js";
import { MapView } from "./components/MapView.js";

const $ = (id) => document.getElementById(id);
const state = { raw: null, filteredPoints: [], tablePoints: [], filters: { year: "", district: "", category: "" } };
let mapView;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[c]));
}

function formatNumber(value, max = 0) {
  return Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: max });
}

function categoryClass(category) {
  if (category === "Tinggi") return "high";
  if (category === "Sedang") return "medium";
  return "low";
}

function setStatus(mode, failed = []) {
  const el = $("data-status");
  if (mode === "live") { el.className = "data-status ready"; el.innerHTML = '<span class="status-dot"></span>Data legacy terhubung'; return; }
  if (mode === "partial") { el.className = "data-status fallback"; el.innerHTML = `<span class="status-dot"></span>Data parsial (${failed.length} sumber gagal)`; return; }
  el.className = "data-status fallback"; el.innerHTML = '<span class="status-dot"></span>Mode fallback demo';
}

function fillSelect(select, values, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}

function initializeFilters(points) {
  const features = points.features || [];
  fillSelect($("filter-year"), [...new Set(features.map((f) => String(f.properties.year)))].sort(), "Semua tahun");
  fillSelect($("filter-district"), [...new Set(features.map((f) => f.properties.district).filter((v) => v && v !== "Tidak tersedia"))].sort((a,b)=>a.localeCompare(b,"id")), "Semua kecamatan");
  fillSelect($("filter-category"), [...new Set(features.map((f) => f.properties.category).filter(Boolean))].sort(), "Semua kategori");
}

function currentFilteredPoints() {
  const { year, district, category } = state.filters;
  return (state.raw.points.features || []).filter((f) => {
    const p = f.properties;
    return (!year || String(p.year) === year) && (!district || p.district === district) && (!category || p.category === category);
  });
}

function currentSummaries() {
  const { year, district, category } = state.filters;
  const displayYear = year || "2024";
  return (state.raw.summaries.features || []).filter((f) => {
    const p = f.properties;
    return String(p.year) === displayYear && (!district || p.district === district) && (!category || p.category === category);
  });
}

function currentAreas() {
  const { year, district, category } = state.filters;
  return (state.raw.areas.features || []).filter((f) => {
    const p = f.properties;
    return (!year || String(p.year) === year) && (!district || p.district === district) && (!category || p.category === category);
  });
}

function updateKpis(features) {
  const districts = new Set(features.map((f) => f.properties.district).filter(Boolean));
  const high = features.filter((f) => f.properties.category === "Tinggi").length;
  const area = features.reduce((sum, f) => sum + Number(f.properties.area || 0), 0);
  $("kpi-points").textContent = formatNumber(features.length);
  $("kpi-districts").textContent = formatNumber(districts.size);
  $("kpi-high").textContent = formatNumber(high);
  $("kpi-high-note").textContent = features.length ? `${Math.round(high / features.length * 100)}% dari data terfilter` : "0% dari data terfilter";
  $("kpi-area").textContent = formatNumber(area, 1);
  $("map-result-count").textContent = formatNumber(features.length);
}

function renderTable(features) {
  const query = $("table-search").value.trim().toLowerCase();
  const filtered = features.filter((f) => {
    if (!query) return true;
    const p = f.properties;
    return [p.location, p.village, p.district, p.category, p.year].some((v) => String(v || "").toLowerCase().includes(query));
  });
  state.tablePoints = filtered;
  $("table-summary").textContent = `Menampilkan ${formatNumber(filtered.length)} dari ${formatNumber(features.length)} titik sesuai filter.`;
  const tbody = $("data-table-body");
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Tidak ada data yang sesuai filter atau pencarian.</td></tr>'; return; }
  tbody.innerHTML = filtered.map((f) => {
    const p = f.properties;
    return `<tr data-uid="${escapeHtml(p.uid)}">
      <td>${escapeHtml(p.year)}</td>
      <td class="cell-strong">${escapeHtml(p.district)}</td>
      <td>${escapeHtml(p.village)}</td>
      <td>${escapeHtml(p.location)}</td>
      <td>${escapeHtml(p.height)}</td>
      <td>${escapeHtml(p.areaLabel)}</td>
      <td><span class="category-pill ${categoryClass(p.category)}">${escapeHtml(p.category)}</span></td>
      <td><i class="bi bi-chevron-right"></i></td>
    </tr>`;
  }).join("");
}

function featureCollection(features) { return { type: "FeatureCollection", features }; }

async function applyFilters({ fit = false } = {}) {
  if (!state.raw) return;
  state.filters.year = $("filter-year").value;
  state.filters.district = $("filter-district").value;
  state.filters.category = $("filter-category").value;

  const points = currentFilteredPoints();
  const summaries = currentSummaries();
  const areas = currentAreas();
  state.filteredPoints = points;
  updateKpis(points);
  renderTable(points);
  await mapView.setData({ points: featureCollection(points), summaries: featureCollection(summaries), areas: featureCollection(areas) });
  if (fit) await mapView.fitToPoints(featureCollection(points));
}

function openDetails(properties) {
  const p = properties;
  $("detail-year").textContent = `DATA ${p.year}`;
  $("detail-location").textContent = p.location || "Lokasi genangan";
  $("detail-subtitle").textContent = `${p.district || "—"} · ${p.subDas && p.subDas !== "—" ? `Sub DAS ${p.subDas}` : "Kabupaten Bandung"}`;
  $("detail-village").textContent = p.village || "—";
  $("detail-category").textContent = p.category || "—";
  $("detail-height").textContent = p.height && p.height !== "—" ? `${p.height} m` : "—";
  $("detail-area").textContent = p.areaLabel || "—";
  $("detail-duration").textContent = p.duration || "—";
  $("detail-intensity").textContent = p.intensity || "—";
  $("detail-cause").textContent = p.cause || "—";
  $("detail-coordinates").textContent = Number(p.lng) && Number(p.lat) ? `${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)}` : "Koordinat tidak tersedia";
  const img = $("detail-photo"), placeholder = $("photo-placeholder");
  img.style.display = "none"; placeholder.style.display = "flex"; img.removeAttribute("src");
  if (p.photo) {
    img.onload = () => { placeholder.style.display = "none"; img.style.display = "block"; };
    img.onerror = () => { img.style.display = "none"; placeholder.style.display = "flex"; };
    img.src = p.photo;
  }
  $("detail-drawer").classList.add("open");
  $("detail-drawer").setAttribute("aria-hidden", "false");
  mapView.focusPoint(p);
}

function closeDetails() { $("detail-drawer").classList.remove("open"); $("detail-drawer").setAttribute("aria-hidden", "true"); }

function exportCsv() {
  const rows = state.tablePoints.length ? state.tablePoints : state.filteredPoints;
  if (!rows.length) return;
  const headers = ["Tahun","Kecamatan","Desa","Lokasi/Ruas Jalan","Tinggi Genangan","Luas Genangan (m2)","Durasi","Intensitas","Penyebab","Kategori","Longitude","Latitude"];
  const csv = [headers, ...rows.map((f) => { const p=f.properties; return [p.year,p.district,p.village,p.location,p.height,p.area,p.duration,p.intensity,p.cause,p.category,p.lng,p.lat]; })]
    .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `inventaris-genangan-${state.filters.year || "semua-tahun"}.csv`; a.click(); URL.revokeObjectURL(url);
}

function bindUi() {
  ["filter-year","filter-district","filter-category"].forEach((id) => $(id).addEventListener("change", () => applyFilters({ fit: true })));
  $("reset-filter").addEventListener("click", () => { ["filter-year","filter-district","filter-category"].forEach((id) => $(id).value = ""); $("table-search").value = ""; applyFilters({ fit: true }); });
  $("table-search").addEventListener("input", () => renderTable(state.filteredPoints));
  $("fit-map").addEventListener("click", () => mapView.fitToPoints(featureCollection(state.filteredPoints)));
  $("basemap-select").addEventListener("change", (e) => mapView.setBasemap(e.target.value));
  $("layer-districts").addEventListener("change", (e) => mapView.toggleLayer("districts", e.target.checked));
  $("layer-areas").addEventListener("change", (e) => mapView.toggleLayer("areas", e.target.checked));
  $("layer-points").addEventListener("change", (e) => mapView.toggleLayer("points", e.target.checked));
  $("layer-heatmap").addEventListener("change", (e) => mapView.toggleLayer("heatmap", e.target.checked));
  $("drawer-close").addEventListener("click", closeDetails);
  $("export-csv").addEventListener("click", exportCsv);
  $("print-btn").addEventListener("click", () => window.print());
  $("data-table-body").addEventListener("click", (e) => { const row=e.target.closest("tr[data-uid]"); if(!row)return; const f=state.tablePoints.find((item)=>item.properties.uid===row.dataset.uid); if(f) openDetails(f.properties); });
  $("menu-btn").addEventListener("click", () => { $("sidebar").classList.add("open"); $("mobile-overlay").classList.add("open"); });
  $("mobile-overlay").addEventListener("click", () => { $("sidebar").classList.remove("open"); $("mobile-overlay").classList.remove("open"); });
  document.querySelectorAll(".nav-item").forEach((link) => link.addEventListener("click", () => { document.querySelectorAll(".nav-item").forEach((n)=>n.classList.remove("active")); link.classList.add("active"); $("sidebar").classList.remove("open"); $("mobile-overlay").classList.remove("open"); }));
}

async function boot() {
  bindUi();
  try {
    mapView = new MapView("map");
    mapView.onPointSelected = (properties) => {
      const actual = state.raw?.points.features.find((f) => f.properties.uid === properties.uid)?.properties || properties;
      openDetails(actual);
    };
    mapView.onDistrictSelected = (district) => { if ([...$("filter-district").options].some((o)=>o.value===district)) { $("filter-district").value=district; applyFilters({fit:true}); } };

    state.raw = await loadLegacyData();
    setStatus(state.raw.mode, state.raw.failed);
    initializeFilters(state.raw.points);
    await applyFilters({ fit: true });
    $("map-loading").classList.add("hidden");
  } catch (error) {
    console.error(error);
    $("map-loading").innerHTML = `<strong>Peta gagal dimuat</strong><span>${escapeHtml(error.message)}</span>`;
    $("data-status").className = "data-status fallback";
    $("data-status").innerHTML = '<span class="status-dot"></span>Kesalahan inisialisasi';
  }
}

boot();
