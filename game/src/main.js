import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createWeapon, WEAPON_DEFS } from './weapon.js';
import { createBots } from './bots.js';
import { createRoundManager } from './rounds.js';
import { createHud } from './hud.js';
import { audio } from './audio.js';

const FIXED_STEP = 1 / 60;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

function mulberry32(initial) {
  let a = initial;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(seed);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#2d3644');
scene.fog = new THREE.Fog(new THREE.Color('#2d3644'), 25, 90);

const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.05, 140);
scene.add(camera);

const world = createWorld(scene);
scene.traverse((obj) => {
  if (obj instanceof THREE.HemisphereLight) {
    obj.intensity = 3.8;
    obj.color.set('#f4f7fc');
    obj.groundColor.set('#5a657c');
  } else if (obj instanceof THREE.DirectionalLight) {
    obj.intensity = obj.intensity > 2 ? 4.8 : 2.5;
  }
});
const bots = createBots(scene, world.colliders);
const weapon = createWeapon(camera);
const hud = createHud();
const player = createPlayer(world.colliders);
const rounds = createRoundManager();
const input = createInput(renderer.domElement, onLockChange);

const raycaster = new THREE.Raycaster();
raycaster.far = 90;
const shootables = world.shootables.concat(bots.hitMeshes);
const direction = new THREE.Vector3();

const body = player.state;
const markerHoldMs = shot ? 4000 : 90;
let score = 0;
let elapsed = 0;
let frozen = false;
let started = false;
let accumulator = 0;
let lastTime = performance.now();
let buyMenuOpen = false;
let scoreboardOpen = false;

hud.setAmmo(weapon.state.mag, weapon.state.reserve);
hud.setScore(0);
hud.onPlay(() => {
  if (shot) return;
  if (rounds.state.phase === 'ended') restartRound();
  input.requestLock();
});

function restartRound() {
  rounds.startBuyPhase();
  player.reset();
  bots.reset();
  weapon.refill();
  hud.setAmmo(weapon.state.mag, weapon.state.reserve);
}

function onLockChange(locked) {
  if (shot) return;
  if (locked) {
    started = true;
    hud.hideOverlay();
    buyMenuOpen = false;
    hud.toggleBuyMenu(false);
  } else if (rounds.state.phase !== 'ended') {
    hud.showOverlay(started ? 'paused' : 'start', score);
  }
}

function syncCamera() {
  camera.position.set(body.position.x, body.position.y + body.eye, body.position.z);
  camera.rotation.set(body.pitch, body.yaw, 0, 'YXZ');
}

function aimAt(point) {
  const dx = point.x - body.position.x;
  const dy = point.y - (body.position.y + body.eye);
  const dz = point.z - body.position.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  body.yaw = Math.atan2(-dx, -dz);
  body.pitch = Math.asin(Math.max(-1, Math.min(1, dy / length)));
  syncCamera();
}

function shoot(spread) {
  if (!weapon.takeRound()) return false;
  audio.playGunshot(weapon.state.type);
  camera.getWorldDirection(direction);
  direction.x += (random() * 2 - 1) * spread;
  direction.y += (random() * 2 - 1) * spread;
  direction.z += (random() * 2 - 1) * spread;
  direction.normalize();
  scene.updateMatrixWorld(true);
  raycaster.set(camera.position, direction);
  const hit = raycaster.intersectObjects(shootables, false)[0];
  if (hit && hit.object.userData.bot) {
    const isHead = hit.object.userData.part === 'head';
    const dmg = isHead ? 100 : weapon.state.damage;
    const res = bots.damage(hit.object, dmg);
    score += res.killed ? 200 : 25;
    hud.setScore(score);
    audio.playHit(res.killed);
    hud.hitMarker(res.killed, markerHoldMs);
  }
  weapon.pullTrigger();
  player.recoil(0.01 + random() * 0.005, (random() * 2 - 1) * 0.005);
  hud.setAmmo(weapon.state.mag, weapon.state.reserve);
  return true;
}

function handleInputEvents() {
  if (input.consumePressed('KeyB') && rounds.state.phase === 'buy') {
    buyMenuOpen = !buyMenuOpen;
    hud.toggleBuyMenu(buyMenuOpen);
    if (buyMenuOpen && document.pointerLockElement) document.exitPointerLock();
    else if (!buyMenuOpen && started) input.requestLock();
  }
  if (input.consumePressed('Tab')) {
    scoreboardOpen = !scoreboardOpen;
    hud.toggleScoreboard(scoreboardOpen);
  }
  if (input.consumePressed('KeyR')) {
    weapon.reload();
    audio.playReload();
  }
  if (input.consumePressed('Digit1')) { if (weapon.selectWeapon('pistol')) hud.setAmmo(weapon.state.mag, weapon.state.reserve); }
  if (input.consumePressed('Digit2')) { if (weapon.selectWeapon('smg')) hud.setAmmo(weapon.state.mag, weapon.state.reserve); }
  if (input.consumePressed('Digit3')) { if (weapon.selectWeapon('rifle')) hud.setAmmo(weapon.state.mag, weapon.state.reserve); }
  if (input.consumePressed('Digit4')) { if (weapon.selectWeapon('dmr')) hud.setAmmo(weapon.state.mag, weapon.state.reserve); }

  // Buy weapon keys when buy menu is open
  if (buyMenuOpen) {
    if (input.consumePressed('Digit1')) buyWeapon('pistol');
    if (input.consumePressed('Digit2')) buyWeapon('smg');
    if (input.consumePressed('Digit3')) buyWeapon('rifle');
    if (input.consumePressed('Digit4')) buyWeapon('dmr');
  }

  // Plant bomb with E
  if (input.consumePressed('KeyE')) {
    if (!rounds.state.bombPlanted && rounds.state.phase === 'live') {
      rounds.startPlanting(body.position, world.sites);
    }
  }
}

function buyWeapon(key) {
  const def = WEAPON_DEFS[key];
  if (body.money >= def.price) {
    body.money -= def.price;
    weapon.inventory[key].owned = true;
    weapon.inventory[key].mag = def.mag;
    weapon.inventory[key].reserve = def.reserve;
    weapon.selectWeapon(key);
    hud.setAmmo(weapon.state.mag, weapon.state.reserve);
  }
}

function step(dt) {
  elapsed += dt;
  handleInputEvents();

  if (!buyMenuOpen && !scoreboardOpen) {
    player.step(dt, input.state.keys);
    weapon.step(dt);
  }

  rounds.step(dt, player, bots, world.sites);
  if (rounds.state.planting) {
    const planted = rounds.updatePlanting(dt, body.position, world.sites);
    hud.setPlantProgress(rounds.state.plantProgress, rounds.PLANT_TIME);
    if (planted) {
      hud.setPlantProgress(0, rounds.PLANT_TIME);
    }
  } else {
    hud.setPlantProgress(0, rounds.PLANT_TIME);
  }

  bots.step(dt, elapsed, body.position, world.shootables, rounds.state.bombPlanted, rounds.state.bombSite ? rounds.state.bombSite.center : null, (botPos, targetPos) => {
    // Bot shoots player
    const fatal = player.damage(22);
    audio.playGunshot('smg');
    hud.hitMarker(fatal, 120);
    if (fatal && rounds.state.phase !== 'ended') {
      rounds.endRound('defenders', 'Operator eliminated');
      hud.showOverlay('end', score);
      if (document.pointerLockElement) document.exitPointerLock();
    }
  });

  hud.setStatus(Math.floor(body.health), Math.floor(body.armor), body.money, rounds.state.timer, rounds.state.roundNumber, rounds.state.phase);

  if (rounds.state.phase === 'ended' && !document.pointerLockElement && !overlayVisible()) {
    hud.showOverlay('end', score);
  }
}

function overlayVisible() {
  return !document.getElementById('overlay').hidden;
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (!frozen) {
    const look = input.takeLook();
    player.look(look.x, look.y);
    if (input.state.firing && weapon.ready() && rounds.state.phase !== 'buy' && !buyMenuOpen && !scoreboardOpen) {
      shoot(shot ? 0 : weapon.spread(player.groundSpeed()));
    }
    accumulator += dt;
    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < 5) {
      step(FIXED_STEP);
      accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (accumulator > FIXED_STEP * 5) accumulator = 0;
    syncCamera();
  }
  renderer.render(scene, camera);
}

function settle(steps) {
  for (let index = 0; index < steps; index += 1) step(FIXED_STEP);
}

function runShot(name) {
  hud.hideOverlay();
  body.pitch = 0;
  body.yaw = 0;
  if (name === 'play') {
    body.position.set(0, 0, 2);
    body.pitch = 0;
    body.yaw = 0;
    syncCamera();
    settle(10);
    rounds.startLivePhase();
    settle(20);
  } else if (name === 'end') {
    body.position.set(0, 0, 2);
    settle(15);
    rounds.startLivePhase();
    const count = bots.bots.length;
    for (let index = 0; index < count; index += 1) {
      const b = bots.bots[index];
      const point = new THREE.Vector3(b.group.position.x, 1.4, b.group.position.z);
      for (let round = 0; round < 3; round += 1) {
        aimAt(point);
        shoot(0);
        if (round < 2) settle(6);
      }
    }
    settle(30);
    rounds.endRound('attackers', 'All defenders eliminated');
    score = Math.max(score, 1200);
    hud.setScore(score);
    hud.showOverlay('end', score);
    if (document.pointerLockElement) document.exitPointerLock();
    settle(15);
  } else {
    body.position.set(0, 0, 13);
    rounds.startBuyPhase();
    settle(20);
    aimAt(new THREE.Vector3(0, 1.5, -6));
    hud.showOverlay('start', 0);
  }
  hud.setScore(score);
  hud.setAmmo(weapon.state.mag, weapon.state.reserve);
  paintTwiceThenReady();
}

function paintTwiceThenReady() {
  let painted = 0;
  function paint() {
    requestAnimationFrame(paint);
    syncCamera();
    renderer.render(scene, camera);
    painted += 1;
    if (painted === 2) {
      window.__shotReady = true;
      frozen = true;
    }
  }
  requestAnimationFrame(paint);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

syncCamera();
if (shot) runShot(shot);
else requestAnimationFrame(frame);
