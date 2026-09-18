import { floodPoints } from "../api/mockData.js";

export class FilterPanel {
  constructor(mapView) {
    this.mapView = mapView;
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById("filter-tahun").addEventListener("change", () => this.applyFilters());
    document.getElementById("filter-kecamatan").addEventListener("change", () => this.applyFilters());
    document.getElementById("layer-points").addEventListener("change", (e) => {
      this.mapView.toggleLayer("flood-points-layer", e.target.checked);
    });
    document.getElementById("layer-heatmap").addEventListener("change", (e) => {
      this.mapView.toggleLayer("flood-heatmap", e.target.checked);
    });
  }

  applyFilters() {
    const tahun = document.getElementById("filter-tahun").value;
    const kecamatan = document.getElementById("filter-kecamatan").value;

    let filtered = floodPoints.features;

    if (tahun) {
      filtered = filtered.filter((f) => f.properties.tahun == tahun);
    }
    if (kecamatan) {
      filtered = filtered.filter((f) => f.properties.kecamatan === kecamatan);
    }

    this.mapView.updateData({
      type: "FeatureCollection",
      features: filtered,
    });
  }
}
