# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a web-based 3D platformer game built with **Next.js 16** and **Three.js**.

### Project Structure

- `app/` - Next.js App Router pages and layout
- `components/` - React components (currently just ForestScene.tsx)

### Core Game Component

The game is implemented in `components/ForestScene.tsx`, a single client-side React component (~710 lines) that handles:

- **Scene setup**: Three.js renderer, camera, lighting, fog
- **Level geometry**: Two levels (forest and ocean) with procedural terrain
- **Player controller**: Movement, jumping, swimming, gravity, collision
- **Input system**: Keyboard (WASD/arrows/space/K) and touch controls for mobile
- **Game mechanics**: Tree chopping, portal transitions between levels, water physics

### Key Patterns

- Uses `'use client'` directive for Three.js rendering
- Manages game state with `useRef` for mutable state (input, player physics) and `useState` for React-rendered UI
- Three.js objects are created in `useEffect` and cleaned up on unmount
- Path alias `@/*` maps to project root (configured in tsconfig.json)

### Controls

- Desktop: WASD/arrows for movement, space to jump/swim, K to chop, mouse to look
- Mobile: Touch D-pad for movement, action buttons for jump/chop/sink
- Shift key sinks faster in water (ocean level)
