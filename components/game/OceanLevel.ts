import * as THREE from 'three';
import { TreeMeta, EnemyMeta, LevelData, buildTree, buildJellyfish, buildPufferfish, createExitPortal } from './shared';

export function setupOceanLevel(scene: THREE.Scene): LevelData {
  // Set background and fog
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 10, 80);

  const trees: TreeMeta[] = [];
  const enemies: EnemyMeta[] = [];
  const waterLevel = 0;

  // Ocean floor
  const floorGeo = new THREE.CircleGeometry(60, 80);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(
    floorGeo,
    new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95 })
  );
  floor.position.y = -20;
  floor.receiveShadow = true;
  scene.add(floor);

  // Water surface
  const waterGeo = new THREE.CircleGeometry(60, 80);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({
      color: 0x0077be,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.8
    })
  );
  water.position.y = waterLevel;
  water.receiveShadow = true;
  scene.add(water);

  // Floating trees
  const floatingForest = new THREE.Group();
  for (let i = 0; i < 25; i += 1) {
    const radius = THREE.MathUtils.randFloat(10, 45);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const tree = buildTree();
    tree.position.set(x, waterLevel, z);
    tree.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
    floatingForest.add(tree);
    const firstMesh = tree.children[0] as THREE.Mesh;
    trees.push({ mesh: firstMesh, alive: true, floating: true, group: tree });
  }
  scene.add(floatingForest);

  // Underwater exit portal
  const exitAngle = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const exitRadius = THREE.MathUtils.randFloat(30, 45);
  const exitPortal = createExitPortal(
    Math.cos(exitAngle) * exitRadius,
    -15,
    Math.sin(exitAngle) * exitRadius
  );
  scene.add(exitPortal);

  // Spawn jellyfish
  for (let i = 0; i < 12; i++) {
    const jelly = buildJellyfish();
    const radius = THREE.MathUtils.randFloat(8, 40);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const y = THREE.MathUtils.randFloat(-15, -2);
    jelly.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    scene.add(jelly);
    enemies.push({
      group: jelly,
      alive: true,
      type: 'jellyfish',
      baseY: y,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Spawn pufferfish
  for (let i = 0; i < 8; i++) {
    const puffer = buildPufferfish();
    const radius = THREE.MathUtils.randFloat(8, 40);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const y = THREE.MathUtils.randFloat(-12, -1);
    puffer.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    puffer.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
    scene.add(puffer);
    enemies.push({
      group: puffer,
      alive: true,
      type: 'pufferfish',
      baseY: y,
      phase: Math.random() * Math.PI * 2
    });
  }

  return {
    trees,
    enemies,
    exitPortal,
    waterLevel,
    groundLevel: -20,
    boundaryRadius: 55
  };
}
