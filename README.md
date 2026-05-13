# pendler-alarm Dashboard

Ein simples PWA-Dashboard für alle GitHub Issues der Organisation **pendler-alarm**.

## Features

- 🔐 **GitHub-Authentifizierung** – nur freigegebene Benutzer erhalten Zugang (Personal Access Token oder GitHub OAuth Device Flow)
- 📋 **Issue-Übersicht** – alle offenen/geschlossenen Issues aus allen Repositories der Organisation
- 🔎 **Filter** – nach Status, Repository, Priorität, Label, Milestone und Benutzer
- 🔗 **Direkte Links** – zum Anzeigen und Bearbeiten jedes Issues auf GitHub
- 📱 **PWA** – installierbar, offline-fähig, automatische Updates
- 🔄 **Auto-Refresh** – automatische Aktualisierung alle 60 Sekunden

## Tech Stack

- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Bootstrap 5](https://getbootstrap.com/)
- [Pinia](https://pinia.vuejs.org/) (State Management)
- [Vue Router 4](https://router.vuejs.org/)
- [Vite](https://vite.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Konfiguration

Kopiere `.env.example` nach `.env` und passe die Werte an:

```bash
cp .env.example .env
```

```env
# Optional: GitHub OAuth App Client ID für Device Flow Login
# Wichtig: Das ist die öffentliche OAuth App Client ID (kein Secret, kein PAT)
VITE_GITHUB_CLIENT_ID=your_client_id_here

# Komma-separierte Liste erlaubter GitHub-Logins (leer = alle authentifizierten Nutzer)
VITE_ALLOWED_USERS=user1,user2,user3

# Komma-separierte Liste ausgeblendeter Repositories
VITE_REPO_BLACKLIST=dashboard_old
```

### 3. Entwicklungsserver starten

```bash
npm run dev
```

### 4. Produktions-Build

```bash
npm run build
npm run preview
```

## Anmeldung

Das Dashboard unterstützt zwei Anmeldemethoden:

### Personal Access Token (PAT)
1. Gehe zu [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Erstelle einen neuen Token mit den Scopes: `repo`, `read:org`
3. Gib den Token im Login-Formular ein

### GitHub OAuth Device Flow (optional)
Wenn `VITE_GITHUB_CLIENT_ID` konfiguriert ist:
1. Klicke auf „Mit GitHub OAuth anmelden"
2. Besuche den angezeigten Link und gib den Code ein
3. Das Dashboard authentifiziert sich automatisch

## GitHub Pages Deployment

Das Dashboard wird automatisch via GitHub Actions auf GitHub Pages deployed.

### Deployment-URL

Nach dem Setup ist das Dashboard erreichbar unter:
**https://pendler-alarm.github.io/dashboard/**

### Ersteinrichtung (einmalig)

1. Gehe zu **Settings → Pages** im Repository `pendler-alarm/dashboard`.
2. Wähle unter **Source** die Option **GitHub Actions**.
3. Beim nächsten Push auf `main` (oder manuell über **Actions → Deploy to GitHub Pages → Run workflow**) wird das Dashboard gebaut und deployed.

### Actions-Variablen für Build/Deploy

Setze unter **Settings → Secrets and variables → Actions → Variables**:

- `VITE_GITHUB_CLIENT_ID` (optional, für OAuth-Login)
- `VITE_ALLOWED_USERS`
- `VITE_REPO_BLACKLIST`

Diese Werte werden im Deploy-Workflow in den Vite-Build injiziert.

⚠️ **Wichtig:** Alle `VITE_*`-Werte sind im Frontend sichtbar.  
Lege dort **keine Secrets** (z. B. PATs wie `READ_PENDLER_ALARM`) ab.

### Manueller Trigger

Der Workflow kann jederzeit manuell ausgelöst werden:
1. Gehe zu **Actions → Deploy to GitHub Pages**.
2. Klicke auf **Run workflow**.

### Lokale Entwicklung

Die GitHub-Pages-Konfiguration hat keinen Einfluss auf den lokalen Dev-Server (`npm run dev`).
Lokal wird weiterhin `http://localhost:5173/` verwendet.

## Benutzerverwaltung

Setze `VITE_ALLOWED_USERS` auf eine komma-separierte Liste der erlaubten GitHub-Logins:

```env
VITE_ALLOWED_USERS=alice,bob,charlie
```

Ist die Variable leer, kann jeder authentifizierte GitHub-Nutzer das Dashboard sehen.

## Repository-Blacklist

Setze `VITE_REPO_BLACKLIST` auf eine komma-separierte Liste von Repository-Namen, die im Dashboard komplett ignoriert werden sollen:

```env
VITE_REPO_BLACKLIST=dashboard_old,legacy_repo
```

Blacklisted Repositories erscheinen nicht in der Repo-Auswahl, ihre Issues werden nicht geladen, und zugehörige Labels sowie Milestones werden dadurch ebenfalls nicht berücksichtigt.
