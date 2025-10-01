import { Log } from '@boyscout/node-logger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { CreateUserDto, User, UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  async createUser(@Body() userData: CreateUserDto) {
    try {
      return await this.userService.createUser(userData);
    } catch (_error) {
      throw new HttpException('Failed to create user', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  async getAllUsers() {
    return await this.userService.findAllUsers();
  }

  @Get('search')
  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.5,
  })
  async searchUsers(@Query('q') query: string) {
    if (!query) {
      throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
    }

    return await this.userService.searchUsers(query);
  }

  @Get('stats')
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  async getUserStats() {
    return await this.userService.getUserStats();
  }

  @Get(':id')
  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
  })
  async getUserById(@Param('id') id: string) {
    try {
      return await this.userService.findUserById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updates: Partial<Pick<User, 'name' | 'email'>>
  ) {
    try {
      return await this.userService.updateUser(id, updates);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: false,
  })
  async deleteUser(@Param('id') id: string) {
    try {
      await this.userService.deleteUser(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
