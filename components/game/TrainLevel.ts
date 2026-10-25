import * as THREE from 'three';
import { LevelData, buildTrainCar, generateMaze, createExitPortal } from './shared';

export function setupTrainLevel(scene: THREE.Scene): LevelData {
  // Set background and fog
  scene.background = new THREE.Color(0x4a3728);
  scene.fog = new THREE.Fog(0x4a3728, 20, 100);

  // Reddish dirt ground
  const groundGeo = new THREE.CircleGeometry(80, 80);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 1 })
  );
  ground.receiveShadow = true;
  scene.add(ground);

  // Train track (circular)
  const trackRadius = 25;
  const trackGeo = new THREE.TorusGeometry(trackRadius, 0.3, 8, 64);
  trackGeo.rotateX(Math.PI / 2);
  const track = new THREE.Mesh(
    trackGeo,
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 })
  );
  track.position.y = 0.1;
  track.receiveShadow = true;
  scene.add(track);

  // Train car
  const train = buildTrainCar();
  train.position.set(trackRadius, 0, 0);
  scene.add(train);

  // Maze positioned at opposite end of track
  const mazeSize = 15;
  const mazeScale = 2;
  const mazeOffsetX = -trackRadius - mazeSize * mazeScale / 2 - 5;
  const mazeOffsetZ = 0;
  const maze = generateMaze(mazeSize);
  const mazeGroup = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.6 });
  const wallHeight = 3;

  for (let i = 0; i < mazeSize; i++) {
    for (let j = 0; j < mazeSize; j++) {
      if (maze[i][j]) {
        const wallGeo = new THREE.BoxGeometry(mazeScale, wallHeight, mazeScale);
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(
          i * mazeScale - (mazeSize * mazeScale) / 2,
          wallHeight / 2,
          j * mazeScale - (mazeSize * mazeScale) / 2
        );
        wall.castShadow = true;
        wall.receiveShadow = true;
        mazeGroup.add(wall);
      }
    }
  }

  mazeGroup.position.set(mazeOffsetX, 0, mazeOffsetZ);
  scene.add(mazeGroup);

  // Goal portal at center of maze
  const mazeCenterX = mazeOffsetX;
  const mazeCenterZ = mazeOffsetZ;
  const exitPortal = createExitPortal(mazeCenterX, 1.5, mazeCenterZ);
  scene.add(exitPortal);

  // Stations: the train stops beside each one. Steps make the platform reachable with a normal
  // jump, and the platform is high enough to jump from onto the train roof.
  const colliders: THREE.Box3[] = [];
  const addBlock = (min: [number, number, number], max: [number, number, number], color: number) => {
    const box = new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));
    const size = box.getSize(new THREE.Vector3());
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    box.getCenter(block.position);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
    colliders.push(box);
  };

  // Near the player's start, inside the track at angle PI/2
  addBlock([-2, 0, 20.6], [2, 1.3, 23.4], 0x777777);
  addBlock([-2, 0, 18.8], [2, 0.65, 20.6], 0x666666);
  // Near the maze, outside the track at angle PI
  addBlock([-29.2, 0, -2], [-26.6, 1.3, 2], 0x777777);
  addBlock([-30.6, 0, -2], [-29.2, 0.65, 2], 0x666666);

  return {
    trees: [],
    enemies: [],
    exitPortal,
    waterLevel: 0,
    groundLevel: 0,
    boundaryRadius: 75,
    trainRef: train,
    trackRadius,
    trainStops: [Math.PI / 2, Math.PI],
    colliders,
    mazeData: maze,
    mazeOffsetX,
    mazeOffsetZ,
    mazeSize,
    mazeScale
  };
}
