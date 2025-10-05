/**
 * Exemplo 8: Logger com Decorator
 * Demonstra como usar o decorator @Log para logging automático
 */

import { createLogger, Log } from '../src/index';

// ============================================================================
// CONTROLLER COM DECORATOR
// ============================================================================

class UserController {
  private logger = createLogger({ service: 'UserController' });

  // Usar logger no decorator
  @Log({ logger: this.logger })
  async createUser(userData: { name: string; email: string }) {
    this.logger.info('Creating user via controller', { email: userData.email });

    // Simular validação
    if (!userData.email) {
      throw new Error('Email is required');
    }

    // Simular criação
    const user = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString(),
    };

    this.logger.info('User created via controller', { userId: user.id });
    return user;
  }

  // Usar logger manualmente (sem decorator)
  async getUser(id: string) {
    this.logger.info('Getting user', { userId: id });

    if (!id) {
      this.logger.warn('Invalid user ID provided');
      throw new Error('User ID is required');
    }

    // Simular busca
    const user = {
      id,
      name: 'João Silva',
      email: 'joao@example.com',
    };

    this.logger.info('User found', { userId: id });
    return user;
  }

  // Método com decorator e tratamento de erro
  @Log({ logger: this.logger })
  async updateUser(id: string, updateData: { name?: string; email?: string }) {
    this.logger.info('Updating user', { userId: id, fields: Object.keys(updateData) });

    if (!id) {
      throw new Error('User ID is required');
    }

    // Simular atualização
    const updatedUser = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    this.logger.info('User updated', { userId: id });
    return updatedUser;
  }

  // Método que pode falhar
  @Log({ logger: this.logger })
  async deleteUser(id: string) {
    this.logger.info('Deleting user', { userId: id });

    if (!id) {
      throw new Error('User ID is required');
    }

    // Simular verificação de dependências
    if (id === 'user-123') {
      throw new Error('Cannot delete user with active orders');
    }

    this.logger.info('User deleted', { userId: id });
    return { id, deletedAt: new Date().toISOString() };
  }
}

// ============================================================================
// SERVICE COM DECORATOR
// ============================================================================

class ProductService {
  private logger = createLogger({ service: 'ProductService' });

  @Log({ logger: this.logger })
  async createProduct(productData: { name: string; price: number; category: string }) {
    this.logger.info('Creating product', {
      name: productData.name,
      category: productData.category,
    });

    // Simular validação
    if (!productData.name || productData.price <= 0) {
      throw new Error('Invalid product data');
    }

    // Simular criação
    const product = {
      id: `prod-${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString(),
    };

    this.logger.info('Product created', { productId: product.id });
    return product;
  }

  @Log({ logger: this.logger })
  async getProductById(id: string) {
    this.logger.debug('Fetching product', { productId: id });

    if (!id) {
      throw new Error('Product ID is required');
    }

    // Simular busca
    const product = {
      id,
      name: 'Produto Exemplo',
      price: 99.99,
      category: 'Eletrônicos',
    };

    this.logger.info('Product found', { productId: id });
    return product;
  }

  @Log({ logger: this.logger })
  async updateProductPrice(id: string, newPrice: number) {
    this.logger.info('Updating product price', {
      productId: id,
      newPrice,
    });

    if (!id || newPrice <= 0) {
      throw new Error('Invalid parameters');
    }

    // Simular atualização
    this.logger.info('Product price updated', {
      productId: id,
      newPrice,
    });

    return { id, price: newPrice, updatedAt: new Date().toISOString() };
  }
}

// ============================================================================
// UTILITY CLASS COM DECORATOR
// ============================================================================

class ValidationService {
  private logger = createLogger({ service: 'ValidationService' });

  @Log({ logger: this.logger })
  validateEmail(email: string): boolean {
    this.logger.debug('Validating email', { email });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    this.logger.info('Email validation result', {
      email,
      isValid,
    });

    return isValid;
  }

  @Log({ logger: this.logger })
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    this.logger.debug('Validating password');

    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    const isValid = errors.length === 0;

    this.logger.info('Password validation result', {
      isValid,
      errorCount: errors.length,
    });

    return { isValid, errors };
  }
}

// ============================================================================
// EXEMPLO DE USO
// ============================================================================

async function demonstrateDecoratorUsage() {
  const userController = new UserController();
  const productService = new ProductService();
  const validationService = new ValidationService();

  try {
    console.log('=== Demonstração do Decorator @Log ===\n');

    // Testar controller
    console.log('1. Testando UserController:');
    const user = await userController.createUser({
      name: 'João Silva',
      email: 'joao@example.com',
    });
    console.log('Usuário criado:', user.id);

    // Testar service
    console.log('\n2. Testando ProductService:');
    const product = await productService.createProduct({
      name: 'Smartphone',
      price: 999.99,
      category: 'Eletrônicos',
    });
    console.log('Produto criado:', product.id);

    // Testar validação
    console.log('\n3. Testando ValidationService:');
    const emailValid = validationService.validateEmail('test@example.com');
    console.log('Email válido:', emailValid);

    const passwordValidation = validationService.validatePassword('MyPassword123');
    console.log('Senha válida:', passwordValidation.isValid);

    // Testar erro
    console.log('\n4. Testando tratamento de erro:');
    try {
      await userController.deleteUser('user-123'); // Vai falhar
    } catch (error) {
      console.log('Erro capturado:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n=== Demonstração concluída ===');
  } catch (error) {
    console.error('Erro na demonstração:', error);
  }
}

// Executar demonstração
demonstrateDecoratorUsage();

export { UserController, ProductService, ValidationService };
