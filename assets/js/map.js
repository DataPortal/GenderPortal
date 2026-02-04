let map, geoLayer;

function initMap() {
  map = L.map("map").setView([ -2.5, 23.5 ], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
}

function renderAdmin1Points(geo, obs, selected) {
  if (geoLayer) geoLayer.remove();

  // Placeholder: points admin1 centroid + circle size by "gender_risk_score"
  const points = geo.admin1.map(a => {
    const score = getObsValue(obs, selected, "gender_risk_score", a.admin1, "NA");
    return {
      type: "Feature",
      properties: { admin1: a.admin1, score: score ?? null },
      geometry: { type: "Point", coordinates: [a.lon, a.lat] }
    };
  });

  geoLayer = L.geoJSON({ type: "FeatureCollection", features: points }, {
    pointToLayer: (feature, latlng) => {
      const s = feature.properties.score;
      const r = s ? Math.max(6, Math.min(24, s * 2)) : 6;
      return L.circleMarker(latlng, { radius: r, fillOpacity: 0.35 });
    },
    onEachFeature: (feature, layer) => {
      const { admin1, score } = feature.properties;
      layer.bindPopup(`<b>${admin1}</b><br/>Score risque genre: ${score ?? "NA"}`);
    }
  }).addTo(map);

  map.fitBounds(geoLayer.getBounds(), { padding: [20, 20] });
}

// helper: get value from obs
function getObsValue(obs, selected, indicator, admin1, sex) {
  const row = obs.find(o =>
    o.country === selected.country &&
    (selected.admin1 === "ALL" ? true : o.admin1 === selected.admin1) &&
    o.admin1 === admin1 &&
    o.period === selected.period &&
    o.indicator === indicator &&
    o.sex === sex
  );
  return row ? row.value : null;
}
