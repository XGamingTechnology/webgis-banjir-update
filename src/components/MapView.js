const EMPTY = { type: "FeatureCollection", features: [] };

const CATEGORY_COLOR = [
  "match", ["get", "category"],
  "Tinggi", "#dc2626",
  "Sedang", "#f59e0b",
  "Rendah/Tidak banjir", "#16a085",
  "#64748b"
];

export class MapView {
  constructor(containerId) {
    if (!window.maplibregl) throw new Error("MapLibre GL JS tidak tersedia.");
    this.onPointSelected = null;
    this.onDistrictSelected = null;
    this.lastPoints = EMPTY;

    this.map = new window.maplibregl.Map({
      container: containerId,
      center: [107.615, -7.02],
      zoom: 10,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: true,
      style: {
        version: 8,
        sources: {
          osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" },
          satellite: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "Tiles © Esri" }
        },
        layers: [
          { id: "basemap-osm", type: "raster", source: "osm", layout: { visibility: "visible" } },
          { id: "basemap-satellite", type: "raster", source: "satellite", layout: { visibility: "none" } }
        ]
      }
    });

    this.map.addControl(new window.maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    this.ready = new Promise((resolve) => this.map.on("load", () => { this.#installDataLayers(); resolve(); }));
  }

  #installDataLayers() {
    this.map.addSource("district-summary", { type: "geojson", data: EMPTY });
    this.map.addLayer({ id: "district-fill", type: "fill", source: "district-summary", paint: { "fill-color": CATEGORY_COLOR, "fill-opacity": 0.18 } });
    this.map.addLayer({ id: "district-line", type: "line", source: "district-summary", paint: { "line-color": CATEGORY_COLOR, "line-width": 1.2, "line-opacity": .7 } });

    this.map.addSource("flood-areas", { type: "geojson", data: EMPTY });
    this.map.addLayer({ id: "flood-area-fill", type: "fill", source: "flood-areas", paint: { "fill-color": CATEGORY_COLOR, "fill-opacity": .34 } });
    this.map.addLayer({ id: "flood-area-line", type: "line", source: "flood-areas", paint: { "line-color": CATEGORY_COLOR, "line-width": 1.4, "line-opacity": .8 } });

    this.map.addSource("flood-points", { type: "geojson", data: EMPTY });
    this.map.addLayer({ id: "flood-heatmap", type: "heatmap", source: "flood-points", maxzoom: 15, layout: { visibility: "none" }, paint: {
      "heatmap-weight": ["interpolate", ["linear"], ["get", "area"], 0, .25, 3000, 1],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, .7, 15, 1.8],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 16, 15, 34],
      "heatmap-opacity": .55
    }});
    this.map.addLayer({ id: "flood-points-layer", type: "circle", source: "flood-points", paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4.5, 14, 8],
      "circle-color": CATEGORY_COLOR,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
      "circle-opacity": .92
    }});

    this.map.on("mouseenter", "flood-points-layer", () => { this.map.getCanvas().style.cursor = "pointer"; });
    this.map.on("mouseleave", "flood-points-layer", () => { this.map.getCanvas().style.cursor = ""; });
    this.map.on("click", "flood-points-layer", (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      this.onPointSelected?.(feature.properties);
    });

    this.map.on("mouseenter", "district-fill", () => { this.map.getCanvas().style.cursor = "pointer"; });
    this.map.on("mouseleave", "district-fill", () => { this.map.getCanvas().style.cursor = ""; });
    this.map.on("click", "district-fill", (event) => {
      const feature = event.features?.[0];
      if (feature?.properties?.district) this.onDistrictSelected?.(feature.properties.district);
    });
  }

  async setData({ points = EMPTY, summaries = EMPTY, areas = EMPTY }) {
    await this.ready;
    this.lastPoints = points;
    this.map.getSource("flood-points")?.setData(points);
    this.map.getSource("district-summary")?.setData(summaries);
    this.map.getSource("flood-areas")?.setData(areas);
  }

  async toggleLayer(group, visible) {
    await this.ready;
    const groups = {
      districts: ["district-fill", "district-line"],
      areas: ["flood-area-fill", "flood-area-line"],
      points: ["flood-points-layer"],
      heatmap: ["flood-heatmap"]
    };
    (groups[group] || []).forEach((id) => this.map.getLayer(id) && this.map.setLayoutProperty(id, "visibility", visible ? "visible" : "none"));
  }

  async setBasemap(name) {
    await this.ready;
    this.map.setLayoutProperty("basemap-osm", "visibility", name === "osm" ? "visible" : "none");
    this.map.setLayoutProperty("basemap-satellite", "visibility", name === "satellite" ? "visible" : "none");
  }

  async fitToPoints(points = this.lastPoints) {
    await this.ready;
    const features = (points?.features || []).filter((f) => f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates));
    if (!features.length) return;
    if (features.length === 1) {
      this.map.easeTo({ center: features[0].geometry.coordinates, zoom: 14, duration: 700 });
      return;
    }
    const bounds = new window.maplibregl.LngLatBounds();
    features.forEach((f) => bounds.extend(f.geometry.coordinates));
    this.map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 700 });
  }

  async focusPoint(properties) {
    await this.ready;
    const lng = Number(properties.lng), lat = Number(properties.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) this.map.easeTo({ center: [lng, lat], zoom: Math.max(this.map.getZoom(), 14), duration: 650 });
  }
}
