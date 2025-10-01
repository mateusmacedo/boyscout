import { HttpException, NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller';
import type { CreateUserDto, User, UserService } from './user.service';

// Mock the @Log decorator before importing the controller
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(() => {
    // Create mock service
    service = {
      createUser: jest.fn(),
      findUserById: jest.fn(),
      findAllUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      searchUsers: jest.fn(),
      getUserStats: jest.fn(),
    } as UserService;

    // Create controller instance manually
    controller = new UserController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        cardNumber: '1234567890123456',
      };

      const expectedUser: User = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      };

      jest.spyOn(service, 'createUser').mockResolvedValue(expectedUser);

      const result = await controller.createUser(userData);

      expect(service.createUser).toHaveBeenCalledWith(userData);
      expect(result).toEqual(expectedUser);
    });

    it('should throw HttpException when service throws error', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const error = new Error('Service error');
      jest.spyOn(service, 'createUser').mockRejectedValue(error);

      await expect(controller.createUser(userData)).rejects.toThrow(HttpException);
      await expect(controller.createUser(userData)).rejects.toThrow('Failed to create user');
    });
  });

  describe('getUserById', () => {
    it('should return user by id successfully', async () => {
      const userId = 'user-123';
      const expectedUser: User = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      };

      jest.spyOn(service, 'findUserById').mockResolvedValue(expectedUser);

      const result = await controller.getUserById(userId);

      expect(service.findUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedUser);
    });

    it('should throw HttpException when user not found', async () => {
      const userId = 'non-existent';
      const notFoundError = new NotFoundException(`User with ID ${userId} not found`);

      jest.spyOn(service, 'findUserById').mockRejectedValue(notFoundError);

      await expect(controller.getUserById(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw HttpException when service throws unexpected error', async () => {
      const userId = 'user-123';
      const error = new Error('Unexpected error');

      jest.spyOn(service, 'findUserById').mockRejectedValue(error);

      await expect(controller.getUserById(userId)).rejects.toThrow(HttpException);
      await expect(controller.getUserById(userId)).rejects.toThrow('Failed to find user');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const expectedUsers: User[] = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date(),
        },
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          createdAt: new Date(),
        },
      ];

      jest.spyOn(service, 'findAllUsers').mockResolvedValue(expectedUsers);

      const result = await controller.getAllUsers();

      expect(service.findAllUsers).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 'user-123';
      const updates = { name: 'John Updated', email: 'john.updated@example.com' };
      const expectedUser: User = {
        id: userId,
        name: 'John Updated',
        email: 'john.updated@example.com',
        createdAt: new Date(),
      };

      jest.spyOn(service, 'updateUser').mockResolvedValue(expectedUser);

      const result = await controller.updateUser(userId, updates);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updates);
      expect(result).toEqual(expectedUser);
    });

    it('should throw HttpException when user not found', async () => {
      const userId = 'non-existent';
      const updates = { name: 'Updated' };
      const notFoundError = new NotFoundException(`User with ID ${userId} not found`);

      jest.spyOn(service, 'updateUser').mockRejectedValue(notFoundError);

      await expect(controller.updateUser(userId, updates)).rejects.toThrow(NotFoundException);
    });

    it('should throw HttpException when service throws unexpected error', async () => {
      const userId = 'user-123';
      const updates = { name: 'Updated' };
      const error = new Error('Unexpected error');

      jest.spyOn(service, 'updateUser').mockRejectedValue(error);

      await expect(controller.updateUser(userId, updates)).rejects.toThrow(HttpException);
      await expect(controller.updateUser(userId, updates)).rejects.toThrow('Failed to update user');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-123';

      jest.spyOn(service, 'deleteUser').mockResolvedValue(undefined);

      const result = await controller.deleteUser(userId);

      expect(service.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw HttpException when user not found', async () => {
      const userId = 'non-existent';
      const notFoundError = new NotFoundException(`User with ID ${userId} not found`);

      jest.spyOn(service, 'deleteUser').mockRejectedValue(notFoundError);

      await expect(controller.deleteUser(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw HttpException when service throws unexpected error', async () => {
      const userId = 'user-123';
      const error = new Error('Unexpected error');

      jest.spyOn(service, 'deleteUser').mockRejectedValue(error);

      await expect(controller.deleteUser(userId)).rejects.toThrow(HttpException);
      await expect(controller.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const query = 'john';
      const expectedUsers: User[] = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date(),
        },
      ];

      jest.spyOn(service, 'searchUsers').mockResolvedValue(expectedUsers);

      const result = await controller.searchUsers(query);

      expect(service.searchUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedUsers);
    });

    it('should throw HttpException when query is missing', async () => {
      await expect(controller.searchUsers('')).rejects.toThrow(HttpException);
      await expect(controller.searchUsers('')).rejects.toThrow('Query parameter is required');
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      const expectedStats = {
        total: 10,
        recent: 3,
      };

      jest.spyOn(service, 'getUserStats').mockResolvedValue(expectedStats);

      const result = await controller.getUserStats();

      expect(service.getUserStats).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });
  });
});
