'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type InputState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  sink: boolean;
};

type TreeMeta = {
  mesh: THREE.Mesh;
  alive: boolean;
  floating?: boolean;
  group?: THREE.Group;
};

type EnemyMeta = {
  group: THREE.Group;
  alive: boolean;
  type: 'jellyfish' | 'pufferfish';
  baseY: number;
  phase: number;
};

function buildTree(): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.22, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4b33, roughness: 0.9 })
  );
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x3c6d3c, roughness: 0.8, flatShading: true })
  );
  leaves.position.y = 2.1;
  leaves.castShadow = true;
  tree.add(leaves);

  return tree;
}

function buildJellyfish(): THREE.Group {
  const jelly = new THREE.Group();

  // Bell/dome
  const bellGeo = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    transparent: true,
    opacity: 0.7,
    emissive: 0xff1493,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide
  });
  const bell = new THREE.Mesh(bellGeo, bellMat);
  bell.rotation.x = Math.PI;
  jelly.add(bell);

  // Tentacles
  const tentacleMat = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    transparent: true,
    opacity: 0.5,
    emissive: 0xff1493,
    emissiveIntensity: 0.2
  });
  for (let i = 0; i < 6; i++) {
    const tentacle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.01, 1.2, 6),
      tentacleMat
    );
    const angle = (i / 6) * Math.PI * 2;
    tentacle.position.set(Math.cos(angle) * 0.25, -0.6, Math.sin(angle) * 0.25);
    jelly.add(tentacle);
  }

  return jelly;
}

function buildPufferfish(): THREE.Group {
  const puffer = new THREE.Group();

  // Body (spiky sphere)
  const bodyGeo = new THREE.SphereGeometry(0.4, 12, 12);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.6
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  puffer.add(body);

  // Spikes
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  for (let i = 0; i < 20; i++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.2, 4),
      spikeMat
    );
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    spike.position.set(
      0.4 * Math.sin(phi) * Math.cos(theta),
      0.4 * Math.sin(phi) * Math.sin(theta),
      0.4 * Math.cos(phi)
    );
    spike.lookAt(spike.position.clone().multiplyScalar(2));
    puffer.add(spike);
  }

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (const side of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeWhiteMat);
    eyeWhite.position.set(side * 0.2, 0.15, 0.3);
    puffer.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
    pupil.position.set(side * 0.2, 0.15, 0.38);
    puffer.add(pupil);
  }

  // Tail fin
  const tailGeo = new THREE.ConeGeometry(0.15, 0.3, 4);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -0.5;
  puffer.add(tail);

  return puffer;
}

function buildTrainCar(): THREE.Group {
  const train = new THREE.Group();

  // Main body
  const bodyGeo = new THREE.BoxGeometry(3, 1.5, 2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.25;
  body.castShadow = true;
  body.receiveShadow = true;
  train.add(body);

  // Roof
  const roofGeo = new THREE.BoxGeometry(3.2, 0.3, 2.2);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5c0000, roughness: 0.8 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 2.15;
  roof.castShadow = true;
  train.add(roof);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
  for (const xOff of [-1, 1]) {
    for (const zOff of [-1, 1]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(xOff * 1, 0.4, zOff * 1.1);
      wheel.castShadow = true;
      train.add(wheel);
    }
  }

  // Platform on top for player to stand
  const platformGeo = new THREE.BoxGeometry(3.4, 0.1, 2.4);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = 2.35;
  platform.receiveShadow = true;
  train.add(platform);

  return train;
}

function generateMaze(size: number): boolean[][] {
  // Create a maze using recursive backtracking
  // true = wall, false = path
  const maze: boolean[][] = [];
  for (let i = 0; i < size; i++) {
    maze[i] = [];
    for (let j = 0; j < size; j++) {
      maze[i][j] = true; // Start with all walls
    }
  }

  const stack: [number, number][] = [];
  const startX = 1;
  const startZ = 1;
  maze[startX][startZ] = false;
  stack.push([startX, startZ]);

  const directions = [
    [0, 2], [0, -2], [2, 0], [-2, 0]
  ];

  while (stack.length > 0) {
    const [cx, cz] = stack[stack.length - 1];
    const neighbors: [number, number, number, number][] = [];

    for (const [dx, dz] of directions) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx > 0 && nx < size - 1 && nz > 0 && nz < size - 1 && maze[nx][nz]) {
        neighbors.push([nx, nz, cx + dx / 2, cz + dz / 2]);
      }
    }

    if (neighbors.length > 0) {
      const [nx, nz, wx, wz] = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze[nx][nz] = false;
      maze[wx][wz] = false;
      stack.push([nx, nz]);
    } else {
      stack.pop();
    }
  }

  // Ensure center is open (goal area)
  const center = Math.floor(size / 2);
  for (let i = center - 1; i <= center + 1; i++) {
    for (let j = center - 1; j <= center + 1; j++) {
      if (i >= 0 && i < size && j >= 0 && j < size) {
        maze[i][j] = false;
      }
    }
  }

  // Ensure entrance is open
  maze[1][0] = false;
  maze[1][1] = false;

  return maze;
}

function createMountain(angle: number, radius: number): THREE.Mesh {
  const height = 6 + Math.random() * 5;
  const base = 2.2 + Math.random() * 1;
  const geometry = new THREE.ConeGeometry(base, height, 6);
  geometry.computeVertexNormals();
  const mountain = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x4e5569, flatShading: true, roughness: 0.95 })
  );
  mountain.position.set(Math.cos(angle) * radius, height / 2 - 0.6, Math.sin(angle) * radius);
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  return mountain;
}

function createExitPortal(x: number, y: number, z: number): THREE.Group {
  const portal = new THREE.Group();

  // Outer ring
  const ringGeo = new THREE.TorusGeometry(1.2, 0.15, 16, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x00ffaa,
    emissive: 0x00ffaa,
    emissiveIntensity: 0.8,
    metalness: 0.8,
    roughness: 0.2
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.y = Math.PI / 2;
  portal.add(ring);

  // Inner glowing disc
  const discGeo = new THREE.CircleGeometry(1.1, 32);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x00ddff,
    emissive: 0x00aaff,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.y = Math.PI / 2;
  portal.add(disc);

  portal.position.set(x, y, z);
  return portal;
}

export default function ForestScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<InputState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    attack: false,
    sink: false
  });
  const [status, setStatus] = useState('Click the scene to capture the cursor and play.');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationId = 0;
    const scene = new THREE.Scene();

    // Set background and fog based on level
    if (currentLevel === 1) {
      scene.background = new THREE.Color(0x0b1420);
      scene.fog = new THREE.FogExp2(0x0c1623, 0.03);
    } else if (currentLevel === 2) {
      // Ocean level - brighter, more daylight
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.Fog(0x87ceeb, 10, 80);
    }
    // Level 3 background/fog is set in its own section

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );
    camera.position.set(0, 2, 8);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    // Lighting
    const ambient = new THREE.AmbientLight(
      currentLevel === 1 ? 0xcfe8ff : 0xffffff,
      currentLevel === 1 ? 0.45 : 0.7
    );
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, currentLevel === 1 ? 1.15 : 1.8);
    sun.position.set(14, 18, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    scene.add(sun);

    // Level-specific geometry
    const trees: TreeMeta[] = [];
    const enemies: EnemyMeta[] = [];
    let exitPortal: THREE.Group | null = null;
    let waterLevel = 0;

    if (currentLevel === 1) {
      // FOREST LEVEL
      // Ground and paths
      const groundGeo = new THREE.CircleGeometry(40, 80);
      groundGeo.rotateX(-Math.PI / 2);
      const ground = new THREE.Mesh(
        groundGeo,
        new THREE.MeshStandardMaterial({ color: 0x2d4c2f, roughness: 1 })
      );
      ground.receiveShadow = true;
      scene.add(ground);

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

      // Exit portal to ocean level
      exitPortal = createExitPortal(25, 1.5, 0);
      scene.add(exitPortal);

    } else if (currentLevel === 2) {
      // OCEAN LEVEL
      waterLevel = 0;

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

      // Floating trees (cannot be chopped)
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
      exitPortal = createExitPortal(
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
    } else if (currentLevel === 3) {
      // TRAIN & MAZE LEVEL
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

      // Store train reference for animation
      (scene as THREE.Scene & { trainRef?: THREE.Group }).trainRef = train;
      (scene as THREE.Scene & { trackRadius?: number }).trackRadius = trackRadius;
      (scene as THREE.Scene & { trainAngle?: number }).trainAngle = 0;

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

      // Store maze walls for collision
      (scene as THREE.Scene & { mazeGroup?: THREE.Group }).mazeGroup = mazeGroup;
      (scene as THREE.Scene & { mazeOffsetX?: number }).mazeOffsetX = mazeOffsetX;
      (scene as THREE.Scene & { mazeOffsetZ?: number }).mazeOffsetZ = mazeOffsetZ;
      (scene as THREE.Scene & { mazeSize?: number }).mazeSize = mazeSize;
      (scene as THREE.Scene & { mazeScale?: number }).mazeScale = mazeScale;
      (scene as THREE.Scene & { mazeData?: boolean[][] }).mazeData = maze;

      // Goal portal at center of maze
      const mazeCenterX = mazeOffsetX;
      const mazeCenterZ = mazeOffsetZ;
      exitPortal = createExitPortal(mazeCenterX, 1.5, mazeCenterZ);
      scene.add(exitPortal);

      // Jump-off platform near the train stop
      const platformGeo = new THREE.BoxGeometry(4, 0.5, 4);
      const platformMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
      const jumpOffPlatform = new THREE.Mesh(platformGeo, platformMat);
      jumpOffPlatform.position.set(-trackRadius, 0.25, 0);
      jumpOffPlatform.receiveShadow = true;
      jumpOffPlatform.castShadow = true;
      scene.add(jumpOffPlatform);
    }

    // Player avatar
    const player = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 1.1, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xd7e2f3, roughness: 0.6, metalness: 0.15 })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    player.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf0f4ff, roughness: 0.3 })
    );
    head.position.y = 1.05;
    head.castShadow = true;
    player.add(head);

    const sword = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.12, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xd6ad60, roughness: 0.4, metalness: 0.3 })
    );
    sword.position.set(0.5, 0.4, -0.3);
    sword.rotation.y = -Math.PI / 3;
    sword.castShadow = true;
    player.add(sword);

    player.position.set(0, 0, 6);
    scene.add(player);

    const playerState = {
      yaw: Math.PI,
      pitch: -0.05,
      velocity: new THREE.Vector3(),
      onGround: true,
      attackTimer: 0,
      swingRegistered: false,
      inWater: false,
      onTree: false,
      climbingTree: null as THREE.Group | null
    };

    // Input handling
    const updateStatus = () => {
      setStatus(
        document.pointerLockElement === canvas
          ? 'Pointer locked — move mouse to aim.'
          : 'Click the scene to lock the cursor. Esc releases it.'
      );
    };

    const handleKey = (pressed: boolean) => (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const input = inputRef.current;
      switch (key) {
        case 'w':
        case 'arrowup':
          input.forward = pressed;
          break;
        case 's':
        case 'arrowdown':
          input.back = pressed;
          break;
        case 'a':
        case 'arrowleft':
          input.left = pressed;
          break;
        case 'd':
        case 'arrowright':
          input.right = pressed;
          break;
        case ' ':
          input.jump = pressed;
          if (pressed) event.preventDefault();
          break;
        case 'k':
          input.attack = pressed;
          break;
        case 'shift':
          input.sink = pressed;
          break;
        default:
          break;
      }
    };

    const onKeyDown = handleKey(true);
    const onKeyUp = handleKey(false);

    const onPointerMove = (event: PointerEvent) => {
      if (document.pointerLockElement !== canvas) return;
      playerState.yaw -= event.movementX * 0.0025;
      playerState.pitch = THREE.MathUtils.clamp(
        playerState.pitch - event.movementY * 0.0025,
        -Math.PI / 3,
        Math.PI / 6
      );
    };

    const onClick = () => {
      if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    };

    // Touch handling for mobile camera rotation
    let lastTouchX = 0;
    let lastTouchY = 0;
    let touchId: number | null = null;

    const onTouchStart = (event: TouchEvent) => {
      // Only track touches directly on the canvas (not on HUD buttons)
      if (event.target !== canvas) return;
      const touch = event.changedTouches[0];
      touchId = touch.identifier;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (touchId === null) return;
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        if (touch.identifier === touchId) {
          const deltaX = touch.clientX - lastTouchX;
          const deltaY = touch.clientY - lastTouchY;
          playerState.yaw -= deltaX * 0.005;
          playerState.pitch = THREE.MathUtils.clamp(
            playerState.pitch - deltaY * 0.005,
            -Math.PI / 3,
            Math.PI / 6
          );
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
          break;
        }
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === touchId) {
          touchId = null;
          break;
        }
      }
    };

    document.addEventListener('pointerlockchange', updateStatus);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', onTouchEnd);

    // Scene helpers
    const cameraOffset = new THREE.Vector3(0, 1.7, 4.8);
    const cameraTarget = new THREE.Vector3();
    const forwardDir = new THREE.Vector3();
    const rightDir = new THREE.Vector3();
    const clock = new THREE.Clock();

    const applyChop = () => {
      // Forward is negative of the calculated direction (matches inverted movement)
      const forward = forwardDir
        .set(-Math.sin(playerState.yaw), 0, -Math.cos(playerState.yaw))
        .normalize();
      const playerPos = player.position.clone();

      trees.forEach((entry) => {
        if (!entry.alive || entry.floating) return; // Can't chop floating trees
        const offset = entry.mesh.getWorldPosition(new THREE.Vector3()).sub(playerPos);
        const distance = offset.length();
        if (distance > 3.1) return;
        offset.normalize();
        if (offset.dot(forward) < 0.4) return;
        entry.alive = false;
        entry.mesh.parent?.traverse((child) => {
          child.visible = false;
        });
        setScore((prev) => prev + 200);
      });

      // Kill enemies
      enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const offset = enemy.group.position.clone().sub(playerPos);
        const distance = offset.length();
        if (distance > 3.5) return;
        offset.normalize();
        if (offset.dot(forward) < 0.3) return;
        enemy.alive = false;
        enemy.group.visible = false;
        const points = enemy.type === 'jellyfish' ? 150 : 250;
        setScore((prev) => prev + points);
      });
    };

    const animate = () => {
      const delta = clock.getDelta();
      const input = inputRef.current;

      if (input.attack && playerState.attackTimer <= 0) {
        playerState.attackTimer = 0.35;
        playerState.swingRegistered = false;
      }
      if (playerState.attackTimer > 0) {
        playerState.attackTimer -= delta;
        if (!playerState.swingRegistered && playerState.attackTimer < 0.2) {
          applyChop();
          playerState.swingRegistered = true;
        }
      }

      // Check water state (ocean level only)
      if (currentLevel === 2) {
        playerState.inWater = player.position.y < waterLevel;
      } else {
        playerState.inWater = false;
      }

      // Check if player is on top of a tree or climbing
      playerState.onTree = false;
      playerState.climbingTree = null;
      trees.forEach((treeEntry) => {
        if (!treeEntry.group || !treeEntry.floating) return;
        const treePos = treeEntry.group.position;
        const distXZ = Math.sqrt(
          (player.position.x - treePos.x) ** 2 + (player.position.z - treePos.z) ** 2
        );

        // On top of tree (within trunk radius, at tree height)
        if (distXZ < 0.4 && Math.abs(player.position.y - treePos.y) < 0.3) {
          playerState.onTree = true;
          playerState.onGround = true;
        }

        // Climbing tree (close to trunk)
        if (distXZ < 0.6 && player.position.y > treePos.y - 1 && player.position.y < treePos.y + 3) {
          playerState.climbingTree = treeEntry.group;
        }
      });

      // Movement
      forwardDir.set(Math.sin(playerState.yaw), 0, Math.cos(playerState.yaw)).normalize();
      rightDir.set(forwardDir.z, 0, -forwardDir.x);

      const moveVector = new THREE.Vector3();
      if (input.forward) moveVector.sub(forwardDir);
      if (input.back) moveVector.add(forwardDir);
      if (input.left) moveVector.sub(rightDir);
      if (input.right) moveVector.add(rightDir);

      // Different speeds for water vs air
      const moveSpeed = playerState.inWater ? 4 : 8;

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize().multiplyScalar(moveSpeed);
        playerState.velocity.x = THREE.MathUtils.damp(
          playerState.velocity.x,
          moveVector.x,
          8,
          delta
        );
        playerState.velocity.z = THREE.MathUtils.damp(
          playerState.velocity.z,
          moveVector.z,
          8,
          delta
        );
      } else {
        playerState.velocity.x = THREE.MathUtils.damp(playerState.velocity.x, 0, 6, delta);
        playerState.velocity.z = THREE.MathUtils.damp(playerState.velocity.z, 0, 6, delta);
      }

      // Jumping / swimming / climbing
      if (input.jump) {
        if (playerState.onGround || playerState.onTree) {
          // Jump from ground or tree
          playerState.velocity.y = 8.5;
          playerState.onGround = false;
        } else if (playerState.inWater || playerState.climbingTree) {
          // Swim up or climb tree
          playerState.velocity.y = 5;
        }
      }

      // Sinking in water
      if (playerState.inWater) {
        // Natural sinking
        playerState.velocity.y -= 3 * delta;
        // Faster sinking with shift key
        if (input.sink) {
          playerState.velocity.y -= 8 * delta;
        }
      } else if (!playerState.onGround && !playerState.onTree) {
        // Gravity in air
        playerState.velocity.y -= 24 * delta;
      }

      player.position.addScaledVector(playerState.velocity, delta);

      // Ground collision
      const groundLevel = currentLevel === 1 ? 0 : -20;
      if (player.position.y <= groundLevel) {
        player.position.y = groundLevel;
        playerState.velocity.y = 0;
        playerState.onGround = true;
      }

      // Water surface resistance
      if (currentLevel === 2 && player.position.y > waterLevel && playerState.velocity.y < 0) {
        const distToWater = player.position.y - waterLevel;
        if (distToWater < 0.5) {
          playerState.velocity.y *= 0.8; // Slow down near surface
        }
      }

      // Keep player within bounds
      const boundaryRadius = currentLevel === 1 ? 31.5 : 55;
      const radius = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
      if (radius > boundaryRadius) {
        const scale = boundaryRadius / radius;
        player.position.x *= scale;
        player.position.z *= scale;
        playerState.velocity.multiplyScalar(0.6);
      }

      // Portal collision detection
      if (exitPortal) {
        const portalPos = exitPortal.position;
        const distToPortal = player.position.distanceTo(portalPos);
        if (distToPortal < 2) {
          // Player entered portal - transition to next level
          if (currentLevel === 1) {
            setCurrentLevel(2);
          } else if (currentLevel === 3) {
            // Level 3 complete - award bonus and return to level 1
            setScore((prev) => prev + 1000);
            setCurrentLevel(1);
          }
        }
      }

      // Level 3: Train animation and riding
      if (currentLevel === 3) {
        const sceneExt = scene as THREE.Scene & {
          trainRef?: THREE.Group;
          trackRadius?: number;
          trainAngle?: number;
          mazeData?: boolean[][];
          mazeOffsetX?: number;
          mazeOffsetZ?: number;
          mazeSize?: number;
          mazeScale?: number;
        };

        if (sceneExt.trainRef && sceneExt.trackRadius !== undefined) {
          // Move train in circle
          sceneExt.trainAngle = (sceneExt.trainAngle || 0) + delta * 0.3;
          const trainX = Math.cos(sceneExt.trainAngle) * sceneExt.trackRadius;
          const trainZ = Math.sin(sceneExt.trainAngle) * sceneExt.trackRadius;
          sceneExt.trainRef.position.set(trainX, 0, trainZ);
          sceneExt.trainRef.rotation.y = -sceneExt.trainAngle + Math.PI / 2;

          // Check if player is on train
          const trainTop = 2.4;
          const dx = player.position.x - trainX;
          const dz = player.position.z - trainZ;
          const distToTrain = Math.sqrt(dx * dx + dz * dz);
          const onTrain = distToTrain < 2 &&
                         player.position.y >= trainTop - 0.5 &&
                         player.position.y <= trainTop + 1;

          if (onTrain) {
            // Player rides with train
            playerState.onGround = true;
            if (player.position.y < trainTop) {
              player.position.y = trainTop;
              playerState.velocity.y = 0;
            }
            // Move player with train
            const prevAngle = sceneExt.trainAngle - delta * 0.3;
            const prevX = Math.cos(prevAngle) * sceneExt.trackRadius;
            const prevZ = Math.sin(prevAngle) * sceneExt.trackRadius;
            player.position.x += trainX - prevX;
            player.position.z += trainZ - prevZ;
          }
        }

        // Maze wall collision
        if (sceneExt.mazeData && sceneExt.mazeOffsetX !== undefined) {
          const mazeLocalX = player.position.x - sceneExt.mazeOffsetX + (sceneExt.mazeSize! * sceneExt.mazeScale!) / 2;
          const mazeLocalZ = player.position.z - sceneExt.mazeOffsetZ! + (sceneExt.mazeSize! * sceneExt.mazeScale!) / 2;
          const gridX = Math.floor(mazeLocalX / sceneExt.mazeScale!);
          const gridZ = Math.floor(mazeLocalZ / sceneExt.mazeScale!);

          // Check if inside maze bounds and hitting a wall
          if (gridX >= 0 && gridX < sceneExt.mazeSize! &&
              gridZ >= 0 && gridZ < sceneExt.mazeSize! &&
              player.position.y < 3) {
            if (sceneExt.mazeData[gridX][gridZ]) {
              // Push player out of wall
              playerState.velocity.x *= -0.5;
              playerState.velocity.z *= -0.5;
              player.position.x -= playerState.velocity.x * delta * 2;
              player.position.z -= playerState.velocity.z * delta * 2;
            }
          }
        }
      }

      // Animate enemies (bobbing motion)
      const time = clock.elapsedTime;
      enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        // Bobbing up and down
        enemy.group.position.y = enemy.baseY + Math.sin(time * 2 + enemy.phase) * 0.5;
        // Gentle rotation for jellyfish
        if (enemy.type === 'jellyfish') {
          enemy.group.rotation.y += delta * 0.5;
        }
        // Pufferfish swim in small circles
        if (enemy.type === 'pufferfish') {
          enemy.group.rotation.y += delta * 0.3;
        }
      });

      // Sword animation - swing from right side across front
      const swingPhase = THREE.MathUtils.clamp(
        1 - playerState.attackTimer / 0.35,
        0,
        1
      );
      // Swing from right (-PI/3) across to left (PI/2)
      sword.rotation.y = -Math.PI / 3 + swingPhase * (Math.PI * 0.85);
      sword.rotation.x = -Math.sin(swingPhase * Math.PI) * 0.5;
      // Move sword position during swing (from right to center-left)
      sword.position.x = 0.5 - swingPhase * 0.7;
      sword.position.z = -0.3 - swingPhase * 0.4;

      player.rotation.y = playerState.yaw + Math.PI;

      // Camera follow
      const rotatedOffset = cameraOffset.clone();
      rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerState.yaw);
      const desiredCameraPos = player.position.clone().add(rotatedOffset);
      camera.position.lerp(desiredCameraPos, 0.12);
      cameraTarget.copy(player.position).add(new THREE.Vector3(0, 1.2, 0));
      camera.lookAt(cameraTarget);

      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };

    animate();
    updateStatus();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerlockchange', updateStatus);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      body.geometry.dispose();
      head.geometry.dispose();
      sword.geometry.dispose();
    };
  }, [currentLevel]);

  const setDirection = (key: keyof InputState, pressed: boolean) => {
    inputRef.current[key] = pressed;
  };

  const warpToLevel = (level: number) => {
    setScore(0);
    setCurrentLevel(level);
  };

  return (
    <div className="canvas-shell" ref={containerRef}>
      <canvas ref={canvasRef} className="scene-canvas" />
      <div className="hud">
        <div className="level-buttons">
          <button onClick={() => warpToLevel(1)} className={currentLevel === 1 ? 'active' : ''}>1</button>
          <button onClick={() => warpToLevel(2)} className={currentLevel === 2 ? 'active' : ''}>2</button>
          <button onClick={() => warpToLevel(3)} className={currentLevel === 3 ? 'active' : ''}>3</button>
        </div>
        <div className="score-display">Score: {score}</div>
        <div className="hud-row">
          <div className="hud-card desktop-only">
            <h3>Desktop Controls</h3>
            <ul>
              <li>WASD / Arrow keys to move</li>
              <li>Space to jump/swim · K to swing sword</li>
              {currentLevel === 2 && <li>Shift to sink faster in water</li>}
              <li>Click canvas to lock mouse; move to look</li>
            </ul>
            <div className="status-pill">{status}</div>
          </div>
          <div className="hud-card">
            <h3>Objective</h3>
            {currentLevel === 1 && (
              <p>
                Explore the dark forest, find the glowing portal, and chop through
                trees blocking your path.
              </p>
            )}
            {currentLevel === 2 && (
              <p>
                Explore the ocean level! Swim through the water, climb floating trees, and
                find the hidden underwater exit portal.
              </p>
            )}
            {currentLevel === 3 && (
              <p>
                Jump on the train to ride around the track. Jump off at the platform,
                navigate the yellow maze, and reach the portal at the center!
              </p>
            )}
            <p className="legend">Level {currentLevel} of 3 · Stick-figure visuals for now.</p>
          </div>
        </div>
        <div className="hud-row">
          <div className="mobile-controls">
            <div className="pad">
              <span className="pad-placeholder" />
              <button
                onPointerDown={() => setDirection('forward', true)}
                onPointerUp={() => setDirection('forward', false)}
              >
                ▲
              </button>
              <span className="pad-placeholder" />
              <button
                onPointerDown={() => setDirection('left', true)}
                onPointerUp={() => setDirection('left', false)}
              >
                ◀
              </button>
              <span className="pad-placeholder" />
              <button
                onPointerDown={() => setDirection('right', true)}
                onPointerUp={() => setDirection('right', false)}
              >
                ▶
              </button>
              <span className="pad-placeholder" />
              <button
                onPointerDown={() => setDirection('back', true)}
                onPointerUp={() => setDirection('back', false)}
              >
                ▼
              </button>
              <span className="pad-placeholder" />
            </div>
            <div className="action">
              <button
                onPointerDown={() => setDirection('jump', true)}
                onPointerUp={() => setDirection('jump', false)}
              >
                J
              </button>
              <button
                onPointerDown={() => setDirection('attack', true)}
                onPointerUp={() => setDirection('attack', false)}
              >
                C
              </button>
              {currentLevel === 2 && (
                <button
                  onPointerDown={() => setDirection('sink', true)}
                  onPointerUp={() => setDirection('sink', false)}
                >
                  S
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
