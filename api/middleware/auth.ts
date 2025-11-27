import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
      };
    }
  }
}

// Validar JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-2025-simconsult-secure-token-change-in-production';
if (!JWT_SECRET || JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  console.warn('⚠️  JWT_SECRET não configurado ou está usando valor padrão!');
  console.warn('⚠️  Configure a variável de ambiente JWT_SECRET para maior segurança.');
}

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona informações do usuário ao request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Rotas públicas que não precisam de autenticação
    const publicRoutes = ['/api/auth/login', '/api/auth/register'];
    if (publicRoutes.includes(req.path)) {
      return next();
    }

    // Obter token do header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
      return;
    }

    // Obter segredo dinamicamente (para garantir que pegue o valor atualizado pelo server.ts)
    const currentSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-2025-simconsult-secure-token-change-in-production';

    // Verificar token
    if (!currentSecret) {
      res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor'
      });
      return;
    }

    const decoded = jwt.verify(token, currentSecret) as {
      userId: number;
      email: string;
      role: string;
    };

    // Adicionar informações do usuário ao request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
      return;
    }

    console.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar autenticação'
    });
  }
};

/**
 * Middleware para verificar se o usuário é admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autenticação necessária'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
    });
    return;
  }

  next();
};

