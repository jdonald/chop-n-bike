'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { InputState, LevelData, createPlayer } from './game/shared';
import { setupForestLevel } from './game/ForestLevel';
import { setupOceanLevel } from './game/OceanLevel';
import { setupTrainLevel } from './game/TrainLevel';
import { setupSpaceLevel } from './game/SpaceLevel';
import { setupMoonLevel } from './game/MoonLevel';
import { setupPinkIslandLevel } from './game/PinkIslandLevel';

export default function GameScene() {
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

    // Setup level
    let levelData: LevelData;
    if (currentLevel === 1) {
      levelData = setupForestLevel(scene);
    } else if (currentLevel === 2) {
      levelData = setupOceanLevel(scene);
    } else if (currentLevel === 3) {
      levelData = setupTrainLevel(scene);
    } else if (currentLevel === 4) {
      levelData = setupSpaceLevel(scene);
    } else if (currentLevel === 5) {
      levelData = setupMoonLevel(scene);
    } else {
      levelData = setupPinkIslandLevel(scene);
    }

    // Player
    const { player, body, head, sword } = createPlayer();
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
      const forward = forwardDir
        .set(-Math.sin(playerState.yaw), 0, -Math.cos(playerState.yaw))
        .normalize();
      const playerPos = player.position.clone();

      levelData.trees.forEach((entry) => {
        if (!entry.alive || entry.floating) return;
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

      levelData.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const offset = enemy.group.position.clone().sub(playerPos);
        const distance = offset.length();
        if (distance > 3.5) return;
        offset.normalize();
        if (offset.dot(forward) < 0.3) return;
        enemy.alive = false;
        enemy.group.visible = false;
        let points = 150;
        if (enemy.type === 'pufferfish') points = 250;
        if (enemy.type === 'alien') points = 300;
        if (enemy.type === 'skull') points = 350;
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
        playerState.inWater = player.position.y < levelData.waterLevel;
      } else {
        playerState.inWater = false;
      }

      // Check if player is on top of a tree or climbing
      playerState.onTree = false;
      playerState.climbingTree = null;
      levelData.trees.forEach((treeEntry) => {
        if (!treeEntry.group || !treeEntry.floating) return;
        const treePos = treeEntry.group.position;
        const distXZ = Math.sqrt(
          (player.position.x - treePos.x) ** 2 + (player.position.z - treePos.z) ** 2
        );

        if (distXZ < 0.4 && Math.abs(player.position.y - treePos.y) < 0.3) {
          playerState.onTree = true;
          playerState.onGround = true;
        }

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
          playerState.velocity.y = 8.5;
          playerState.onGround = false;
        } else if (playerState.inWater || playerState.climbingTree) {
          playerState.velocity.y = 5;
        }
      }

      // Sinking in water
      if (playerState.inWater) {
        playerState.velocity.y -= 3 * delta;
        if (input.sink) {
          playerState.velocity.y -= 8 * delta;
        }
      } else if (!playerState.onGround && !playerState.onTree) {
        playerState.velocity.y -= 24 * delta;
      }

      // Space gravity (Level 4)
      if (currentLevel === 4 && levelData.planets) {
        // Find nearest planet
        let nearestPlanet = null;
        let minDist = Infinity;
        for (const planet of levelData.planets) {
          const dist = player.position.distanceTo(planet.position);
          if (dist < minDist) {
            minDist = dist;
            nearestPlanet = planet;
          }
        }

        if (nearestPlanet) {
          // Apply gravity toward nearest planet
          const toPlanet = new THREE.Vector3().subVectors(nearestPlanet.position, player.position);
          const distance = toPlanet.length();

          // Only apply gravity if within range
          if (distance > nearestPlanet.radius + 0.5 && distance < nearestPlanet.radius + 30) {
            toPlanet.normalize();
            const gravityStrength = 18;
            playerState.velocity.addScaledVector(toPlanet, gravityStrength * delta);
          }

          // Check collision with planet surface
          if (distance <= nearestPlanet.radius + 0.6) {
            // Snap to surface
            const surfacePos = new THREE.Vector3()
              .subVectors(player.position, nearestPlanet.position)
              .normalize()
              .multiplyScalar(nearestPlanet.radius + 0.6)
              .add(nearestPlanet.position);
            player.position.copy(surfacePos);

            // Remove velocity component toward planet center
            const toPlanetNorm = new THREE.Vector3()
              .subVectors(player.position, nearestPlanet.position)
              .normalize();
            const velocityTowardPlanet = playerState.velocity.dot(toPlanetNorm);
            if (velocityTowardPlanet < 0) {
              playerState.velocity.addScaledVector(toPlanetNorm, -velocityTowardPlanet);
            }

            playerState.onGround = true;
          }

          // Allow "jumping" away from planet or "sinking" toward it
          if (input.sink && distance <= nearestPlanet.radius + 5) {
            // Push toward planet (like sinking)
            playerState.velocity.addScaledVector(toPlanet, 8 * delta);
          }
        }
      }

      player.position.addScaledVector(playerState.velocity, delta);

      // Ground collision
      if (player.position.y <= levelData.groundLevel) {
        player.position.y = levelData.groundLevel;
        playerState.velocity.y = 0;
        playerState.onGround = true;
      }

      // Water surface resistance
      if (currentLevel === 2 && player.position.y > levelData.waterLevel && playerState.velocity.y < 0) {
        const distToWater = player.position.y - levelData.waterLevel;
        if (distToWater < 0.5) {
          playerState.velocity.y *= 0.8;
        }
      }

      // Keep player within bounds
      const radius = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
      if (radius > levelData.boundaryRadius) {
        const scale = levelData.boundaryRadius / radius;
        player.position.x *= scale;
        player.position.z *= scale;
        playerState.velocity.multiplyScalar(0.6);
      }

      // Portal collision detection
      if (levelData.exitPortal) {
        const portalPos = levelData.exitPortal.position;
        const distToPortal = player.position.distanceTo(portalPos);
        if (distToPortal < 2) {
          if (currentLevel === 1) {
            setCurrentLevel(2);
          } else if (currentLevel === 2) {
            setCurrentLevel(3);
          } else if (currentLevel === 3) {
            setCurrentLevel(4);
          } else if (currentLevel === 4) {
            setCurrentLevel(5);
          } else if (currentLevel === 5) {
            setCurrentLevel(6);
          } else if (currentLevel === 6) {
            setScore((prev) => prev + 1000);
            setCurrentLevel(1);
          }
        }
      }

      // Level 3: Train animation and riding
      if (currentLevel === 3 && levelData.trainRef && levelData.trackRadius !== undefined) {
        levelData.trainAngle = (levelData.trainAngle || 0) + delta * 0.3;
        const trainX = Math.cos(levelData.trainAngle) * levelData.trackRadius;
        const trainZ = Math.sin(levelData.trainAngle) * levelData.trackRadius;
        levelData.trainRef.position.set(trainX, 0, trainZ);
        levelData.trainRef.rotation.y = -levelData.trainAngle + Math.PI / 2;

        const trainTop = 2.4;
        const dx = player.position.x - trainX;
        const dz = player.position.z - trainZ;
        const distToTrain = Math.sqrt(dx * dx + dz * dz);
        const onTrain = distToTrain < 2 &&
                       player.position.y >= trainTop - 0.5 &&
                       player.position.y <= trainTop + 1;

        if (onTrain) {
          playerState.onGround = true;
          if (player.position.y < trainTop) {
            player.position.y = trainTop;
            playerState.velocity.y = 0;
          }
          const prevAngle = levelData.trainAngle - delta * 0.3;
          const prevX = Math.cos(prevAngle) * levelData.trackRadius;
          const prevZ = Math.sin(prevAngle) * levelData.trackRadius;
          player.position.x += trainX - prevX;
          player.position.z += trainZ - prevZ;
        }

        // Maze wall collision
        if (levelData.mazeData && levelData.mazeOffsetX !== undefined) {
          const mazeLocalX = player.position.x - levelData.mazeOffsetX + (levelData.mazeSize! * levelData.mazeScale!) / 2;
          const mazeLocalZ = player.position.z - levelData.mazeOffsetZ! + (levelData.mazeSize! * levelData.mazeScale!) / 2;
          const gridX = Math.floor(mazeLocalX / levelData.mazeScale!);
          const gridZ = Math.floor(mazeLocalZ / levelData.mazeScale!);

          if (gridX >= 0 && gridX < levelData.mazeSize! &&
              gridZ >= 0 && gridZ < levelData.mazeSize! &&
              player.position.y < 3) {
            if (levelData.mazeData[gridX][gridZ]) {
              playerState.velocity.x *= -0.5;
              playerState.velocity.z *= -0.5;
              player.position.x -= playerState.velocity.x * delta * 2;
              player.position.z -= playerState.velocity.z * delta * 2;
            }
          }
        }
      }

      // Animate enemies
      const time = clock.elapsedTime;
      levelData.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        enemy.group.position.y = enemy.baseY + Math.sin(time * 2 + enemy.phase) * 0.5;
        if (enemy.type === 'jellyfish') {
          enemy.group.rotation.y += delta * 0.5;
        }
        if (enemy.type === 'pufferfish') {
          enemy.group.rotation.y += delta * 0.3;
        }
        if (enemy.type === 'alien') {
          enemy.group.rotation.y += delta * 0.4;
        }
        if (enemy.type === 'skull') {
          enemy.group.rotation.y = Math.sin(time * 1.5 + enemy.phase) * 0.3;
        }
      });

      // Sword animation
      const swingPhase = THREE.MathUtils.clamp(
        1 - playerState.attackTimer / 0.35,
        0,
        1
      );
      sword.rotation.y = -Math.PI / 3 + swingPhase * (Math.PI * 0.85);
      sword.rotation.x = -Math.sin(swingPhase * Math.PI) * 0.5;
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
          <button onClick={() => warpToLevel(4)} className={currentLevel === 4 ? 'active' : ''}>4</button>
          <button onClick={() => warpToLevel(5)} className={currentLevel === 5 ? 'active' : ''}>5</button>
          <button onClick={() => warpToLevel(6)} className={currentLevel === 6 ? 'active' : ''}>6</button>
        </div>
        <div className="score-display">Score: {score}</div>
        <div className="hud-row">
          <div className="hud-card desktop-only">
            <h3>Desktop Controls</h3>
            <ul>
              <li>WASD / Arrow keys to move</li>
              <li>Space to jump/swim · K to swing sword</li>
              {currentLevel === 2 && <li>Shift to sink faster in water</li>}
              {currentLevel === 4 && <li>Shift to push down toward planet</li>}
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
            {currentLevel === 4 && (
              <p>
                Jump between spherical planets in space! Use gravity to your advantage as you
                leap from planet to planet. Find the exit portal on the fifth golden planet!
              </p>
            )}
            {currentLevel === 5 && (
              <p>
                Explore the moon surface! Navigate craters, defeat green aliens with your sword,
                and locate the exit portal hidden somewhere on the lunar landscape.
              </p>
            )}
            {currentLevel === 6 && (
              <p>
                Welcome to the pink island! Surrounded by ocean, this island features pink trees
                and pink skulls. Defeat the skulls with your sword and find the exit portal!
              </p>
            )}
            <p className="legend">Level {currentLevel} of 6 · Stick-figure visuals for now.</p>
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
