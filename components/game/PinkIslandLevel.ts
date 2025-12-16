import * as THREE from 'three';
import { TreeMeta, EnemyMeta, LevelData, buildPinkTree, buildSkull, createExitPortal } from './shared';

export function setupPinkIslandLevel(scene: THREE.Scene): LevelData {
  // Set background to pink/purple sky
  scene.background = new THREE.Color(0xffb6d9);
  scene.fog = new THREE.Fog(0xffb6d9, 20, 80);

  const trees: TreeMeta[] = [];
  const enemies: EnemyMeta[] = [];

  // Ocean surrounding the island
  const oceanGeo = new THREE.CircleGeometry(60, 80);
  oceanGeo.rotateX(-Math.PI / 2);
  const ocean = new THREE.Mesh(
    oceanGeo,
    new THREE.MeshStandardMaterial({
      color: 0x4169e1,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.6
    })
  );
  ocean.position.y = -0.5;
  ocean.receiveShadow = true;
  scene.add(ocean);

  // Pink island
  const islandGeo = new THREE.CircleGeometry(30, 80);
  islandGeo.rotateX(-Math.PI / 2);
  const island = new THREE.Mesh(
    islandGeo,
    new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.9 })
  );
  island.receiveShadow = true;
  scene.add(island);

  // Pink sandy beach ring
  const beachGeo = new THREE.RingGeometry(27, 30, 64, 1);
  beachGeo.rotateX(-Math.PI / 2);
  const beach = new THREE.Mesh(
    beachGeo,
    new THREE.MeshStandardMaterial({
      color: 0xffc0cb,
      roughness: 0.95
    })
  );
  beach.position.y = 0.02;
  beach.receiveShadow = true;
  scene.add(beach);

  // Add pink palm trees
  const pinkForest = new THREE.Group();
  for (let i = 0; i < 40; i++) {
    const radius = THREE.MathUtils.randFloat(3, 26);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const tree = buildPinkTree();
    tree.position.set(x, 0, z);
    tree.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
    pinkForest.add(tree);

    const firstMesh = tree.children[0] as THREE.Mesh;
    trees.push({ mesh: firstMesh, alive: true, group: tree });
  }
  scene.add(pinkForest);

  // Add pink rocks
  const rockGroup = new THREE.Group();
  for (let i = 0; i < 25; i++) {
    const rockSize = THREE.MathUtils.randFloat(0.4, 1.0);
    const rockGeo = new THREE.DodecahedronGeometry(rockSize, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0xff69b4,
      roughness: 0.8,
      flatShading: true
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);

    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const distance = THREE.MathUtils.randFloat(2, 28);
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

  // Spawn pink skulls
  for (let i = 0; i < 18; i++) {
    const skull = buildSkull();
    const radius = THREE.MathUtils.randFloat(5, 25);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const y = 0.7;
    skull.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    scene.add(skull);
    enemies.push({
      group: skull,
      alive: true,
      type: 'skull',
      baseY: y,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Exit portal somewhere on the island
  const exitAngle = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const exitRadius = THREE.MathUtils.randFloat(15, 24);
  const exitPortal = createExitPortal(
    Math.cos(exitAngle) * exitRadius,
    1.5,
    Math.sin(exitAngle) * exitRadius
  );
  scene.add(exitPortal);

  return {
    trees,
    enemies,
    exitPortal,
    waterLevel: -0.5,
    groundLevel: 0,
    boundaryRadius: 29
  };
}
