# Analyse projet — Le Bar Zine

## Diagnostic rapide

Le Bar Zine a une bonne idée de départ : ce n'est pas un annuaire de bars, c'est un outil de décision. La proposition est plus forte quand l'app répond vite à une situation concrète : date, groupe, calme, terrasse, nuit, culture.

Ce qui fonctionne déjà :

- angle éditorial clair, plus mémorable qu'une simple liste ;
- interface utilisable sans compte, sans backend et sans dépendance ;
- données assez riches pour produire des recommandations nuancées ;
- favoris locaux, recherche et fiches détaillées déjà présents ;
- déploiement facile sur GitHub Pages.

Ce qui limitera vite le projet si on ne change rien :

- tout est dans un seul `index.html`, donc chaque ajout de bar augmente le risque de casser l'app ;
- les données mélangent faits sourcés, impressions éditoriales et points encore prudents ;
- l'algo de scoring est utile mais encore opaque : l'utilisateur ne sait pas toujours pourquoi une adresse sort ;
- les événements sont statiques, alors que c'est la partie qui vieillit le plus vite ;
- le produit n'a pas encore de vraie stratégie mobile autour du geste principal : choisir vite.

## Ce que je ferais différemment

Je garderais volontairement une app statique pour l'instant. React ou Next.js seraient prématurés tant que le vrai sujet est éditorial : qualité des données, clarté de la recommandation, expérience mobile.

Je structurerais le projet comme une petite webapp statique :

- `index.html` : squelette de page uniquement ;
- `assets/styles.css` : identité visuelle et responsive ;
- `assets/app.js` : logique de filtre, scoring, rendu ;
- `data/bars.json` : base éditoriale des lieux ;
- plus tard `data/sources.json` ou champs de vérification pour suivre la fiabilité.

Je renforcerais ensuite le produit dans cet ordre :

1. Données : compléter les liens officiels, distinguer "vérifié" de "info prudente", homogénéiser les tags.
2. Décision : afficher une petite raison de recommandation sur chaque carte selon le mood actif.
3. Mobile : rendre le choix de mood et la recherche plus rapides à utiliser au pouce.
4. Éditorial : créer des sélections prêtes à l'emploi, par exemple "premier date", "groupe de 6", "pluie", "avant concert".
5. Déploiement : publier GitHub Pages, puis brancher un nom de domaine si le projet prend.
6. Automatisation : seulement plus tard, semi-automatiser les événements via liens officiels, jamais comme source unique.

## Position produit

Le bon positionnement n'est pas "tous les bars de Lausanne". C'est plutôt :

> Un guide subjectif mais utile, qui t'aide à choisir un lieu selon l'énergie du moment.

Cette subjectivité est une force si elle est assumée. Il faut éviter de devenir Google Maps en moins complet. L'app doit être plus courte, plus lisible, plus tranchée.

## Priorités techniques

Priorité 1 : rendre le code maintenable sans changer l'expérience.

Priorité 2 : rendre les fiches de bars plus fiables et plus faciles à auditer.

Priorité 3 : améliorer l'expérience de recommandation, notamment en expliquant le choix.

Priorité 4 : vérifier mobile et publier.

## Risques à surveiller

- Données obsolètes : horaires, terrasses, événements et accessibilité changent souvent.
- Ton éditorial trop affirmatif : il faut garder les formulations prudentes quand une info n'est pas vérifiée.
- Liste trop longue : si l'app grossit, elle doit rester un outil de décision, pas une encyclopédie.
- Dépendance à Instagram : beaucoup de lieux publient là, mais ce n'est pas une source stable pour une webapp.

## Prochaine étape recommandée

Séparer le code et les données, puis enrichir les fiches en gardant un champ de fiabilité clair. C'est la meilleure base pour faire grandir le projet sans devoir tout refaire.
