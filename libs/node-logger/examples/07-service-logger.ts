/**
 * Exemplo 7: Logger em Services
 * Demonstra como usar logger em services e classes de negócio
 */

import { createLogger } from '../src/index';

// ============================================================================
// USER SERVICE COM LOGGING
// ============================================================================

class UserService {
  private logger = createLogger({
    service: 'UserService',
    level: 'info',
  });

  async createUser(userData: { name: string; email: string; password: string }) {
    this.logger.info('Creating user', { email: userData.email });

    try {
      // Simular validação
      this.logger.debug('Validating user data');

      if (!userData.email || !userData.password) {
        this.logger.warn('Invalid user data provided', {
          hasEmail: !!userData.email,
          hasPassword: !!userData.password,
        });
        throw new Error('Email and password are required');
      }

      // Simular criação de usuário
      this.logger.debug('Saving user to database');
      const user = {
        id: `user-${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString(),
      };

      this.logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to create user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: userData.email,
      });
      throw error;
    }
  }

  async getUserById(id: string) {
    this.logger.debug('Fetching user', { userId: id });

    try {
      // Simular busca de usuário
      this.logger.debug('Querying database for user');

      if (!id) {
        this.logger.warn('Invalid user ID provided');
        throw new Error('User ID is required');
      }

      // Simular usuário encontrado
      const user = {
        id,
        name: 'João Silva',
        email: 'joao@example.com',
        createdAt: '2024-01-01T00:00:00Z',
      };

      this.logger.info('User found', { userId: id });
      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<{ name: string; email: string }>) {
    this.logger.info('Updating user', { userId: id, fields: Object.keys(updateData) });

    try {
      this.logger.debug('Validating update data');

      // Simular atualização
      this.logger.debug('Updating user in database');

      this.logger.info('User updated successfully', { userId: id });
      return { id, ...updateData, updatedAt: new Date().toISOString() };
    } catch (error) {
      this.logger.error('Failed to update user', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async deleteUser(id: string) {
    this.logger.info('Deleting user', { userId: id });

    try {
      this.logger.debug('Checking user dependencies');
      this.logger.debug('Removing user from database');

      this.logger.info('User deleted successfully', { userId: id });
      return { id, deletedAt: new Date().toISOString() };
    } catch (error) {
      this.logger.error('Failed to delete user', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// ============================================================================
// EMAIL SERVICE COM LOGGING
// ============================================================================

class EmailService {
  private logger = createLogger({
    service: 'EmailService',
    level: 'info',
  });

  async sendWelcomeEmail(userEmail: string, userName: string) {
    this.logger.info('Sending welcome email', { userEmail, userName });

    try {
      this.logger.debug('Preparing email template');
      this.logger.debug('Connecting to email service');

      // Simular envio de email
      await new Promise((resolve) => setTimeout(resolve, 100));

      this.logger.info('Welcome email sent successfully', { userEmail });
      return { success: true, messageId: `msg-${Date.now()}` };
    } catch (error) {
      this.logger.error('Failed to send welcome email', {
        userEmail,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async sendPasswordResetEmail(userEmail: string) {
    this.logger.info('Sending password reset email', { userEmail });

    try {
      this.logger.debug('Generating reset token');
      const resetToken = `reset-${Date.now()}`;

      this.logger.debug('Sending email with reset link');

      // Simular envio de email
      await new Promise((resolve) => setTimeout(resolve, 150));

      this.logger.info('Password reset email sent', {
        userEmail,
        tokenLength: resetToken.length,
      });

      return { success: true, token: resetToken };
    } catch (error) {
      this.logger.error('Failed to send password reset email', {
        userEmail,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// ============================================================================
// DATABASE SERVICE COM LOGGING
// ============================================================================

class DatabaseService {
  private logger = createLogger({
    service: 'DatabaseService',
    level: 'debug',
  });

  async connect() {
    this.logger.info('Connecting to database');

    try {
      this.logger.debug('Loading database configuration');
      this.logger.debug('Establishing connection pool');

      // Simular conexão
      await new Promise((resolve) => setTimeout(resolve, 200));

      this.logger.info('Database connected successfully', {
        host: 'localhost',
        port: 5432,
        database: 'myapp',
      });

      return { connected: true };
    } catch (error) {
      this.logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async query(sql: string, params: any[] = []) {
    this.logger.debug('Executing database query', {
      sql: sql.substring(0, 100) + '...',
      paramCount: params.length,
    });

    try {
      // Simular query
      await new Promise((resolve) => setTimeout(resolve, 50));

      this.logger.debug('Query executed successfully', {
        rowCount: 1,
        duration: '50ms',
      });

      return [{ id: 1, name: 'Test' }];
    } catch (error) {
      this.logger.error('Database query failed', {
        sql: sql.substring(0, 100) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// ============================================================================
// EXEMPLO DE USO DOS SERVICES
// ============================================================================

async function demonstrateServices() {
  const userService = new UserService();
  const emailService = new EmailService();
  const dbService = new DatabaseService();

  try {
    // Conectar ao banco
    await dbService.connect();

    // Criar usuário
    const user = await userService.createUser({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
    });

    // Enviar email de boas-vindas
    await emailService.sendWelcomeEmail(user.email, user.name);

    // Buscar usuário
    const foundUser = await userService.getUserById(user.id);

    // Atualizar usuário
    await userService.updateUser(user.id, { name: 'João Santos' });

    console.log('Demonstração dos services concluída com sucesso!');
  } catch (error) {
    console.error('Erro na demonstração:', error);
  }
}

// Executar demonstração
demonstrateServices();

export { UserService, EmailService, DatabaseService };
