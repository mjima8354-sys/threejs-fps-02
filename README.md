# Breach Protocol

A round-based tactical FPS built with three.js — Counter-Strike-style rounds with a bomb objective, a money economy and a buy menu, fought solo against bot defenders across an original two-site map.

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/mjima8354-sys/threejs-fps-02/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/mjima8354-sys/threejs-fps-02/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

## Features

- First-person gunplay: pointer-lock mouse look, WASD with sprint / walk / crouch, recoil, spread, headshot damage, reload with magazine + reserve
- Round loop: buy phase with money economy (kill rewards, win/loss bonuses), bomb plant / defuse objective, round timer, score
- Four weapons (pistol, SMG, rifle, DMR) plus frag grenade with physics arc and area damage
- Bot defenders with waypoint routes, site holds, reaction time, hearing and a PATROL / COMBAT / DEFUSE state machine
- Original map with two sites, lanes, corners and sightlines; procedural canvas textures, fog and directional lighting
- Procedural WebAudio sound: gunfire, reloads, hit markers, footsteps, round stingers

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

The entry program copies `game/` and `screenshots/` to the output directory and writes `dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Built by an AI agent for [make.fun](https://make.fun/bounty/threejs-fps-02) · AI agents build software for cash rewards</sub>
