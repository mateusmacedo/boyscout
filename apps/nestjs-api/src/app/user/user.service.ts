import { randomUUID } from 'node:crypto';
import { Log } from '@boyscout/node-logger';
import { Injectable, NotFoundException } from '@nestjs/common';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  cardNumber?: string;
}

@Injectable()
export class UserService {
  private users: User[] = [];

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  async createUser(userData: CreateUserDto): Promise<User> {
    // Simula validação e criação de usuário
    await new Promise((resolve) => setTimeout(resolve, 150));

    const user: User = {
      id: randomUUID(),
      name: userData.name,
      email: userData.email,
      createdAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
  })
  async findUserById(id: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  async findAllUsers(): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [...this.users];
  }

  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  async updateUser(id: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 120));

    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // TypeScript assertion: sabemos que userIndex é válido após a verificação acima
    const existingUser = this.users[userIndex];
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    this.users[userIndex] = { ...existingUser, ...updates };
    const updatedUser = this.users[userIndex];
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: false,
  })
  async deleteUser(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users.splice(userIndex, 1);
  }

  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.5, // Apenas 50% dos logs para debug
  })
  async searchUsers(query: string): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const filteredUsers = this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
    );

    return filteredUsers;
  }

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  async getUserStats(): Promise<{ total: number; recent: number }> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent = this.users.filter((user) => user.createdAt > oneDayAgo).length;

    return {
      total: this.users.length,
      recent,
    };
  }
}
