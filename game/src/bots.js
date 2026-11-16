import * as THREE from 'three';
import { PALETTE } from './palette.js';

export function createBots(scene, colliders) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.teamB), roughness: 0.6, metalness: 0.1 });
  const headMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.accent), roughness: 0.45, metalness: 0.1 });
  const torsoGeometry = new THREE.BoxGeometry(0.52, 0.78, 0.3);
  const headGeometry = new THREE.SphereGeometry(0.155, 16, 12);
  const postGeometry = new THREE.BoxGeometry(0.1, 0.55, 0.1);

  // Defender bots starting positions around sites A and B
  const BOT_CONFIGS = [
    { x: 0, z: -7, patrol: [new THREE.Vector3(0, 0, -7), new THREE.Vector3(-3, 0, -5), new THREE.Vector3(3, 0, -5)] },
    { x: -9, z: -10, patrol: [new THREE.Vector3(-9, 0, -10), new THREE.Vector3(-6, 0, -6), new THREE.Vector3(-10, 0, -12)] },
    { x: 9, z: -10, patrol: [new THREE.Vector3(9, 0, -10), new THREE.Vector3(6, 0, -6), new THREE.Vector3(10, 0, -12)] },
  ];

  const bots = [];
  const hitMeshes = [];

  for (let index = 0; index < BOT_CONFIGS.length; index++) {
    const cfg = BOT_CONFIGS[index];
    const group = new THREE.Group();
    group.position.set(cfg.x, 0, cfg.z);

    const post = new THREE.Mesh(postGeometry, bodyMaterial);
    post.position.y = 0.3;
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = 1.0;
    torso.userData.part = 'torso';
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.53;
    head.userData.part = 'head';
    group.add(post, torso, head);

    group.traverse((mesh) => {
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    scene.add(group);

    const bot = {
      index,
      group,
      torso,
      head,
      health: 100,
      alive: true,
      state: 'PATROL', // PATROL, COMBAT, DEFUSE
      patrolWaypoints: cfg.patrol,
      waypointIndex: 0,
      shootCooldown: 0,
      lastSeenPlayer: -999,
    };

    torso.userData.bot = bot;
    head.userData.bot = bot;
    hitMeshes.push(torso, head);
    bots.push(bot);
  }

  let cfg; // clean up temp

  const raycaster = new THREE.Raycaster();
  const dir = new THREE.Vector3();

  function checkLOS(botPos, playerPos, obstacles) {
    dir.copy(playerPos).sub(botPos);
    const dist = dir.length();
    if (dist > 18) return false;
    dir.normalize();
    raycaster.set(botPos, dir);
    raycaster.far = dist;
    const hits = raycaster.intersectObjects(obstacles, false);
    return hits.length === 0;
  }

  function step(dt, time, playerPos, obstacles, bombPlanted, bombPosition, onBotShoot) {
    for (const bot of bots) {
      if (!bot.alive) continue;

      const botPos = bot.group.position;
      const eyePos = new THREE.Vector3(botPos.x, botPos.y + 1.5, botPos.z);
      const targetEye = new THREE.Vector3(playerPos.x, playerPos.y + 1.6, playerPos.z);

      // Check LOS & FOV
      const hasLOS = checkLOS(eyePos, targetEye, obstacles);
      if (hasLOS) {
        bot.lastSeenPlayer = time;
        bot.state = 'COMBAT';
      } else if (bombPlanted && bot.state !== 'COMBAT') {
        bot.state = 'DEFUSE';
      } else if (time - bot.lastSeenPlayer > 4.0) {
        bot.state = 'PATROL';
      }

      // Movement behavior based on state
      let dest = null;
      let moveSpeed = 2.2;

      if (bot.state === 'COMBAT') {
        dest = targetEye;
        moveSpeed = 1.0; // aim / stutter step
        bot.shootCooldown -= dt;
        if (bot.shootCooldown <= 0) {
          bot.shootCooldown = 0.8 + Math.random() * 0.6;
          if (hasLOS) {
            onBotShoot(botPos, targetEye);
          }
        }
      } else if (bot.state === 'DEFUSE' && bombPlanted) {
        dest = bombPosition;
        moveSpeed = 3.2;
      } else {
        // Patrol
        const wp = bot.patrolWaypoints[bot.waypointIndex];
        dest = wp;
        if (botPos.distanceTo(wp) < 1.0) {
          bot.waypointIndex = (bot.waypointIndex + 1) % bot.patrolWaypoints.length;
        }
      }

      if (dest) {
        const moveDir = new THREE.Vector3(dest.x - botPos.x, 0, dest.z - botPos.z);
        const distToDest = moveDir.length();
        if (distToDest > 0.3) {
          moveDir.normalize();
          botPos.x += moveDir.x * moveSpeed * dt;
          botPos.z += moveDir.z * moveSpeed * dt;
          bot.group.rotation.y = Math.atan2(moveDir.x, moveDir.z);
        }
      }
    }
  }

  function damage(mesh, amount) {
    const bot = mesh.userData.bot;
    if (!bot || !bot.alive) return { killed: false, bot: null };
    bot.health -= amount;
    if (bot.health <= 0) {
      bot.alive = false;
      bot.group.visible = false;
      return { killed: true, bot };
    }
    return { killed: false, bot };
  }

  return {
    bots,
    hitMeshes,
    step,
    damage,
    remaining() {
      return bots.filter((b) => b.alive).length;
    },
    reset() {
      for (let i = 0; i < bots.length; i++) {
        const bot = bots[i];
        bot.alive = true;
        bot.health = 100;
        bot.group.visible = true;
        bot.state = 'PATROL';
        const cfg = BOT_CONFIGS[i];
        bot.group.position.set(cfg.x, 0, cfg.z);
        bot.waypointIndex = 0;
      }
    },
  };
}
