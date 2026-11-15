# BRIEF: "BREACH PROTOCOL" — a round-based tactical FPS on three.js 0.187.0

You are building a complete, high-quality single-player round-based tactical FPS (Counter-Strike STYLE, never a copy: original map, original names, original art). The starter in this directory works; REPLACE the placeholder game under `game/src/` and `game/index.html` with a real game, and write your own `main.ts` at the repo root (same behavior as the starter's: copy game/ and screenshots/ to /output, write /output/dossier.json with buildDossier from ./vendor/makefun-three.ts with the same caps — keep it short). Keep everything else (game/vendor/three/*, serve.ts, shots.json) as is.

## Hard technical rules (the scorer refuses violations)
- game/ is static ES modules, no build step, served by `node serve.ts` (open http://localhost:8080). No network requests at runtime; every import is relative or mapped by the importmap already in index.html ("three" -> ./vendor/three/three.module.min.js).
- Do NOT modify anything under game/vendor/. Keep total game/ under ~5 MiB. Source files (.js/.mjs/.css/.html not under vendor, not *.min.js) are what the judge reads; total source shown is capped at 160 KiB, so keep code tight but complete — aim for well-factored modules, no dead code, no duplication.
- Every inline module script and .js file must parse as an ES module.
- Three.js API version 0.187.0: use `THREE` imports from the importmap (e.g. `import * as THREE from 'three';`). No addons beyond what you put under game/vendor yourself (avoid; write your own pointer-lock/mouse-look).

## The game (what the judge ranks, most important first)
1. COMPLETE GAME: first-person view with pointer-lock mouse look + WASD, sprint/walk/crouch, jump, weapon viewmodel that fires (raycast hitscan), reloads, magazine + reserve ammo, recoil and spread, bots that patrol routes, spot the player (line-of-sight + FOV), take cover-ish behavior, shoot back with inaccuracy, rounds that end (eliminate all enemies OR plant/defuse objective), round timer, score, buy phase, HUD (health, armor, ammo, timer, score, minimap optional, kill feed), main menu, pause (Esc handled with pointer lock), win/loss screens.
2. GUNPLAY: fixed timestep simulation (e.g. 60 Hz) separate from rendering; headshot multiplier (check hit height against bot body parts), damage falloff, spread that grows when moving/firing and shrinks when standing still/crouched, recoil pattern (camera kick + recovery), acceleration-based movement with friction, collision with map geometry (AABB world), footsteps.
3. TACTICS: original map with two lanes + mid (A/B sites), bomb objective (player is attacker: pick up / plant at a site with E hold, or eliminate all defenders; bots defend and will move to defuse), money economy (kill reward, round win/loss bonus, buy menu B between rounds with 3-4 weapons: pistol, SMG, rifle, sniper-ish DMR — different damage/fire rate/spread/mag/price — plus 1 grenade type: frag, thrown with physics arc, area damage), bot AI: waypoint routes with site holds, reaction time, hearing gunshots, simple state machine (PATROL/COMBAT/DEFUSE).
4. MAP & LOOK: one authored map built from styled geometry (crates, walls, ramps, doorframes, site markers) with a coherent palette, hemisphere+directional lighting, shadows where cheap, fog, simple procedural textures via CanvasTexture allowed. It must read at a glance and look intentional, not greybox.
5. CODE: modules with one job each (world/map, player, weapons, bots, rounds/economy, hud, audio, main loop). No per-frame allocations in hot loops (reuse vectors). State in one place.

Audio: tiny procedural WebAudio sounds (gunshot, reload, hit marker, footsteps, round start/end) — no asset files needed.

- Keep the starter's screenshot capture hook working: with URL query `?shot=start|play|end` and `&seed=N` the game sets up a deterministic scripted frame for that state (menu/start view, mid-round action, round end), renders it, then freezes and sets `window.__shotReady = true` after it has painted (see starter game/src/main.js runShot for the pattern). No pointer lock is needed in shot mode; bots/autopilot may drive the action. This is how the entry's screenshots are captured.

## Structure to produce
- game/index.html: importmap, HUD DOM (divs/SVG overlay), menu/buy/scoreboard overlays, one module script `./src/main.js`.
- game/src/*.js modules: main.js (boot + loop), world.js (map geometry + collision AABBs), player.js, weapons.js, bots.js, rounds.js (rounds+economy+objective), hud.js, audio.js, effects.js (tracers, impacts, muzzle flash), input.js. You may reorganize but keep ES modules relative.
- Do not add binary assets.

## Definition of done
`node serve.ts` serves a playable game with zero console errors; rounds play start to finish with bots shooting back; buy menu works; bomb plant/defuse works. When finished, print a short summary of files written and any known limitations. Do not touch serve.ts, shots.json, game/vendor/, screenshots/, or anything outside game/ and main.ts.
