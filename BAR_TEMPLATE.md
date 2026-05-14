# Template ajout de bar / lieu

Copier un bloc dans `data/bars.json`, remplacer les valeurs, puis vérifier la virgule avec l'entrée précédente/suivante.

```json
{
  "id": "nom-du-lieu",
  "name": "Nom du lieu",
  "area": "Quartier",
  "type": "bar / café / salle / buvette",
  "section": "bars",
  "tags": ["local", "terrasse", "culture"],
  "moods": ["point de ralliement", "coin calme"],
  "best_for": ["verre simple", "groupe"],
  "avoid_if": ["tu cherches une scène musicale"],
  "services": {
    "terrasse": "oui",
    "food": "oui",
    "couvert": "non communiqué",
    "pmr": "non communiqué",
    "chauffage": "non communiqué"
  },
  "music": "ambiance à décrire simplement",
  "sound": "bas / moyen / élevé selon moment",
  "review_plus": ["ce qui rend le lieu utile"],
  "review_watch": ["ce qu'il faut garder en tête"],
  "confidence": "moyen",
  "description": "Deux phrases maximum. Ce que le lieu apporte au radar, sans pub.",
  "guide_note": "Conseil terrain court : quand y aller, pour quel usage.",
  "sources": ["site officiel", "réseau social public"],
  "events": [],
  "website": "https://...",
  "instagram": "https://www.instagram.com/...",
  "link_confidence": "bon",
  "short": "Accroche courte, humaine, très scannable.",
  "decision_for": ["usage principal"],
  "decision_avoid": ["cas où éviter"]
}
```

## Sections

- `bars` : bar, café, buvette, terrasse, point de ralliement.
- `night` : salle, club, lieu de nuit ou programmation forte.
- `venue` : salle ou lieu culturel qui n'est pas un bar de passage.

## Règle éditoriale

Une fiche doit aider à décider vite. Si l'info n'est pas confirmée, écrire `non communiqué` plutôt que broder. La voix peut être tranchée, mais les faits doivent rester sobres.
