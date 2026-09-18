// Data dummy genangan banjir Kabupaten Bandung
export const floodPoints = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [107.5213, -6.9123] },
      properties: { kecamatan: "Soreang", tahun: 2024, kategori: "Berat", deskripsi: "Genangan >100 cm" },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [107.4821, -6.9542] },
      properties: { kecamatan: "Margaasih", tahun: 2023, kategori: "Sedang", deskripsi: "Genangan 50–100 cm" },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [107.5567, -6.8901] },
      properties: { kecamatan: "Katapang", tahun: 2024, kategori: "Ringan", deskripsi: "Genangan <50 cm" },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [107.6012, -6.9334] },
      properties: { kecamatan: "Dayeuhkolot", tahun: 2023, kategori: "Berat", deskripsi: "Banjir rutin tiap hujan deras" },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [107.4432, -6.9789] },
      properties: { kecamatan: "Ciparay", tahun: 2024, kategori: "Sedang", deskripsi: "Genangan di Jalan Raya" },
    },
  ],
};
