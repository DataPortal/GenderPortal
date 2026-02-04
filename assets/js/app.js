let GEO, IND, OBS, META;

function fillSelect(sel, items, includeAll=false) {
  sel.innerHTML = "";
  if (includeAll) {
    const opt = document.createElement("option");
    opt.value = "ALL"; opt.textContent = "Toutes";
    sel.appendChild(opt);
  }
  items.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
}

function computeKPIs(selected) {
  // KPIs basiques tirés de obs.json
  const rows = OBS.filter(o =>
    o.country === selected.country &&
    (selected.admin1 === "ALL" ? true : o.admin1 === selected.admin1) &&
    o.period === selected.period
  );

  const womenDisp = rows.find(r => r.indicator === "displaced_total" && r.sex === "F")?.value ?? null;
  const saddScore = rows.find(r => r.indicator === "sadd_score" && r.sex === "NA")?.value ?? null;
  const underfunded = rows.find(r => r.indicator === "underfunded_zones" && r.sex === "NA")?.value ?? null;
  const sectors = "Protection / Santé"; // placeholder

  return [
    { k: "Femmes déplacées", v: formatNumber(womenDisp), s: `Période: ${selected.period}` },
    { k: "% données SADD", v: saddScore !== null ? `${saddScore}%` : "—", s: "Complétude SADD (proxy)" },
    { k: "Zones sous-financées", v: underfunded ?? "—", s: "FTS (placeholder)" },
    { k: "Secteurs critiques", v: sectors, s: "Lecture qualitative (placeholder)" }
  ];
}

function renderKPIs(kpis) {
  const wrap = document.getElementById("kpis");
  if (!wrap) return;
  wrap.innerHTML = "";
  kpis.forEach(x => {
    const div = document.createElement("div");
    div.className = "kpi";
    div.innerHTML = `<div class="k">${x.k}</div><div class="v">${x.v}</div><div class="s">${x.s}</div>`;
    wrap.appendChild(div);
  });
}

function renderAlerts(selected) {
  const ul = document.getElementById("alerts");
  if (!ul) return;
  ul.innerHTML = "";

  // top 3 admin1 by gender_risk_score (sex NA)
  const rows = OBS.filter(o =>
    o.country === selected.country &&
    o.period === selected.period &&
    o.indicator === "gender_risk_score" &&
    o.sex === "NA"
  ).sort((a,b)=> (b.value??0)-(a.value??0)).slice(0,3);

  rows.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.admin1}: score risque genre = ${r.value}`;
    ul.appendChild(li);
  });
}

async function main() {
  try {
    [GEO, IND, OBS, META] = await Promise.all([
      loadJSON("data/geo.json"),
      loadJSON("data/indicators.json"),
      loadJSON("data/obs.json"),
      loadJSON("data/metadata.json"),
    ]);

    const countrySel = document.getElementById("countrySelect");
    const admin1Sel = document.getElementById("admin1Select");
    const periodSel = document.getElementById("periodSelect");
    const metaLine = document.getElementById("metaLine");

    const countries = uniq(GEO.admin1.map(x => x.country));
    fillSelect(countrySel, countries);

    const periods = uniq(OBS.map(o => o.period)).sort();
    fillSelect(periodSel, periods);

    const refreshAdmin1 = () => {
      const c = countrySel.value;
      const a1 = GEO.admin1.filter(x => x.country === c).map(x => x.admin1).sort();
      fillSelect(admin1Sel, a1, true);
    };
    refreshAdmin1();

    metaLine.textContent = `Dernière MAJ: ${META.last_updated_utc} | Build: ${META.build_id}`;

    initMap();

    const apply = () => {
      const selected = { country: countrySel.value, admin1: admin1Sel.value, period: periodSel.value };
      renderKPIs(computeKPIs(selected));
      renderAlerts(selected);

      // Map: render all admin1 points (centroids)
      renderAdmin1Points(GEO, OBS, selected);

      // Charts placeholders (exemple: déplacements F/M et tendance)
      const dispF = OBS.filter(o => o.country===selected.country && o.period===selected.period && o.indicator==="displaced_total" && o.sex==="F" && (selected.admin1==="ALL" ? true : o.admin1===selected.admin1));
      const dispM = OBS.filter(o => o.country===selected.country && o.period===selected.period && o.indicator==="displaced_total" && o.sex==="M" && (selected.admin1==="ALL" ? true : o.admin1===selected.admin1));
      const vF = dispF.reduce((s,r)=>s+(r.value||0),0);
      const vM = dispM.reduce((s,r)=>s+(r.value||0),0);
      drawPlaceholderBar("chart1", ["Femmes","Hommes"], [vF, vM], "");

      // Tendance placeholder (si données pas disponibles -> faux)
      drawPlaceholderLine("chart2", ["M-5","M-4","M-3","M-2","M-1","M"], [12,18,16,22,25,28]);
    };

    document.getElementById("applyBtn").addEventListener("click", apply);
    countrySel.addEventListener("change", () => { refreshAdmin1(); });
    apply();

  } catch (e) {
    console.error(e);
    alert("Erreur chargement données. Vérifie data/*.json et le chemin GitHub Pages.");
  }
}

window.addEventListener("DOMContentLoaded", main);
