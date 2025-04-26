# Super Mario Game (Upgraded TypeScript Version)

A modernized and enhanced version of the classic **Super Mario** game project originally developed by [Meth Meth Method](https://github.com/meth-meth-method/super-mario).

This project rebuilds and refines the original structure with **TypeScript**, **audio integration**, **modular organization**, and a **production-ready build process**.

> **Note**: This project is intended for educational purposes and learning only.

---

## 🎮 Project Overview

- Playable 2D Mario-style platformer
- Powered by **HTML5 Canvas** and modern **TypeScript**
- Built with a clean **Entity-Component-System** (ECS) architecture
- Modular, scalable, and easy to expand

---

## 🚀 Main Features

- **Entity System**: Mario, Goombas, Koopas, Cannons, Piranha Plants, and more
- **Physics Engine**: Gravity, jumping, collision detection
- **Animation System**: Sprite management with timing control
- **Audio System**: Integrated sound effects and background music
- **Scene Management**: Loading screens, level transitions
- **Input Handling**: Keyboard state tracking and custom input routing
- **Asset Management**: Organized loading of sprites, audio, fonts, and levels
- **Difficulty Service**: Dynamic game difficulty handling
- **Achievement System**: Track player achievements (basic setup)
- **Optimized Build**: Production build with minimized JS and asset organization
- **TypeScript Full Migration**: Strong types and cleaner development experience
- **Code Quality Tools**: ESLint, Prettier, TypeScript configuration

---

## 🛠️ Technologies Used

- [TypeScript](https://www.typescriptlang.org/)
- [HTML5 Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Modern JavaScript (ES6+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) for code quality
- Local static server for development

---

## 📂 Project Structure

```
src/
 └── js/
     ├── entities/       # All entity classes (Mario, Goomba, etc.)
     ├── layers/         # Rendering layers
     ├── loaders/        # Sprite, audio, level, and font loaders
     ├── scenes/         # Scene management (loading screen, level runner)
     ├── services/       # Game services (Achievements, Difficulty, Input, etc.)
     ├── game.ts         # Game entry point
     └── ...             # Utility and core logic files
dist/
 └── assets/             # Production JS bundle and audio assets
```

---

## ⚡ Getting Started

### Install a local server (optional)

You need a local server because of ES module imports.

You can use `vite`, `live-server`.

Example using **Vite**:

```bash
npm install
npm run dev
```

Then open your browser at `http://localhost:8000`

### Build for production

```bash
npm run build
```

Resulting files will appear in `/dist`.

---

---

## 📜 Credits

- **Original Project**: [Meth Meth Method - Super Mario](https://github.com/meth-meth-method/super-mario)

---
