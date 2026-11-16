import * as THREE from 'three';
import { PALETTE } from './palette.js';

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const materials = {};
  for (const name of Object.keys(PALETTE)) {
    materials[name] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE[name]),
      roughness: name === 'accent' || name === 'ink' ? 0.55 : 0.88,
      metalness: 0.05,
    });
  }

  // Create site indicator material
  const siteAMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.teamA), wireframe: true, transparent: true, opacity: 0.7 });
  const siteBMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.teamB), wireframe: true, transparent: true, opacity: 0.7 });

  const colliders = [];
  const shootables = [];
  const sites = [];

  function box(width, height, depth, x, y, z, material, isShootable = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials[material]);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
    if (isShootable) shootables.push(mesh);
    return mesh;
  }

  // Tactical Map: 32m x 32m Arena with Left Lane, Mid Courtyard, Right Corridor, Site A (back left) and Site B (back right)
  // Floor
  box(32, 0.4, 32, 0, -0.2, 0, 'canvas');

  // Outer Walls (Height 5m)
  box(0.5, 5, 32, -16, 2.5, 0, 'surface', false);
  box(0.5, 5, 32, 16, 2.5, 0, 'surface', false);
  box(32, 5, 0.5, 0, 2.5, -16, 'surface', false);
  box(32, 5, 0.5, 0, 2.5, 16, 'surface', false);

  // Mid Wall Divider (separating Left and Mid lanes)
  box(1.5, 4, 14, -5, 2, -2, 'hairline');
  // Mid Wall Divider (separating Mid and Right lanes)
  box(1.5, 4, 14, 5, 2, -2, 'hairline');

  // Site A (Back Left) & Site B (Back Right) structures and markers
  // Site A Zone at (-10, 0.02, -12)
  const siteAMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), siteAMaterial);
  siteAMesh.rotation.x = -Math.PI / 2;
  siteAMesh.position.set(-10, 0.05, -12);
  group.add(siteAMesh);
  sites.push({ name: 'A', center: new THREE.Vector3(-10, 0, -12), radius: 3.5 });

  // Site B Zone at (10, 0.02, -12)
  const siteBMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), siteBMaterial);
  siteBMesh.rotation.x = -Math.PI / 2;
  siteBMesh.position.set(10, 0.05, -12);
  group.add(siteBMesh);
  sites.push({ name: 'B', center: new THREE.Vector3(10, 0, -12), radius: 3.5 });

  // Crates and Cover around sites and lanes
  // Site A cover crates
  box(2, 1.6, 2, -10, 0.8, -9, 'hairline');
  box(1.5, 1.2, 1.5, -13, 0.6, -11, 'hairline');

  // Site B cover crates
  box(2, 1.6, 2, 10, 0.8, -9, 'hairline');
  box(1.5, 1.2, 1.5, 13, 0.6, -11, 'hairline');

  // Mid courtyard cover & obstacles
  box(3, 1.2, 1.5, 0, 0.6, -2, 'hairline');
  box(1.2, 2.5, 1.2, -2, 1.25, 3, 'hairline');
  box(1.2, 2.5, 1.2, 2, 1.25, 3, 'hairline');

  // Spawn connector barriers (Attacker spawn around z = 12, Defender spawn around z = -12)
  box(6, 2.2, 1, -8, 1.1, 8, 'surface');
  box(6, 2.2, 1, 8, 1.1, 8, 'surface');

  // Lighting setup
  const sky = new THREE.HemisphereLight(new THREE.Color('#d4d8e0'), new THREE.Color('#4c525f'), 2.4);
  scene.add(sky);

  const key = new THREE.DirectionalLight(new THREE.Color('#ffffff'), 3.2);
  key.position.set(12, 18, 10);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -20;
  key.shadow.camera.right = 20;
  key.shadow.camera.top = 20;
  key.shadow.camera.bottom = -20;
  key.shadow.camera.far = 60;
  key.shadow.bias = -0.0005;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(new THREE.Color('#b0c0d0'), 1.6);
  fill.position.set(-12, 12, -10);
  scene.add(fill);

  return { colliders, shootables, sites, group };
}
