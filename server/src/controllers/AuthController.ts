/**
 * Authentication Controller
 */
import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { CharacterModel } from '../models/Character';
import { generateToken } from '../middleware/auth';

export class AuthController {
  /**
   * Register new user
   */
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password, characterName } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Username, email, and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters'
        });
      }

      // Check if user exists
      if (UserModel.findByUsername(username)) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      if (UserModel.findByEmail(email)) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Create user
      const user = UserModel.create(username, email, password);

      // Create default character
      const defaultName = characterName || `${username}'s Character`;
      const character = CharacterModel.create(user.id, defaultName);

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: UserModel.toSafeObject(user),
        character
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required'
        });
      }

      // Find user
      const user = UserModel.findByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      if (!UserModel.verifyPassword(user, password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if active
      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      // Update last login
      UserModel.updateLastLogin(user.id);

      // Get user's characters
      const characters = CharacterModel.findByUserId(user.id);

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: 'Login successful',
        token,
        user: UserModel.toSafeObject(user),
        characters
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed', details: error.message });
    }
  }

  /**
   * Get current user info
   */
  static async me(req: any, res: Response) {
    try {
      const user = UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const characters = CharacterModel.findByUserId(user.id);

      res.json({
        user: UserModel.toSafeObject(user),
        characters
      });
    } catch (error: any) {
      console.error('Me error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }
}
