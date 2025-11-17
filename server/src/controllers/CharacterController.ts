/**
 * Character Controller
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CharacterModel } from '../models/Character';

export class CharacterController {
  /**
   * Get all characters for current user
   */
  static async getMyCharacters(req: AuthRequest, res: Response) {
    try {
      const characters = CharacterModel.findByUserId(req.user!.id);
      res.json({ characters });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get characters' });
    }
  }

  /**
   * Get specific character
   */
  static async getCharacter(req: AuthRequest, res: Response) {
    try {
      const characterId = parseInt(req.params.id);
      const character = CharacterModel.findById(characterId);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Check ownership
      if (character.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not your character' });
      }

      res.json({ character });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get character' });
    }
  }

  /**
   * Create new character
   */
  static async createCharacter(req: AuthRequest, res: Response) {
    try {
      const { name, stats } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Character name is required' });
      }

      const character = CharacterModel.create(req.user!.id, name, stats);

      res.status(201).json({
        message: 'Character created',
        character
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create character' });
    }
  }

  /**
   * Update character
   */
  static async updateCharacter(req: AuthRequest, res: Response) {
    try {
      const characterId = parseInt(req.params.id);
      const character = CharacterModel.findById(characterId);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Check ownership
      if (character.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not your character' });
      }

      const updated = CharacterModel.update(characterId, req.body);

      res.json({
        message: 'Character updated',
        character: updated
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update character' });
    }
  }

  /**
   * Delete character
   */
  static async deleteCharacter(req: AuthRequest, res: Response) {
    try {
      const characterId = parseInt(req.params.id);
      const character = CharacterModel.findById(characterId);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Check ownership
      if (character.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not your character' });
      }

      CharacterModel.delete(characterId);

      res.json({ message: 'Character deleted' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete character' });
    }
  }

  /**
   * Gain experience
   */
  static async gainExp(req: AuthRequest, res: Response) {
    try {
      const characterId = parseInt(req.params.id);
      const { amount } = req.body;

      const character = CharacterModel.findById(characterId);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      if (character.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not your character' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid EXP amount' });
      }

      const updated = CharacterModel.gainExp(characterId, amount);

      res.json({
        message: 'EXP gained',
        character: updated,
        leveledUp: updated!.level > character.level
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to gain EXP' });
    }
  }

  /**
   * Add stat points
   */
  static async addStatPoints(req: AuthRequest, res: Response) {
    try {
      const characterId = parseInt(req.params.id);
      const { stat, points } = req.body;

      const character = CharacterModel.findById(characterId);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      if (character.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not your character' });
      }

      if (!stat || !points || points <= 0) {
        return res.status(400).json({ error: 'Invalid stat or points' });
      }

      const updated = CharacterModel.addStatPoints(characterId, stat, points);

      if (!updated) {
        return res.status(400).json({ error: 'Not enough stat points or invalid stat' });
      }

      res.json({
        message: 'Stat points added',
        character: updated
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add stat points' });
    }
  }

  /**
   * Take damage
   */
  static async takeDamage(req: AuthRequest, res: Response) {
    try {
      const characterId = parseInt(req.params.id);
      const { amount } = req.body;

      const character = CharacterModel.findById(characterId);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      if (character.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not your character' });
      }

      const updated = CharacterModel.takeDamage(characterId, amount);

      res.json({
        message: 'Damage taken',
        character: updated,
        died: updated!.hp <= 0
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to take damage' });
    }
  }

  /**
   * Heal
   */
  static async heal(req: AuthRequest, res: Response) {
    try {
      const characterId = parseInt(req.params.id);
      const { amount } = req.body;

      const character = CharacterModel.findById(characterId);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      if (character.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not your character' });
      }

      const updated = CharacterModel.heal(characterId, amount);

      res.json({
        message: 'Healed',
        character: updated
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to heal' });
    }
  }
}
