# Pokemon Eclipse

A modern Pokémon-inspired web experience built with React, TypeScript, and Vite. Pokemon Eclipse combines interactive Pokémon tools with a long-term vision of becoming a full-featured browser-based Pokémon RPG set in the Eclipse Region.

## Badges

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-blue?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-blue?logo=tailwindcss)
![PokéAPI](https://img.shields.io/badge/PokéAPI-Integrated-blue)
![Responsive](https://img.shields.io/badge/Responsive-320px%E2%80%934K-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Live Demo

**[pokemon-eclipse.vercel.app](https://pokemon-eclipse.vercel.app/)**

---

## Project Overview

Pokemon Eclipse is a web application that provides a modern interface for exploring Pokémon data, building competitive teams, engaging in turn-based battles, and testing your knowledge through an interactive challenge system. The project demonstrates professional frontend development with TypeScript, 3D graphics, responsive design, and API integration.

This is an active portfolio project that is evolving toward a full-featured browser-based Pokémon RPG. The current release focuses on polished gameplay mechanics and responsive user experience. Future phases will introduce an open-world adventure mode set in the Eclipse Region with exploration, NPC interaction, progression systems, and a complete campaign narrative.

### Current Application Capabilities

- **Interactive Pokédex**: Real-time search across 1,000+ Pokémon with official artwork, stats, and abilities
- **Team Builder**: Compose and persist 6-Pokémon teams with type coverage analysis
- **Battle Arena**: Turn-based combat system with damage simulation and statistics tracking
- **Challenge Mode**: Timed trivia game with progressive difficulty tiers
- **Responsive Experience**: Optimized layouts from mobile phones (320px) to 4K displays
- **Modern UI**: Dark-themed interface with custom color schemes and smooth animations

---

## Current Features

### Core Functionality

- **Interactive Pokédex**: Search and view detailed information for 1,000+ Pokémon
- **Team Builder**: Create, save, and manage competitive 6-Pokémon teams
- **Battle Arena**: Turn-based combat with opponent AI and damage calculations
- **Challenge Mode**: Timed silhouette identification game with three difficulty levels
- **3D Graphics**: Interactive 3D model rendering with smooth animations
- **Music System**: Procedurally generated background music with toggle control
- **Theme Switching**: Dark and light theme options with persistent storage
- **Responsive Design**: Fully optimized for phones, tablets, and desktop displays

### Technical Features

- TypeScript for full type safety with zero runtime type errors
- Responsive grid layouts tested across 8+ device breakpoints (320px to 4K)
- Touch-friendly interface with minimum 44px interaction targets
- No horizontal scrolling on any device size
- 60fps animations and transitions
- Local storage persistence for teams and user preferences

---

## Responsive Design

The application is optimized for all device sizes with adaptive layouts and touch-friendly interfaces.

| Device | Breakpoint | Layout | Navigation |
|--------|-----------|--------|-----------|
| Small Phone | 320px - 374px | Single-column, stacked cards | Hamburger menu |
| Phone | 375px - 639px | Single-column, optimized spacing | Hamburger menu |
| Tablet | 640px - 1023px | 2-column grid, dual panels | Full navigation |
| Laptop | 1024px - 1919px | 3-column grid, expanded layout | Full navigation |
| Desktop 4K | 1920px+ | Full-width, optimized for cinema displays | Full navigation |

**Key Requirements:**
- All interactive elements are 44px minimum (WCAG AA standard)
- Zero horizontal scrolling at any breakpoint
- 60fps animations on mobile devices
- Touch gestures optimized for all screen sizes

---

## Story Overview: The Eclipse Region

### Setting

A celestial event known as the Great Eclipse plunges the Eclipse Region into darkness. This phenomenon awakens Eclipse Shards—fragments of crystalline energy scattered across the land—which corrupt wild Pokémon and attract those seeking power.

### Characters

| Character | Role |
|-----------|------|
| **Professor Nova** | Lead researcher investigating the Eclipse phenomenon |
| **Kai** | Childhood rival and fellow trainer |
| **Team Umbra** | Organization harvesting Eclipse Shards for their own purposes |
| **Eclipseon** | Legendary Pokémon tied to the Eclipse and the region's fate |

### The Quest

As a trainer entering this darkened land, your objectives are to:

1. Uncover the mystery of the Great Eclipse and the Eclipse Shards
2. Build a strong team of Pokémon to face the challenges ahead
3. Discover Team Umbra's plans and their connection to the Eclipse
4. Encounter Eclipseon and determine the region's future

---

## Future Vision

Pokemon Eclipse is evolving from a feature-rich demonstration into a full-featured browser-based Pokémon RPG. The long-term roadmap includes adventure mode exploration, complete progression systems, multiplayer features, and mobile platform support.

### Planned Major Systems

**Adventure Mode & Exploration**
- Open-world Eclipse Region exploration
- Dynamic wild Pokémon encounters
- NPC dialogue system with branching conversations
- Multiple towns and route networks
- Environmental storytelling and discovery

**Progression & Battle Systems**
- XP-based leveling and Pokémon growth
- Evolution chains with multiple evolution paths
- Comprehensive move learning and move sets
- Trainer battles with AI decision-making
- Gym Leaders with signature team compositions

**Game Depth**
- Complete inventory system
- Day/night cycle affecting game events and spawns
- Dynamic weather system with gameplay implications
- Item economy and merchant shops
- Pokémon catching and wild encounter mechanics

**RPG Campaign**
- Team Umbra story questline
- Gym badge progression system
- Elite Four challenge
- Legendary Pokémon encounters
- Post-game content and superbosses

**Platform Support**
- Gamepad and controller support (Xbox, PlayStation, Nintendo Switch)
- Mobile touch controls and virtual joystick
- Firebase authentication and cloud saves
- Progressive Web App (PWA) capabilities
- Native mobile app versions (iOS/Android)

---

## Technology Stack

### Current Architecture

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend Framework | React 19 | Component-based UI |
| Language | TypeScript | Type-safe code |
| Build Tool | Vite 5 | Fast development and production builds |
| Styling | Tailwind CSS | Responsive utility-first CSS |
| 3D Graphics | Three.js, React Three Fiber | Interactive 3D rendering |
| Animations | GSAP | Smooth transitions and effects |
| Data Source | PokéAPI | Real-time Pokémon data |
| State Management | React Hooks | Local state management |
| Storage | Local Storage | Persistent user data |
| Audio | Web Audio API | Procedural music generation |

### Planned Technologies

- **Phaser.js**: 2D game engine for adventure and battle systems
- **Firebase**: Authentication, cloud storage, and cloud functions
- **WebGL Shaders**: Advanced visual effects and post-processing
- **Service Workers**: Offline support and PWA capabilities

---

## Roadmap

### Completed

- Interactive Pokédex with PokéAPI integration
- 6-Pokémon team builder with persistence
- Turn-based battle arena with combat simulation
- Challenge mode with difficulty progression
- Fully responsive design across all breakpoints
- Theme switching system
- Procedural music generation
- Mobile hamburger navigation
- Accessibility compliance (WCAG AA)

### In Progress

- RPG design documentation and planning
- Adventure mode foundation
- NPC dialogue system architecture

### Planned

**Version 2.0: Adventure Foundation**
- Open-world Eclipse Region map
- Wild Pokémon encounter system
- Comprehensive NPC dialogue trees
- Trainer battle encounters
- Environmental exploration mechanics

**Version 2.5: Progression Systems**
- Experience points and leveling
- Pokémon evolution system
- Move learning and move sets
- Item inventory system
- Shop and merchant system

**Version 3.0: Campaign Content**
- Gym Leaders and badge system
- Elite Four challenge
- Team Umbra story campaign
- Legendary Pokémon encounters
- Day/night cycle and weather system

**Version 3.5: Platform Expansion**
- Gamepad and controller support
- Mobile touch controls
- Firebase authentication
- Cloud save system
- PWA capabilities

---

## Getting Started

### Requirements

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Aaryan-2903/pokemon-eclipse.git
   cd pokemon-eclipse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

### Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

The build output is optimized and ready for deployment to any static hosting service.

---

## Developer

**Aaryan Mandal**

A developer interested in interactive web experiences, game development, and modern frontend engineering. Pokemon Eclipse serves as an exploration of full-stack web development concepts, API integration, 3D graphics, and responsive design.

### Connect

- GitHub: https://github.com/Aaryan-2903
- LinkedIn: https://www.linkedin.com/in/aryan-mandal-94b66b278
- Instagram: https://www.instagram.com/7.aary4n
- X: https://x.com/aryanmandal2907
- Email: alonexcyrax@gmail.com

---

## License

Pokemon Eclipse is distributed under the MIT License. See [LICENSE](LICENSE) for details.

### Disclaimer

Pokemon Eclipse is a fan-made educational and portfolio project created for learning, experimentation, and web development purposes. It is not affiliated with The Pokémon Company, Nintendo, or Game Freak. All Pokémon intellectual property belongs to their respective owners.
