# 🏀 Slam Dunk — Morocco Showcase

> An immersive, interactive 3D basketball product showcase inspired by the landscapes and heritage of Morocco.

---

## ✨ Overview

**Slam Dunk Morocco Showcase** is a premium interactive experience built around five limited-edition basketball colorways, each paying tribute to a distinct region of Morocco. Explore and customize a photorealistic 3D basketball, navigate through animated performance screens, and add products to a cart — all with seamless transitions, spatial audio, and cinematic design.

---

## 🎨 Featured Colorways

| # | Name | Edition | Inspired By |
|---|------|---------|-------------|
| 01 | **Morocco** | Marrakech Edition | Terracotta clay tones of Marrakech |
| 02 | **Sahara** | Golden Dust | Sun-drenched dunes of the Sahara |
| 03 | **Atlas** | Cedar Forests | Pine forests of the Atlas Mountains |
| 04 | **Blue City** | Chefchaouen Indigo | The painted blue streets of Chefchaouen |
| 05 | **Fez Royal** | Oud Shadow | The tannery craft and heritage of Fez |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| 3D Rendering | [Three.js](https://threejs.org) |
| Animations | [GSAP](https://greensock.com/gsap/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Linting/Formatting | [Biome](https://biomejs.dev) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=18`
- npm, yarn, pnpm, or bun

### Install & Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/
│   └── layout.tsx          # Root layout & global metadata
└── components/
    ├── Showcase.tsx         # Main experience — products, cart, screens
    ├── BasketballCanvas.tsx # Three.js 3D basketball renderer
    ├── FloatingTriangles.tsx# Decorative animated background elements
    └── LoadingScreen.tsx    # Splash screen while the 3D model loads
```

---

## 🎮 Interaction Guide

| Action | Result |
|--------|--------|
| **Scroll** / **Swipe** | Navigate between the 6 showcase screens |
| **Arrow keys** / Page Up/Down | Keyboard navigation between screens |
| **← / →** arrows | Cycle through basketball colorways |
| **Customize tab** | Pick a preset or custom hex color |
| **Add to Cart** | Animated ball-flight to cart icon with sound |
| **Cart icon** | Opens slide-over cart panel |

---

## 🎵 Sound Design

The showcase features a fully procedural audio engine built on the **Web Audio API** — no external sound files required. Every interaction triggers a unique synthesized sound:

- **Cart** — a layered arc of tones, noise whoosh, and a satisfying bounce
- **Color change** — a bright frequency sweep
- **Navigation** — a low tonal pulse
- **Panel toggle** — a mid-range chime

---

## 📜 Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Biome lint check
npm run format    # Biome auto-format
```

---

## 🌍 Deployment

Deploy instantly on [Vercel](https://vercel.com/new):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

For other platforms, run `npm run build` and serve the `.next` output per your host's Next.js guide.

---

## 📄 License

This project is private. All rights reserved.
