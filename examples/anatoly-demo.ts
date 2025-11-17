/**
 * The Gamer RPG - Anatoly Demo Scene
 * Demonstrates the RPG system with Anatoly as the player character
 */

import {
  Engine,
  Scene,
  GameObject,
  Camera,
  Light,
  LightType,
  MeshRenderer,
  Mesh,
  Material,
  Shader,
  ShaderLibrary,
  Vector3,
  Quaternion,
} from '../dist/index.js';

import {
  CharacterStats,
  GamerAbility,
  PlayerController,
  NPCController,
  NPCType,
  RPGHud,
} from '../dist/rpg/index.js';

async function main() {
  console.log('🎮 Starting The Gamer RPG - Anatoly\'s Story 🎮\n');

  // Initialize engine
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const engine = Engine.instance;
  engine.initialize(canvas);

  // Create main scene
  const scene = engine.sceneManager.createScene('AnatolyDemo');

  // ========== CREATE ANATOLY (PLAYER) ==========
  console.log('Creating Anatoly...');
  const anatoly = scene.createGameObject('Anatoly');
  anatoly.transform.position = new Vector3(0, 0.5, 0);

  // Add visual representation (cube for now)
  const anatolyRenderer = anatoly.addComponent(MeshRenderer);
  anatolyRenderer.mesh = Mesh.createCube(1);
  const gl = engine.gl!;
  const shader = new Shader(gl, ShaderLibrary.litVertexShader, ShaderLibrary.litFragmentShader);
  anatolyRenderer.material = new Material(shader);
  anatolyRenderer.material.color = new Vector3(0.3, 0.5, 0.8); // Blue for player

  // Add character stats
  const anatolyStats = anatoly.addComponent(CharacterStats);
  anatolyStats.characterName = 'Anatoly Petrauskas';
  anatolyStats.loadData({
    name: 'Anatoly Petrauskas',
    level: 1,
    exp: 0,
    stats: {
      str: 8,
      vit: 9,
      dex: 11,
      int: 14,
      wis: 10,
      luck: 12
    },
    money: 1000
  });

  // Add Gamer ability
  const gamerAbility = anatoly.addComponent(GamerAbility);

  // Add player controller
  const playerController = anatoly.addComponent(PlayerController);

  console.log('✅ Anatoly created!\n');

  // ========== CREATE CAMERA ==========
  const cameraObj = scene.createGameObject('MainCamera');
  const camera = cameraObj.addComponent(Camera);
  cameraObj.transform.position = new Vector3(0, 5, 10);
  cameraObj.transform.lookAt(new Vector3(0, 0, 0));

  // Link camera to player controller
  playerController.setCamera(cameraObj);

  // ========== CREATE HUD ==========
  const hudObj = scene.createGameObject('HUD');
  const hud = hudObj.addComponent(RPGHud);
  hud.setPlayerStats(anatolyStats);

  // ========== CREATE ENVIRONMENT ==========
  console.log('Creating environment...');

  // Ground plane
  const ground = scene.createGameObject('Ground');
  const groundRenderer = ground.addComponent(MeshRenderer);
  groundRenderer.mesh = Mesh.createPlane(20, 20);
  groundRenderer.material = new Material(shader);
  groundRenderer.material.color = new Vector3(0.2, 0.6, 0.2); // Green grass
  ground.transform.rotation = Quaternion.fromEuler(-90, 0, 0);

  // Walls (Mikro-15 apartment simulation)
  const createWall = (name: string, pos: Vector3, scale: Vector3) => {
    const wall = scene.createGameObject(name);
    const wallRenderer = wall.addComponent(MeshRenderer);
    wallRenderer.mesh = Mesh.createCube(1);
    wallRenderer.material = new Material(shader);
    wallRenderer.material.color = new Vector3(0.6, 0.6, 0.7); // Gray walls
    wall.transform.position = pos;
    wall.transform.scale = scale;
    return wall;
  };

  createWall('Wall_North', new Vector3(0, 2, -5), new Vector3(10, 4, 0.2));
  createWall('Wall_South', new Vector3(0, 2, 5), new Vector3(10, 4, 0.2));
  createWall('Wall_East', new Vector3(5, 2, 0), new Vector3(0.2, 4, 10));
  createWall('Wall_West', new Vector3(-5, 2, 0), new Vector3(0.2, 4, 10));

  console.log('✅ Environment created!\n');

  // ========== CREATE NPCs ==========
  console.log('Creating NPCs...');

  // Babushka
  const babushka = scene.createGameObject('Babushka');
  babushka.transform.position = new Vector3(3, 0.5, -3);
  const babushkaRenderer = babushka.addComponent(MeshRenderer);
  babushkaRenderer.mesh = Mesh.createCube(1);
  babushkaRenderer.material = new Material(shader);
  babushkaRenderer.material.color = new Vector3(0.8, 0.6, 0.4); // Tan/beige
  babushka.transform.scale = new Vector3(0.8, 0.8, 0.8);

  const babushkaStats = babushka.addComponent(CharacterStats);
  babushkaStats.characterName = 'Elena Petrauskienė';
  babushkaStats.loadData({
    name: 'Elena Petrauskienė',
    level: 11,
    stats: { str: 12, vit: 15, dex: 8, int: 16, wis: 18, luck: 10 }
  });

  const babushkaAI = babushka.addComponent(NPCController);
  babushkaAI.npcName = 'Babushka';
  babushkaAI.npcType = NPCType.Friendly;
  babushkaAI.addDialogue('Anatoly, have you eaten?');
  babushkaAI.addDialogue('Don\'t stay up too late gaming!');
  babushkaAI.addDialogue('Your parents sent money this month.');

  // Zombie (for testing)
  const zombie = scene.createGameObject('Zombie');
  zombie.transform.position = new Vector3(-3, 0.5, 3);
  const zombieRenderer = zombie.addComponent(MeshRenderer);
  zombieRenderer.mesh = Mesh.createCube(1);
  zombieRenderer.material = new Material(shader);
  zombieRenderer.material.color = new Vector3(0.3, 0.5, 0.2); // Zombie green
  zombie.transform.scale = new Vector3(0.9, 1.1, 0.9);

  const zombieStats = zombie.addComponent(CharacterStats);
  zombieStats.characterName = 'Zombie';
  zombieStats.loadData({
    name: 'Zombie',
    level: 3,
    stats: { str: 6, vit: 8, dex: 4, int: 1, wis: 1, luck: 3 }
  });

  const zombieAI = zombie.addComponent(NPCController);
  zombieAI.npcName = 'Zombie';
  zombieAI.npcType = NPCType.Enemy;

  console.log('✅ NPCs created!\n');

  // ========== CREATE LIGHTING ==========
  const sunObj = scene.createGameObject('Sun');
  const sun = sunObj.addComponent(Light);
  sun.type = LightType.Directional;
  sun.color = new Vector3(1, 1, 1);
  sun.intensity = 1;
  sunObj.transform.rotation = Quaternion.fromEuler(-45, 45, 0);

  const pointLight = scene.createGameObject('RoomLight');
  const roomLight = pointLight.addComponent(Light);
  roomLight.type = LightType.Point;
  roomLight.color = new Vector3(1, 0.9, 0.7);
  roomLight.intensity = 2;
  roomLight.range = 15;
  pointLight.transform.position = new Vector3(0, 3, 0);

  // ========== LOAD SCENE AND START ==========
  console.log('Loading scene...');
  await engine.sceneManager.loadScene('AnatolyDemo');

  console.log('✅ Scene loaded!\n');
  console.log('='.repeat(60));
  console.log('🎮 THE GAMER RPG - DEMO STARTED! 🎮');
  console.log('='.repeat(60));
  console.log('\nControls:');
  console.log('  WASD - Move');
  console.log('  Shift - Run');
  console.log('  Space - Jump');
  console.log('  Right Mouse - Rotate camera');
  console.log('  Mouse Wheel - Zoom');
  console.log('  Tab - Show character status');
  console.log('\nConsole Commands:');
  console.log('  gamerAbility.showStatus() - View detailed stats');
  console.log('  gamerAbility.observe(zombie) - Use Observe skill');
  console.log('  anatolyStats.gainExp(100) - Gain experience');
  console.log('  gamerAbility.createInstantDungeon("Zombie") - Create ID');
  console.log('\n' + '='.repeat(60) + '\n');

  // Make objects available in console
  (window as any).anatoly = anatoly;
  (window as any).anatolyStats = anatolyStats;
  (window as any).gamerAbility = gamerAbility;
  (window as any).babushka = babushka;
  (window as any).zombie = zombie;
  (window as any).hud = hud;

  // Demo: Show Anatoly's status
  setTimeout(() => {
    gamerAbility.showStatus();
  }, 1000);

  // Demo: Gain some exp after 3 seconds
  setTimeout(() => {
    console.log('\n🎉 Test: Gaining 50 EXP...\n');
    anatolyStats.gainExp(50);
  }, 3000);

  engine.start();
}

// Wait for DOM to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
