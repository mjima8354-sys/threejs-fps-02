import * as THREE from 'three';
import { PALETTE } from './palette.js';

export const WEAPON_DEFS = {
  pistol: { name: 'Tactician .45', price: 400, mag: 12, reserve: 36, damage: 28, fireRate: 0.18, reloadTime: 1.5, spreadStill: 0.003, spreadMove: 0.02 },
  smg: { name: 'Viper-9', price: 1200, mag: 30, reserve: 90, damage: 22, fireRate: 0.09, reloadTime: 1.8, spreadStill: 0.004, spreadMove: 0.025 },
  rifle: { name: 'Breach Carbine', price: 2900, mag: 30, reserve: 90, damage: 34, fireRate: 0.096, reloadTime: 1.9, spreadStill: 0.002, spreadMove: 0.028 },
  dmr: { name: 'Sentinel DMR', price: 4500, mag: 10, reserve: 30, damage: 75, fireRate: 0.35, reloadTime: 2.2, spreadStill: 0.0005, spreadMove: 0.04 },
  grenade: { name: 'Frag Grenade', price: 300, mag: 1, reserve: 2, damage: 90, fireRate: 1.0, reloadTime: 1.0, spreadStill: 0, spreadMove: 0 },
};

export function createWeapon(camera) {
  const gripMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4c5460'), roughness: 0.4, metalness: 0.3 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f0ece4'), roughness: 0.35, metalness: 0.4 });

  const model = new THREE.Group();
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.42), bodyMat);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.4), gripMat);
  barrel.position.set(0, 0.025, -0.38);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.08, 0.22), gripMat);
  stock.position.set(0, -0.02, 0.3);
  model.add(receiver, barrel, stock);
  model.position.set(0.24, -0.2, -0.42);
  camera.add(model);

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.accent), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
  );
  flash.position.set(0.24, -0.18, -0.95);
  flash.visible = false;
  camera.add(flash);

  const flashLight = new THREE.PointLight(new THREE.Color(PALETTE.accent), 0, 5);
  flashLight.position.set(0.24, -0.16, -0.6);
  camera.add(flashLight);

  let currentKey = 'rifle';
  const inventory = {
    pistol: { mag: WEAPON_DEFS.pistol.mag, reserve: WEAPON_DEFS.pistol.reserve, owned: true },
    smg: { mag: WEAPON_DEFS.smg.mag, reserve: WEAPON_DEFS.smg.reserve, owned: false },
    rifle: { mag: WEAPON_DEFS.rifle.mag, reserve: WEAPON_DEFS.rifle.reserve, owned: true },
    dmr: { mag: WEAPON_DEFS.dmr.mag, reserve: WEAPON_DEFS.dmr.reserve, owned: false },
    grenade: { mag: 0, reserve: 0, owned: false },
  };

  const state = {
    type: currentKey,
    mag: WEAPON_DEFS.rifle.mag,
    reserve: WEAPON_DEFS.rifle.reserve,
    cooldown: 0,
    reloadLeft: 0,
    flash: 0,
    kick: 0,
    damage: WEAPON_DEFS.rifle.damage,
  };

  function selectWeapon(key) {
    if (!inventory[key] || !inventory[key].owned) return false;
    currentKey = key;
    const def = WEAPON_DEFS[key];
    state.type = key;
    state.mag = inventory[key].mag;
    state.reserve = inventory[key].reserve;
    state.damage = def.damage;
    state.cooldown = 0;
    state.reloadLeft = 0;
    return true;
  }

  function step(dt) {
    const def = WEAPON_DEFS[currentKey];
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.kick += (0 - state.kick) * Math.min(1, dt * 14);
    model.position.z = -0.42 + state.kick;
    model.rotation.x = state.kick * 2.2;
    flash.visible = state.flash > 0;
    flash.rotation.z = state.flash * 30;
    flashLight.intensity = state.flash > 0 ? 18 : 0;

    if (state.reloadLeft > 0) {
      state.reloadLeft = Math.max(0, state.reloadLeft - dt);
      model.rotation.x = -0.55 * Math.min(1, (def.reloadTime - state.reloadLeft) * 2);
      if (state.reloadLeft === 0) {
        const need = def.mag - state.mag;
        const take = Math.min(need, state.reserve);
        state.mag += take;
        state.reserve -= take;
        inventory[currentKey].mag = state.mag;
        inventory[currentKey].reserve = state.reserve;
      }
    }
  }

  return {
    state,
    inventory,
    step,
    selectWeapon,
    ready() {
      return state.mag > 0 && state.cooldown === 0 && state.reloadLeft === 0;
    },
    pullTrigger() {
      const def = WEAPON_DEFS[currentKey];
      state.cooldown = def.fireRate;
      state.flash = 0.06;
      state.kick = currentKey === 'dmr' ? 0.09 : (currentKey === 'pistol' ? 0.03 : 0.055);
    },
    takeRound() {
      if (state.mag <= 0) return false;
      state.mag -= 1;
      inventory[currentKey].mag = state.mag;
      return true;
    },
    reload() {
      const def = WEAPON_DEFS[currentKey];
      if (state.reloadLeft > 0 || state.mag === def.mag || state.reserve === 0) return;
      state.reloadLeft = def.reloadTime;
    },
    spread(speed) {
      const def = WEAPON_DEFS[currentKey];
      return def.spreadStill + Math.min(1, speed / 5.2) * def.spreadMove;
    },
    refill() {
      for (const k of Object.keys(inventory)) {
        if (inventory[k].owned) {
          inventory[k].mag = WEAPON_DEFS[k].mag;
          inventory[k].reserve = WEAPON_DEFS[k].reserve;
        }
      }
      selectWeapon(currentKey);
    },
  };
}
