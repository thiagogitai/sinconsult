import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Store simples em memória (em produção, usar Redis)
const store: RateLimitStore = {};

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Limpar a cada minuto

/**
 * Rate limiter simples
 * @param maxRequests - Número máximo de requisições
 * @param windowMs - Janela de tempo em milissegundos
 */
export const rateLimiter = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Obter identificador do cliente
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `${identifier}:${req.path}`;
    const now = Date.now();

    // Verificar se existe entrada
    if (!store[key] || store[key].resetTime < now) {
      // Criar nova entrada
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    // Incrementar contador
    store[key].count++;

    // Verificar limite
    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
      return;
    }

    // Adicionar headers de rate limit
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    next();
  };
};

/**
 * Rate limiter mais restritivo para rotas de autenticação
 */
export const authRateLimiter = rateLimiter(5, 900000); // 5 tentativas a cada 15 minutos

/**
 * Rate limiter padrão para rotas gerais
 */
export const defaultRateLimiter = rateLimiter(100, 60000); // 100 requisições por minuto

