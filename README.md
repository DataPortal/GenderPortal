# Portail d’analyse genre (MVP) — ONU Femmes

Portail statique (GitHub Pages) alimenté par un ETL Python minimal.
- Front: HTML/CSS/JS + Leaflet (carte)
- Data: JSON générés dans /data
- ETL: etl/build_data.py
- Update: GitHub Actions weekly (refresh-data.yml)

## Lancer en local
1) Générer les données:
   - cd etl
   - python -m pip install -r requirements.txt
   - python build_data.py

2) Servir le site:
   - depuis la racine: `python -m http.server 8000`
   - ouvrir: http://localhost:8000

## Déploiement GitHub Pages
Settings → Pages → Deploy from branch → main / root
