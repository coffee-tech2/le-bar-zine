# Template ajout d'event

Copier un bloc dans `data/events.json`, remplacer les valeurs, puis vérifier la virgule avec l'entrée précédente/suivante.

```json
{
  "id": "lieu-titre-2026-05-14",
  "title": "Titre de l'event",
  "date_label": "jeu. 14 mai 2026 · 20h00",
  "area": "Quartier",
  "venue": "Nom du lieu",
  "category": "concert",
  "tags": [
    "local",
    "concert",
    "alternatif"
  ],
  "description": "Une phrase claire, située, éditoriale. Pourquoi cet event mérite d'être dans le radar ?",
  "source": "Nom de la source officielle",
  "url": "https://...",
  "status": "vérifié"
}
```

## Champs

- `id` : unique, en minuscules, sans accents, format conseillé `lieu-titre-aaaa-mm-jj`.
- `title` : titre public de l'event.
- `date_label` : texte affiché dans l'app. Garder le format `jour. JJ mois AAAA · HHhMM` quand possible.
- `area` : quartier ou zone lausannoise.
- `venue` : lieu exact, collectif ou point de rendez-vous.
- `category` : `concert`, `club`, `manif`, `lecture`, `expo`, `atelier`, `rencontre`, `discussion`, `appel`, etc.
- `tags` : 3 à 6 tags courts, utiles pour la recherche.
- `description` : pas une pub. Une phrase humaine, factuelle, avec l'angle Bar Zine.
- `source` : d'où vient l'info.
- `url` : lien officiel, billetterie, page du collectif, post source.
- `status` : `vérifié`, `récurrent`, `ouvert`, ou `à compléter`.

## Règle éditoriale

Ne pas viser l'exhaustivité. Mieux vaut peu d'events bien choisis, sourcés, et cohérents avec le radar, qu'un agenda rempli de dates froides.
