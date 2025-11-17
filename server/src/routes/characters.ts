/**
 * Character Routes
 */
import { Router } from 'express';
import { CharacterController } from '../controllers/CharacterController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Character CRUD
router.get('/', CharacterController.getMyCharacters);
router.post('/', CharacterController.createCharacter);
router.get('/:id', CharacterController.getCharacter);
router.put('/:id', CharacterController.updateCharacter);
router.delete('/:id', CharacterController.deleteCharacter);

// Character actions
router.post('/:id/gain-exp', CharacterController.gainExp);
router.post('/:id/add-stats', CharacterController.addStatPoints);
router.post('/:id/take-damage', CharacterController.takeDamage);
router.post('/:id/heal', CharacterController.heal);

export default router;
