import * as THREE from 'three';
import { TreeMeta, LevelData, buildTree, createMountain, createExitPortal, buildBike } from './shared';

export function setupForestLevel(scene: THREE.Scene): LevelData {
  // Set background and fog
  scene.background = new THREE.Color(0x0b1420);
  scene.fog = new THREE.FogExp2(0x0c1623, 0.03);

  const trees: TreeMeta[] = [];

  // Ground
  const groundGeo = new THREE.CircleGeometry(40, 80);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x2d4c2f, roughness: 1 })
  );
  ground.receiveShadow = true;
  scene.add(ground);

  // Path - raised slightly to prevent z-fighting with ground
  const pathGeo = new THREE.RingGeometry(6, 8, 64, 1);
  pathGeo.rotateX(-Math.PI / 2);
  const path = new THREE.Mesh(
    pathGeo,
    new THREE.MeshStandardMaterial({
      color: 0x8a6f4d,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
  );
  path.position.y = 0.02; // Raise slightly to prevent z-fighting
  path.receiveShadow = true;
  scene.add(path);

  // Mountain ring
  const mountains = new THREE.Group();
  for (let i = 0; i < 26; i += 1) {
    const angle = (i / 26) * Math.PI * 2;
    const radius = 32 + Math.random() * 3;
    mountains.add(createMountain(angle, radius));
  }
  scene.add(mountains);

  // Trees
  const forest = new THREE.Group();
  for (let i = 0; i < 85; i += 1) {
    const radius = THREE.MathUtils.randFloat(8, 28);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.sqrt(x * x + z * z) < 6.5) {
      continue;
    }
    const tree = buildTree();
    tree.position.set(x, 0, z);
    tree.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
    forest.add(tree);
    const firstMesh = tree.children[0] as THREE.Mesh;
    trees.push({ mesh: firstMesh, alive: true, group: tree });
  }
  scene.add(forest);

  // Exit portal
  const exitPortal = createExitPortal(25, 1.5, 0);
  scene.add(exitPortal);

  // Bike reward - placed near the path
  const bike = buildBike();
  bike.position.set(10, 0, 10);
  bike.rotation.y = Math.PI / 4;
  scene.add(bike);

  return {
    trees,
    enemies: [],
    exitPortal,
    waterLevel: 0,
    groundLevel: 0,
    boundaryRadius: 31.5,
    bikeRef: bike
  };
}
