import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { type CreateUserDto, type User, UserService } from './user.service';

// Mock the @Log decorator before importing the service
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cardNumber: '1234567890123456',
      };

      const result = await service.createUser(userData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('email', 'john@example.com');
      expect(result).toHaveProperty('createdAt');
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create user without card number', async () => {
      const userData: CreateUserDto = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      };

      const result = await service.createUser(userData);

      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('jane@example.com');
    });

    it('should add user to internal array', async () => {
      const userData: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const initialLength = (service as unknown as { users: Array<unknown> }).users.length;
      await service.createUser(userData);
      const finalLength = (service as unknown as { users: Array<unknown> }).users.length;

      expect(finalLength).toBe(initialLength + 1);
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = await service.createUser(userData);
      const foundUser = await service.findUserById(createdUser.id);

      expect(foundUser).toEqual(createdUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(service.findUserById(nonExistentId)).rejects.toThrow(NotFoundException);
      await expect(service.findUserById(nonExistentId)).rejects.toThrow(
        `User with ID ${nonExistentId} not found`
      );
    });
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const user1: CreateUserDto = {
        name: 'User 1',
        email: 'user1@example.com',
        password: 'password123',
      };
      const user2: CreateUserDto = {
        name: 'User 2',
        email: 'user2@example.com',
        password: 'password123',
      };

      await service.createUser(user1);
      await service.createUser(user2);

      const allUsers = await service.findAllUsers();

      expect(allUsers).toHaveLength(2);
      expect(allUsers[0].name).toBe('User 1');
      expect(allUsers[1].name).toBe('User 2');
    });

    it('should return empty array when no users', async () => {
      const allUsers = await service.findAllUsers();
      expect(allUsers).toHaveLength(0);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = await service.createUser(userData);
      const updates = { name: 'John Updated', email: 'john.updated@example.com' };

      const updatedUser = await service.updateUser(createdUser.id, updates);

      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.name).toBe('John Updated');
      expect(updatedUser.email).toBe('john.updated@example.com');
      expect(updatedUser.createdAt).toEqual(createdUser.createdAt);
    });

    it('should update only provided fields', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = await service.createUser(userData);
      const updates = { name: 'John Updated' };

      const updatedUser = await service.updateUser(createdUser.id, updates);

      expect(updatedUser.name).toBe('John Updated');
      expect(updatedUser.email).toBe('john@example.com'); // Unchanged
    });

    it('should throw NotFoundException when user not found', async () => {
      const nonExistentId = 'non-existent-id';
      const updates = { name: 'Updated' };

      await expect(service.updateUser(nonExistentId, updates)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = await service.createUser(userData);
      const initialLength = (service as unknown as { users: Array<unknown> }).users.length;

      await service.deleteUser(createdUser.id);

      const finalLength = (service as unknown as { users: Array<unknown> }).users.length;
      expect(finalLength).toBe(initialLength - 1);
    });

    it('should throw NotFoundException when user not found', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(service.deleteUser(nonExistentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      // Create test users
      await service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      await service.createUser({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      });
      await service.createUser({
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: 'password123',
      });
    });

    it('should search users by name', async () => {
      const results = await service.searchUsers('john');

      expect(results).toHaveLength(2);
      expect(results.some((user) => user.name === 'John Doe')).toBe(true);
      expect(results.some((user) => user.name === 'Bob Johnson')).toBe(true);
    });

    it('should search users by email', async () => {
      const results = await service.searchUsers('jane@example.com');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Jane Smith');
    });

    it('should be case insensitive', async () => {
      const results = await service.searchUsers('JOHN');

      expect(results).toHaveLength(2);
    });

    it('should return empty array when no matches', async () => {
      const results = await service.searchUsers('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('getUserStats', () => {
    it('should return correct stats for empty user list', async () => {
      const stats = await service.getUserStats();

      expect(stats).toHaveProperty('total', 0);
      expect(stats).toHaveProperty('recent', 0);
    });

    it('should return correct stats with users', async () => {
      // Create users with different creation times
      const now = new Date();

      // Mock recent user (within 24 hours)
      const recentUser: CreateUserDto = {
        name: 'Recent User',
        email: 'recent@example.com',
        password: 'password123',
      };
      await service.createUser(recentUser);

      // Mock old user (more than 24 hours ago)
      const oldUser: CreateUserDto = {
        name: 'Old User',
        email: 'old@example.com',
        password: 'password123',
      };
      await service.createUser(oldUser);

      // Manually set old user's creation time to more than 24 hours ago
      const users = (service as unknown as { users: Array<unknown> }).users;
      const oldUserIndex = users.findIndex((u: User) => u.name === 'Old User');
      if (oldUserIndex !== -1) {
        users[oldUserIndex].createdAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
      }

      const stats = await service.getUserStats();

      expect(stats.total).toBe(2);
      expect(stats.recent).toBe(1);
    });
  });
});
