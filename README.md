# 📖 BOTC Grimoire

A comprehensive web app for running **Blood on the Clocktower** in-person. Storytellers manage the full game through an interactive digital grimoire, while players join live sessions from their own devices by syncing with the town square in real time to receive their character token and track the game state.

## Demo

### Full Walkthrough — Desktop Storyteller View + Live Mobile Sync

https://github.com/user-attachments/assets/1cab8e4c-9188-4c05-8126-9c9e35267691

### Mobile Player Experience

https://github.com/user-attachments/assets/0a98e577-8801-45fe-856c-12f75dbfe337

## Core Features

### Auto-Distribution Algorithm
Both modes use a shared distribution engine that respects official team counts for 5–15 players and dynamically resolves complex setup roles and jinxes — for example, Legion and Riot restructure the entire evil team composition, Atheist removes the evil team entirely, Baron and similar roles adjust outsider counts automatically, and linked pairs like Choirboy ↔ King are enforced.

### 1. Standard Setup Mode
Classic manual storyteller mode:
- **Custom Script Support** — Upload custom `.json` script files to automatically load character lists, icons, and attributes.
- **Manual Assignment** — Fully dictate player assignments, set Drunk/Marionette status, and adjust team composition.
- **Interactive Grimoire** — Responsive, circular layout showing alive status, dead votes, traveler characters, custom storyteller notes, and game phase states (Day/Night toggles).

### 2. Whale Buffet Draft Mode
Semi-randomized player preference draft:
- **Preference Drafting** — Add players and let them submit up to 4 preferred roles for Townsfolk, Outsider, Minion, and Demon teams.
- **Randomized Assignment** — Roles are assigned based on player preferences using the shared distribution engine above.

### 3. Live Player Sessions
Players join from their own devices using a 4-letter room code:
- **Character Token Reveal** — Players receive their assigned character token on their device when the grimoire opens.
- **Real-Time Sync** — The town square layout, player statuses, and day/night phase stay in sync across all connected devices.
- **Whale Buffet Preferences** — In Whale Buffet mode, players submit their role preferences directly from their phone before assignment.
- **Player Notes Tracker** — Players can track character claims and alive/dead statuses from their own device throughout the game.

### 4. Installable Web App
The app is installable as a standalone app via "Add to Home Screen" on Android and iOS, giving a full-screen native-app experience without the browser UI.

All state is persisted to `localStorage`, so refreshing the page won't lose your storyteller grimoire.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

Real-time session routing is powered by **ntfy**. A self-hosted ntfy instance is required for practical use — the public `ntfy.sh` server will rate-limit a game session almost immediately.

1. Copy `.env.example` in the root of the project to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set the URL to your self-hosted ntfy server:
   ```env
   VITE_NTFY_SERVER_URL=your-ntfy-server.example.com
   ```
3. If you deploy using Docker or environment configurations, ensure `VITE_NTFY_SERVER_URL` is defined in your environment during build time.

### Development

```bash
npm install
npm run dev
```

The dev server starts at **http://localhost:5173** with hot module replacement.

### Production Build

```bash
npm run build
npm run preview
```

## Docker

### Docker Compose (recommended)

```bash
docker compose up --build
```

The app will be available at **http://localhost:8080**.

```bash
# Run detached
docker compose up --build -d

# Stop
docker compose down
```

### Docker (manual)

```bash
docker build -t botc-grimoire-companion .
docker run -p 8080:80 botc-grimoire-companion
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — build tooling and dev server
- **Tailwind CSS** — styling
- **Lucide React** — icons
- **Nginx** — production static file serving (in Docker)

## Acknowledgements

- **[The Pandemonium Institute](https://bloodontheclocktower.com)** — Creators of Blood on the Clocktower.
- **[botc-icons](https://github.com/tomozbot/botc-icons)** — Role icons used throughout the app are sourced from this project and downloaded automatically at build time.

## License

This project is licensed under the [MIT License](LICENSE).

### Disclaimer
This project is not affiliated with or endorsed by The Pandemonium Institute.
Blood on the Clocktower is a trademark of Steven Medway and The Pandemonium Institute.
