# AurelStack

Base de projet pour créer une API REST avec Node.js, Express 5, TypeScript et MySQL. Le dépôt fournit des exemples d'authentification JWT, de validation Zod, d'accès aux données avec Prisma, de tâches asynchrones et de configuration.

## Fonctionnalités

- Express 5 et TypeScript en mode strict
- Authentification JWT et hachage des mots de passe avec bcrypt
- Validation des entrées avec Zod
- Accès à MySQL avec Prisma et l'adaptateur MariaDB
- Rate limiting, CORS et vérification de clé API
- Envoi d'emails avec Nodemailer
- Files de tâches Bull avec Redis, workers et exemple de tâche cron
- Gestion centralisée des erreurs et pages HTML d'erreur

## Prérequis

- Node.js 18 ou supérieur et npm
- Redis pour utiliser les queues Bull
- MySQL compatible avec l'adaptateur MariaDB utilisé par Prisma

Ce starter utilise désormais MySQL uniquement. MongoDB n'est pas une option prise en charge.

<!-- AURELSTACK_GENERATOR_DOC_START -->
## Créer un nouveau projet

Depuis le dépôt AurelStack, lancez le générateur avec un nom npm en minuscules :

```bash
npm run create -- mon-api
```

Par défaut, le projet est créé dans un dossier voisin du dépôt AurelStack. Pour choisir une destination :

```bash
npm run create -- mon-api ..\mes-projets\mon-api
```

Le générateur copie le code, adapte le nom du package, crée un `.env` avec des clés aléatoires et n'inclut ni `.git`, ni `node_modules`, ni `dist`, ni le générateur. Il refuse d'écraser une destination existante.
<!-- AURELSTACK_GENERATOR_DOC_END -->

## Installation

```bash
git clone https://github.com/Aurel667/node-express-typescript-boilerplate.git
cd node-express-typescript-boilerplate
npm install
```

Créez un fichier `.env` à la racine. Exemple pour un développement local avec MySQL :

```env
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

DATABASE_URI=mysql://user:password@localhost:3306/database_name

API_KEY=replace-with-a-local-api-key
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis / Bull
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# REDIS_URL est également lu par la configuration, mais la connexion Bull
# utilise actuellement REDIS_HOST, REDIS_PORT et REDIS_PASSWORD.
REDIS_URL=redis://127.0.0.1:6379

# Email (facultatif)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

MAX_FILE_SIZE=10485760
UPLOAD_PATH=public/uploads
LOG_LEVEL=info
```

`API_KEY` est vérifiée par le middleware sur les requêtes de l'application. Envoyez-la dans l'en-tête `x-api-key`. En production, définissez des secrets propres à l'environnement et ne réutilisez pas les exemples ci-dessus.

## Développement et commandes

```bash
npm run dev          # Lance l'API et le worker avec rechargement automatique
npm run worker:dev   # Lance uniquement le worker
npm run type-check   # Vérifie les types TypeScript
npm run build        # Compile dans dist/
npm start            # Lance les entrées compilées de l'API et du worker
npm run worker:start # Lance uniquement le worker compilé
npm run clean        # Supprime dist/
```

En production, compilez d'abord avec `npm run build`, puis lancez `npm start`. Le script utilise `concurrently` pour démarrer l'API (`dist/index.js`) et le worker compilé (`dist/workers/index.worker.js`) dans des processus séparés, de manière compatible avec les différents shells. Le worker utilise Bull et Redis. Assurez-vous que MySQL et Redis sont démarrés avant de lancer l'application.

### Prisma / MySQL

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:deploy
npm run prisma:reset
```

`prisma:reset` réinitialise la base et peut supprimer des données ; utilisez-le uniquement lorsque c'est voulu.

## API

Les routes sont préfixées par `/api`. Le middleware de clé API est monté avant les routes : ajoutez donc `x-api-key` aux requêtes, y compris à la vérification de santé.

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/health` | Vérification de santé |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Informations de l'utilisateur connecté |
| GET | `/api/users` | Liste des utilisateurs |

Exemple de connexion :

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: replace-with-a-local-api-key" \
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\"}"
```

La connexion dépose également le JWT dans un cookie nommé `token`. Les routes protégées utilisent ce jeton.

## Queues, workers et tâches cron

- Les queues Bull sont définies dans `src/queues/`.
- Les processeurs de tâches sont définis dans `src/jobs/`.
- Le point d'entrée du worker est `src/workers/index.worker.ts`.
- Les tâches planifiées avec `node-cron` sont définies dans `src/cron/`.

Les exemples sont à adapter aux besoins de l'application. Le worker est lancé séparément de l'API en développement par le script `dev`.

## Structure du projet

```text
prisma/                 Schéma et migrations Prisma
public/                 Fichiers statiques
src/
  config/               Configuration, MySQL, Prisma, Redis et email
  controllers/          Contrôleurs HTTP
  cron/                 Exemples de tâches planifiées
  generated/prisma/     Client Prisma généré
  html/                 Pages d'erreur HTML
  jobs/                 Processeurs Bull
  middlewares/          Authentification, API key et erreurs
  queues/               Définition des queues Bull
  routes/               Routes Express
  repositories/          Accès aux données MySQL
  utils/                Fonctions utilitaires
  validation/           Schémas de validation
  workers/              Point d'entrée des workers
  index.ts              Point d'entrée de l'API
```

## Ajouter une fonctionnalité

1. Ajouter ou modifier le modèle dans `prisma/schema.prisma`.
2. Créer ou mettre à jour le repository correspondant dans `src/repositories/`.
3. Ajouter la validation dans `src/validation/`.
4. Implémenter le contrôleur dans `src/controllers/`.
5. Déclarer les routes dans `src/routes/` et les monter dans `src/index.ts`.

## Sécurité et configuration de production

- Utilisez des valeurs secrètes uniques pour `API_KEY` et `JWT_SECRET`.
- Configurez `CORS_ORIGIN` avec l'origine réelle de votre frontend.
- Activez HTTPS en production pour les cookies sécurisés.
- N'exposez pas Redis ou les bases de données publiquement sans contrôle d'accès.
- La clé API est appliquée globalement dans l'exemple ; adaptez le middleware si certains endpoints doivent être publics.

## Licence

Le dépôt indique une licence MIT. Consultez le fichier de licence du projet pour ses conditions.
