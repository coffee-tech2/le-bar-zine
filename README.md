# Le Bar Zine — Lausanne

Un guide éditorial (style fanzine) pour choisir un bar à Lausanne selon ton mood.

**→ [Voir le site](https://ton-url.netlify.app)**

## Concept

Pas un annuaire. Pas une map. Un outil de décision rapide : tu choisis un mood, on te sort les bars qui collent vraiment.

- Filtrage par mood (date, calme, apéro, groupe, solo, nuit, culture)
- "Choisis pour moi" — algo de scoring par mood
- Fiches progressives par bar (ambiance, services, programmation)
- Favoris en localStorage
- 0 backend, 0 dépendance externe

## Stack

- HTML / CSS / JS vanilla
- Data JSON embarquée dans le fichier
- Déployable sur Netlify Drop ou Vercel en 30 secondes

## Déploiement rapide

### Netlify Drop
1. Va sur [app.netlify.com/drop](https://app.netlify.com/drop)
2. Glisse le fichier `index.html`
3. C'est en ligne

### Vercel
```bash
npx vercel --prod
```

## Structure des données

Chaque bar suit ce modèle :

```json
{
  "id": "cafe-grancy",
  "name": "Café de Grancy",
  "area": "Sous-gare",
  "type": "café-bar / restaurant",
  "section": "bars",
  "tags": [],
  "moods": [],
  "best_for": [],
  "avoid_if": [],
  "services": { "terrasse": "", "food": "", "couvert": "", "pmr": "", "chauffage": "" },
  "music": "",
  "sound": "",
  "description": "",
  "guide_note": "",
  "review_plus": [],
  "review_watch": [],
  "confidence": "bon | moyen",
  "events": [],
  "website": "",
  "instagram": ""
}
```

## Ajouter un bar

Ouvrir `index.html`, trouver le tableau `const BARS = [...]` et ajouter une entrée en suivant le modèle ci-dessus.

## Roadmap

- [ ] Séparer la data dans un `bars.json` externe
- [ ] Migration React / Next.js
- [ ] Gestion des événements semi-automatisée (depuis agendas officiels)
- [ ] Carte optionnelle en complément

---

Données indicatives — horaires et événements à vérifier directement auprès des lieux.
