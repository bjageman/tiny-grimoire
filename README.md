# 📖 BotC Grimoire & Draft Companion

A lightweight storyteller and setup companion web application for **Blood on the Clocktower** (BotC) storytellers. It offers two distinct modes: standard manual grimoire tracking and the custom **"Whale Bucket"** preference draft mode.

## Core Features

### 1. Standard Setup Mode
Classic manual storyteller mode:
- **Custom Script Support** — Upload custom `.json` script files to automatically load character lists, icons, and attributes.
- **Manual Assignment** — Fully dictate player assignments, set Drunk/Marionette status, and adjust team composition.
- **Interactive Grimoire** — Responsive, circular layout showing alive status, dead votes, traveler characters, custom storyteller notes, and game phase states (Day/Night toggles).

### 2. Whale Bucket Draft Mode
Semi-randomized player preference draft:
- **Preference Drafting** — Add players and let them submit up to 4 preferred roles for Townsfolk, Outsider, Minion, and Demon teams.
- **Auto-Distribution Algorithm** — Assigns roles matching player inputs, respects official team counts for 5–15 players, and dynamically resolves complex setup roles and jinxes:
   - **Legion** — ~60% of players become Legion, the rest get Townsfolk roles.
   - **Riot** — Demon + Minion count players become Riot, the rest Townsfolk.
   - **Atheist** — All-Townsfolk/Outsider grimoire with no evil team.
   - **Baron / Fang Gu / Balloonist / Godfather** — Outsider count adjustments are applied automatically.
   - **Choirboy ↔ King / Huntsman ↔ Damsel** — Linked-role jinxes are enforced.

All state is persisted to `localStorage`, so refreshing the page won't lose your storyteller grimoire.

## Included Roles

The app ships with the full catalogue of official BotC roles across all standard editions:

| Team | Count |
|------|-------|
| Townsfolk | 60+ |
| Outsider | 20+ |
| Minion | 25+ |
| Demon | 15+ |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

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

## License

This project is licensed under the [MIT License](LICENSE).

### Disclaimer
This project is not affiliated with or endorsed by The Pandemonium Institute.
Blood on the Clocktower is a trademark of Steven Medway and The Pandemonium Institute.
