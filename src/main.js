import { MapView } from "./components/MapView.js";
import { FilterPanel } from "./components/FilterPanel.js";

// Inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
  const mapView = new MapView("map");
  new FilterPanel(mapView);
});
