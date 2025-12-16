import * as THREE from 'three';

export type InputState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  sink: boolean;
};

export type TreeMeta = {
  mesh: THREE.Mesh;
  alive: boolean;
  floating?: boolean;
  group?: THREE.Group;
};

export type EnemyMeta = {
  group: THREE.Group;
  alive: boolean;
  type: 'jellyfish' | 'pufferfish' | 'alien' | 'skull';
  baseY: number;
  phase: number;
};

export type PlanetMeta = {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
};

export type LevelData = {
  trees: TreeMeta[];
  enemies: EnemyMeta[];
  exitPortal: THREE.Group | null;
  waterLevel: number;
  groundLevel: number;
  boundaryRadius: number;
  trainRef?: THREE.Group;
  trackRadius?: number;
  trainAngle?: number;
  mazeData?: boolean[][];
  mazeOffsetX?: number;
  mazeOffsetZ?: number;
  mazeSize?: number;
  mazeScale?: number;
  planets?: PlanetMeta[];
};

export function buildTree(): THREE.Group {
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

export function buildJellyfish(): THREE.Group {
  const jelly = new THREE.Group();

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

export function buildPufferfish(): THREE.Group {
  const puffer = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(0.4, 12, 12);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.6
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  puffer.add(body);

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

  const tailGeo = new THREE.ConeGeometry(0.15, 0.3, 4);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -0.5;
  puffer.add(tail);

  return puffer;
}

export function buildTrainCar(): THREE.Group {
  const train = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(3, 1.5, 2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.25;
  body.castShadow = true;
  body.receiveShadow = true;
  train.add(body);

  const roofGeo = new THREE.BoxGeometry(3.2, 0.3, 2.2);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5c0000, roughness: 0.8 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 2.15;
  roof.castShadow = true;
  train.add(roof);

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

  const platformGeo = new THREE.BoxGeometry(3.4, 0.1, 2.4);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = 2.35;
  platform.receiveShadow = true;
  train.add(platform);

  return train;
}

export function generateMaze(size: number): boolean[][] {
  const maze: boolean[][] = [];
  for (let i = 0; i < size; i++) {
    maze[i] = [];
    for (let j = 0; j < size; j++) {
      maze[i][j] = true;
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

  const center = Math.floor(size / 2);
  for (let i = center - 1; i <= center + 1; i++) {
    for (let j = center - 1; j <= center + 1; j++) {
      if (i >= 0 && i < size && j >= 0 && j < size) {
        maze[i][j] = false;
      }
    }
  }

  maze[1][0] = false;
  maze[1][1] = false;

  return maze;
}

export function createMountain(angle: number, radius: number): THREE.Mesh {
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

export function createExitPortal(x: number, y: number, z: number): THREE.Group {
  const portal = new THREE.Group();

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

export function createPlayer(): { player: THREE.Group; body: THREE.Mesh; head: THREE.Mesh; sword: THREE.Mesh } {
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

  return { player, body, head, sword };
}

export function buildPlanet(radius: number, color: number): THREE.Mesh {
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    flatShading: true
  });
  const planet = new THREE.Mesh(geometry, material);
  planet.castShadow = true;
  planet.receiveShadow = true;
  return planet;
}

export function buildPinkTree(): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.22, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.9 })
  );
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0xff1493, roughness: 0.8, flatShading: true })
  );
  leaves.position.y = 2.1;
  leaves.castShadow = true;
  tree.add(leaves);

  return tree;
}

export function buildAlien(): THREE.Group {
  const alien = new THREE.Group();

  // Green body
  const bodyGeo = new THREE.SphereGeometry(0.4, 12, 12);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.6
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1, 1.2, 1);
  body.castShadow = true;
  alien.add(body);

  // Large black eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), eyeMat);
    eye.position.set(side * 0.15, 0.15, 0.35);
    eye.scale.set(1.3, 1.5, 1);
    alien.add(eye);
  }

  // Antennae
  const antennaMat = new THREE.MeshStandardMaterial({ color: 0x00cc00 });
  for (const side of [-1, 1]) {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6),
      antennaMat
    );
    antenna.position.set(side * 0.1, 0.55, 0);
    antenna.rotation.z = side * 0.3;
    alien.add(antenna);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), antennaMat);
    ball.position.set(side * 0.15, 0.75, 0);
    alien.add(ball);
  }

  return alien;
}

export function buildSkull(): THREE.Group {
  const skull = new THREE.Group();

  // Pink skull head
  const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    roughness: 0.7
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.scale.set(1, 1.1, 0.9);
  head.castShadow = true;
  skull.add(head);

  // Dark eye sockets
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x220022 });
  for (const side of [-1, 1]) {
    const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    eyeSocket.position.set(side * 0.12, 0.08, 0.25);
    eyeSocket.scale.set(0.8, 1.2, 0.6);
    skull.add(eyeSocket);
  }

  // Nose hole
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 6), eyeMat);
  nose.position.set(0, -0.05, 0.28);
  nose.rotation.x = Math.PI;
  skull.add(nose);

  // Jaw
  const jawGeo = new THREE.BoxGeometry(0.25, 0.15, 0.2);
  const jaw = new THREE.Mesh(jawGeo, headMat);
  jaw.position.set(0, -0.25, 0.15);
  jaw.castShadow = true;
  skull.add(jaw);

  return skull;
}

export function buildCrater(radius: number): THREE.Mesh {
  const craterGeo = new THREE.CylinderGeometry(radius * 0.3, radius, 0.3, 16);
  const craterMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.95
  });
  const crater = new THREE.Mesh(craterGeo, craterMat);
  crater.receiveShadow = true;
  return crater;
}
