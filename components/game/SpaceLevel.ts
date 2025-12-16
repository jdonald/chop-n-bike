import * as THREE from 'three';
import { LevelData, PlanetMeta, buildPlanet, createExitPortal } from './shared';

export function setupSpaceLevel(scene: THREE.Scene): LevelData {
  // Set background to dark space with stars
  scene.background = new THREE.Color(0x000011);
  scene.fog = new THREE.Fog(0x000011, 40, 150);

  const planets: PlanetMeta[] = [];

  // Add starfield
  const starGeo = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 500; i++) {
    const x = THREE.MathUtils.randFloatSpread(200);
    const y = THREE.MathUtils.randFloatSpread(200);
    const z = THREE.MathUtils.randFloatSpread(200);
    starPositions.push(x, y, z);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Create 5 planets in a layout that encourages jumping between them
  const planetConfigs = [
    { pos: new THREE.Vector3(0, 0, 0), radius: 8, color: 0x8b4513 },      // Brown starting planet
    { pos: new THREE.Vector3(18, -3, -5), radius: 5, color: 0xff6347 },   // Red planet
    { pos: new THREE.Vector3(25, 8, 15), radius: 6, color: 0x4169e1 },    // Blue planet
    { pos: new THREE.Vector3(-10, 12, 20), radius: 4, color: 0x9370db },  // Purple planet
    { pos: new THREE.Vector3(-15, -5, 35), radius: 7, color: 0xffd700 }   // Gold planet (exit)
  ];

  planetConfigs.forEach((config, index) => {
    const planet = buildPlanet(config.radius, config.color);
    planet.position.copy(config.pos);
    scene.add(planet);
    planets.push({
      mesh: planet,
      position: config.pos.clone(),
      radius: config.radius
    });

    // Add small craters/details to planets
    for (let i = 0; i < 5; i++) {
      const craterGeo = new THREE.SphereGeometry(config.radius * 0.15, 8, 8);
      const craterMat = new THREE.MeshStandardMaterial({
        color: config.color - 0x222222,
        roughness: 0.9
      });
      const crater = new THREE.Mesh(craterGeo, craterMat);

      // Random position on sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = config.radius * 1.01;
      crater.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      planet.add(crater);
    }
  });

  // Exit portal on the 5th planet (gold one)
  const exitPlanet = planetConfigs[4];
  const exitPortal = createExitPortal(
    exitPlanet.pos.x,
    exitPlanet.pos.y + exitPlanet.radius + 2,
    exitPlanet.pos.z
  );
  scene.add(exitPortal);

  return {
    trees: [],
    enemies: [],
    exitPortal,
    waterLevel: -1000, // No water in space
    groundLevel: -1000, // No traditional ground
    boundaryRadius: 100,
    planets
  };
}
