import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ETL_DIR = ROOT / "etl"


def utc_now_iso():
  return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def write_json(path: Path, obj):
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def build_geo(cfg: dict) -> dict:
  admin1_rows = []
  for a in cfg["admin1"]:
    admin1_rows.append({
      "geo_id": str(uuid.uuid4()),
      "country": cfg["country"],
      "iso3": cfg["iso3"],
      "admin1": a["name"],
      "admin2": None,
      "lat": a["lat"],
      "lon": a["lon"],
    })
  return {"admin1": admin1_rows}


def build_indicators(cfg: dict) -> dict:
  rows = []
  for it in cfg["indicators"]:
    rows.append({
      "indicator": it["id"],
      "name": it["name"],
      "sector": it["sector"],
      "unit": it["unit"],
      "source_hint": it["source"],
      "description": "",
    })
  return {"indicators": rows}


def build_obs(cfg: dict) -> list[dict]:
  """
  obs.json = liste de mesures agrégées.
  Champs minimaux : country, admin1, period, indicator, sex, value, source, quality_flag
  """
  country = cfg["country"]
  periods = cfg.get("periods", [])
  admin1 = [a["name"] for a in cfg["admin1"]]

  # Demo values (tu remplaceras par extraction API plus tard)
  # displaced_total par sexe (F/M) + indicateurs NA (score, sadd, underfunded)
  base_disp = {
    "Nord-Kivu": (620000, 380000),
    "Sud-Kivu": (410000, 260000),
    "Ituri": (290000, 210000),
    "Kasaï": (180000, 140000),
    "Kinshasa": (60000, 50000),
    "Tanganyika": (130000, 90000),
  }
  risk = {
    "Nord-Kivu": 9.2,
    "Ituri": 8.7,
    "Sud-Kivu": 7.9,
    "Tanganyika": 6.8,
    "Kasaï": 5.1,
    "Kinshasa": 3.2,
  }
  sadd = {
    "Nord-Kivu": 55,
    "Ituri": 22,
    "Sud-Kivu": 58,
    "Tanganyika": 41,
    "Kasaï": 35,
    "Kinshasa": 62,
  }

  out = []
  for p in periods:
    # country-level NA entries (admin1="ALL")
    out.append({
      "country": country, "admin1": "ALL", "period": p,
      "indicator": "sadd_score", "sex": "NA", "value": round(sum(sadd.values())/len(sadd), 1),
      "source": "IM checks (placeholder)", "quality_flag": "partial",
      "meta": {"level": "country"}
    })
    out.append({
      "country": country, "admin1": "ALL", "period": p,
      "indicator": "underfunded_zones", "sex": "NA", "value": 6,
      "source": "FTS (placeholder)", "quality_flag": "partial",
      "meta": {"level": "country"}
    })

    for a1 in admin1:
      f, m = base_disp.get(a1, (0, 0))
      out.append({
        "country": country, "admin1": a1, "period": p,
        "indicator": "displaced_total", "sex": "F", "value": int(f),
        "source": "OIM/UNHCR (placeholder)", "quality_flag": "partial",
        "meta": {"disagg": "sex"}
      })
      out.append({
        "country": country, "admin1": a1, "period": p,
        "indicator": "displaced_total", "sex": "M", "value": int(m),
        "source": "OIM/UNHCR (placeholder)", "quality_flag": "partial",
        "meta": {"disagg": "sex"}
      })
      out.append({
        "country": country, "admin1": a1, "period": p,
        "indicator": "gender_risk_score", "sex": "NA", "value": float(risk.get(a1, 0)),
        "source": "Composite (placeholder)", "quality_flag": "partial",
        "meta": {"method": "rule-based demo"}
      })
      out.append({
        "country": country, "admin1": a1, "period": p,
        "indicator": "sadd_score", "sex": "NA", "value": int(sadd.get(a1, 0)),
        "source": "IM checks (placeholder)", "quality_flag": "partial",
        "meta": {"level": "admin1"}
      })

  return out


def main():
  cfg_path = ETL_DIR / "config.yml"
  cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))

  geo = build_geo(cfg)
  indicators = build_indicators(cfg)
  obs = build_obs(cfg)

  build_id = str(uuid.uuid4())[:8]
  meta = {
    "build_id": build_id,
    "last_updated_utc": utc_now_iso(),
    "notes": "Demo dataset. Replace extractors with OCHA/UNHCR/OIM pipelines.",
  }

  write_json(DATA_DIR / "geo.json", geo)
  write_json(DATA_DIR / "indicators.json", indicators)
  write_json(DATA_DIR / "obs.json", obs)
  write_json(DATA_DIR / "metadata.json", meta)

  print(f"OK. Generated data/*.json (build_id={build_id})")


if __name__ == "__main__":
  main()
