# 

# TP: Coding style et Infra

## Coding style

Si c'était pour mon entreprise:

Coté client:

- Utiliser les conventions modernes de Javascript (ES2020)
  - Sauf dans le cadre d'un projet legacy avec besoin de supporter des vieux navigateurs. Dans ce cas, toujours se référer à [https://caniuse.com/](https://caniuse.com/)
- Utiliser Typescript dès qu'on est dans le contexte d'un bundler, pour profiter du typage (meilleure robustesse, amélioration de l'aide de l'IDE...)
- Utiliser ESLint pour définir les règles de style
  - Règles de [typescript-eslint.io](https://typescript-eslint.io)
- Utiliser Prettier et configurer son IDE pour formatter automatiquement à l'enregistrement (on évite ainsi des commits de code style faits par une CI)

Coté serveur:

- Suivre les règles de [Wordpress](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/) pour les projets wordpress, afin d'avoir une consistance globale.
- Suivre les règles de [CakePHP](https://book.cakephp.org/4/fr/contributing/cakephp-coding-conventions.html) pour les autres projets (qui étend légèrement le PSR-12). Choix effectué car Cake est le framework le plus utilisé sur les projets passés.

## Choix d'infrastructure

Pour déployer une app similaire à celle de ce TP, mais grande échelle. (10K simultanés en pic, ~ 5M par jour)

On lui ajoute une UI autonome SPA en Vue.js, hébergée sur Firebase hosting.

On réécrit l'API en cloud functions.

On sépare le code node de l'API et celui du worker, pour les mettre chacun dans leur fonction propre. On garde Google PubSub pour les faire communiquer entre eux (avec les functions CloudEvents: [https://cloud.google.com/functions/docs/calling/pubsub](https://cloud.google.com/functions/docs/calling/pubsub)).

On conserve Firebase RTDB

Devs nécessaires: 2

- Un dev back-end et devops
- Un dev front-end pour faire une UI correcte

Services nécessaires:

- PubSub
  - 20B environ par message, donc 100MB par jour
  - Estimation: 0€
- Firebase Realtime Database
  - ~500MB par jour donc ~5GB par mois, on garde les données un mois
  - Estimation 25$/mois
- Google Cloud Storage
  - ~5MB par zip
  - On considère que 10% des utilisateurs uploadent un zip (à ajuster avec des tests UX)
  - Donc 500 000 zips par mois -> 250 GB
  - Estimation: 5$
- Firebase Hosting:
  - 20K par page
  - 1GB par jour de bandwidth
  - Estimation: 3$ par mois
- Google Cloud functions
  - ~ 6M de calls par mois
  - Estimation: 7$
- Coût total: 15$ par mois pour 5M d'utilisateurs journaliers
