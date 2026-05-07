# Le Bar Zine — Lausanne

Un radar éditorial style fanzine pour choisir un bar, suivre des lieux culturels et relayer des events locaux à Lausanne, avec une ligne située côté scènes indépendantes, alternatives et collectives.

**→ Site public prévu : `https://coffee-tech2.github.io/le-bar-zine/`**

## Concept

Pas un annuaire. Pas une map. Un outil de décision rapide et un mini-média local : tu choisis un mood, on te sort les lieux qui collent vraiment, et le zine peut aussi relayer events, manifs, lieux alternatifs et culture underground.

- Filtrage par mood (date, calme, apéro, groupe, solo, nuit, culture)
- "Choisis pour moi" — algo de scoring par mood
- Fiches progressives par bar (ambiance, services, programmation)
- Onglet événements avec agenda, Pride/queer, récurrents et appels locaux
- Page soutien / partenaires pour monétisation légère
- Charte éditoriale située et transparente
- Favoris en localStorage
- 0 backend, 0 dépendance externe

## Stack

- HTML / CSS / JS vanilla
- Data JSON séparée dans `data/bars.json` et `data/events.json`
- Déployable sur GitHub Pages, Netlify Drop ou Vercel en 30 secondes

## Lancer en local

Lancer un petit serveur statique depuis le dossier du projet :

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`. Le double-clic sur `index.html` n'est pas recommandé, car le navigateur peut bloquer le chargement de `data/bars.json`.

## Déploiement rapide

### GitHub Pages
1. Aller dans **Settings → Pages**
2. Choisir **Deploy from a branch**
3. Sélectionner `main` et `/root`
4. Ouvrir `https://coffee-tech2.github.io/le-bar-zine/`

### Netlify Drop
1. Va sur [app.netlify.com/drop](https://app.netlify.com/drop)
2. Glisse le dossier complet du projet
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

Ouvrir `data/bars.json` et ajouter une entrée en suivant le modèle ci-dessus.

Important : comme les données sont chargées depuis un fichier JSON, il faut tester via un petit serveur local plutôt qu'en double-cliquant directement sur `index.html`.

## Ajouter un event ou une manif

Ouvrir `data/events.json` et ajouter une entrée courte, vérifiable et sourcée. Ne pas publier une date, un lieu ou une organisation si l'info n'est pas claire.

Pour les propositions publiques, le bouton "Proposer un event" pointe vers les issues GitHub du projet. Ce lien peut être remplacé par un formulaire, un mail ou un compte Instagram dans `assets/app.js`.

## Ligne éditoriale

Voir `EDITORIAL_CHARTER.md`.

Résumé : le zine n'est pas neutre, il est situé. Il privilégie les scènes locales, les lieux indépendants, les collectifs, les événements associatifs ou militants, et refuse les classements achetés.

## Vérifier les données

```bash
node scripts/validate-data.mjs
```

Le script bloque seulement sur les erreurs structurelles. Les informations prudentes ou à compléter remontent en avertissements pour guider le travail éditorial.

## Roadmap

- [x] Séparer la data dans un `bars.json` externe
- [x] Séparer HTML, CSS et JS
- [x] Afficher une raison de recommandation selon le mood actif
- [x] Améliorer l'expérience mobile
- [x] Ajouter une base agenda / repartage d'events
- [x] Ajouter une page soutien / monétisation légère
- [x] Ajouter une charte éditoriale située
- [ ] Remplacer les liens temporaires soutien / contribution
- [ ] Nettoyer / compléter les sources des fiches bars
- [ ] Migration React / Next.js
- [ ] Gestion des événements semi-automatisée (depuis agendas officiels)
- [ ] Carte optionnelle en complément

---

Données indicatives — horaires et événements à consulter directement auprès des lieux.
