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
};

type TreeMeta = {
  mesh: THREE.Mesh;
  alive: boolean;
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

export default function ForestScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<InputState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    attack: false
  });
  const [status, setStatus] = useState('Click the scene to capture the cursor and play.');

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationId = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1420);
    scene.fog = new THREE.FogExp2(0x0c1623, 0.03);

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
    const ambient = new THREE.AmbientLight(0xcfe8ff, 0.45);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
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
    const trees: TreeMeta[] = [];
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
      trees.push({ mesh: firstMesh, alive: true });
    }
    scene.add(forest);

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
    sword.position.set(0.45, 0.3, 0.1);
    sword.rotation.y = Math.PI / 4;
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
      swingRegistered: false
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
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };

    document.addEventListener('pointerlockchange', updateStatus);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('click', onClick);

    // Scene helpers
    const cameraOffset = new THREE.Vector3(0, 1.7, 4.8);
    const cameraTarget = new THREE.Vector3();
    const forwardDir = new THREE.Vector3();
    const rightDir = new THREE.Vector3();
    const clock = new THREE.Clock();

    const applyChop = () => {
      const forward = forwardDir
        .set(Math.sin(playerState.yaw), 0, Math.cos(playerState.yaw))
        .normalize();
      const playerPos = player.position.clone();

      trees.forEach((entry) => {
        if (!entry.alive) return;
        const offset = entry.mesh.getWorldPosition(new THREE.Vector3()).sub(playerPos);
        const distance = offset.length();
        if (distance > 3.1) return;
        offset.normalize();
        if (offset.dot(forward) < 0.35) return;
        entry.alive = false;
        entry.mesh.parent?.traverse((child) => {
          child.visible = false;
        });
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

      // Movement
      forwardDir.set(Math.sin(playerState.yaw), 0, Math.cos(playerState.yaw)).normalize();
      rightDir.set(forwardDir.z, 0, -forwardDir.x);

      const moveVector = new THREE.Vector3();
      if (input.forward) moveVector.add(forwardDir);
      if (input.back) moveVector.sub(forwardDir);
      if (input.left) moveVector.sub(rightDir);
      if (input.right) moveVector.add(rightDir);

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize().multiplyScalar(8);
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

      if (input.jump && playerState.onGround) {
        playerState.velocity.y = 8.5;
        playerState.onGround = false;
      }

      if (!playerState.onGround) {
        playerState.velocity.y -= 24 * delta;
      }

      player.position.addScaledVector(playerState.velocity, delta);

      if (player.position.y <= 0) {
        player.position.y = 0;
        playerState.velocity.y = 0;
        playerState.onGround = true;
      }

      // Keep player within bounds
      const radius = Math.min(Math.sqrt(player.position.x ** 2 + player.position.z ** 2), 31.8);
      if (radius > 31.5) {
        const scale = 31.5 / radius;
        player.position.x *= scale;
        player.position.z *= scale;
        playerState.velocity.multiplyScalar(0.6);
      }

      // Sword animation
      const swingPhase = THREE.MathUtils.clamp(
        1 - playerState.attackTimer / 0.35,
        0,
        1
      );
      sword.rotation.x = -Math.sin(swingPhase * Math.PI) * 0.9;
      sword.rotation.y = Math.PI / 4 + swingPhase * 0.6;

      player.rotation.y = playerState.yaw;

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
      renderer.dispose();
      groundGeo.dispose();
      pathGeo.dispose();
      body.geometry.dispose();
      head.geometry.dispose();
      sword.geometry.dispose();
    };
  }, []);

  const setDirection = (key: keyof InputState, pressed: boolean) => {
    inputRef.current[key] = pressed;
  };

  return (
    <div className="canvas-shell" ref={containerRef}>
      <canvas ref={canvasRef} className="scene-canvas" />
      <div className="hud">
        <div className="hud-row">
          <div className="hud-card">
            <h3>Desktop Controls</h3>
            <ul>
              <li>WASD / Arrow keys to move</li>
              <li>Space to jump · K to swing sword</li>
              <li>Click canvas to lock mouse; move to look</li>
            </ul>
            <div className="status-pill">{status}</div>
          </div>
          <div className="hud-card">
            <h3>Objective</h3>
            <p>
              Explore the procedural forest, find the gap in the mountain ring, and chop through
              trees blocking your path.
            </p>
            <p className="legend">Stick-figure visuals now; swap in character models later.</p>
          </div>
        </div>
        <div className="hud-row">
          <div className="hud-card mobile-controls">
            <div>
            <div className="legend">Touch movement</div>
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
          </div>
            <div className="action">
              <div className="legend">Actions</div>
              <button
                onPointerDown={() => setDirection('jump', true)}
                onPointerUp={() => setDirection('jump', false)}
              >
                Jump
              </button>
              <button
                onPointerDown={() => setDirection('attack', true)}
                onPointerUp={() => setDirection('attack', false)}
              >
                Chop
              </button>
              <p className="legend">Touch controls stay active; keyboard and mouse still work.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
