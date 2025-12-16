import * as THREE from 'three';
import { EnemyMeta, LevelData, buildAlien, buildCrater, createExitPortal } from './shared';

export function setupMoonLevel(scene: THREE.Scene): LevelData {
  // Set background to dark space
  scene.background = new THREE.Color(0x0a0a1a);
  scene.fog = new THREE.Fog(0x0a0a1a, 30, 120);

  const enemies: EnemyMeta[] = [];

  // Add distant stars
  const starGeo = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 300; i++) {
    const x = THREE.MathUtils.randFloatSpread(200);
    const y = THREE.MathUtils.randFloatSpread(200);
    const z = THREE.MathUtils.randFloatSpread(200);
    starPositions.push(x, y, z);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Moon surface (gray rocky terrain)
  const groundGeo = new THREE.CircleGeometry(50, 80);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.95 })
  );
  ground.receiveShadow = true;
  scene.add(ground);

  // Add craters scattered across the surface
  const craterGroup = new THREE.Group();
  for (let i = 0; i < 20; i++) {
    const radius = THREE.MathUtils.randFloat(2, 5);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const distance = THREE.MathUtils.randFloat(5, 45);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const crater = buildCrater(radius);
    crater.position.set(x, 0.15, z);
    craterGroup.add(crater);
  }
  scene.add(craterGroup);

  // Add some rocks
  const rockGroup = new THREE.Group();
  for (let i = 0; i < 30; i++) {
    const rockSize = THREE.MathUtils.randFloat(0.3, 1.2);
    const rockGeo = new THREE.DodecahedronGeometry(rockSize, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      flatShading: true
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);

    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const distance = THREE.MathUtils.randFloat(5, 48);
    rock.position.set(
      Math.cos(angle) * distance,
      rockSize,
      Math.sin(angle) * distance
    );
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    rockGroup.add(rock);
  }
  scene.add(rockGroup);

  // Spawn green aliens
  for (let i = 0; i < 15; i++) {
    const alien = buildAlien();
    const radius = THREE.MathUtils.randFloat(8, 40);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const y = 0.8;
    alien.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    scene.add(alien);
    enemies.push({
      group: alien,
      alive: true,
      type: 'alien',
      baseY: y,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Exit portal
  const exitAngle = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const exitRadius = THREE.MathUtils.randFloat(30, 42);
  const exitPortal = createExitPortal(
    Math.cos(exitAngle) * exitRadius,
    1.5,
    Math.sin(exitAngle) * exitRadius
  );
  scene.add(exitPortal);

  return {
    trees: [],
    enemies,
    exitPortal,
    waterLevel: -1000,
    groundLevel: 0,
    boundaryRadius: 48
  };
}
