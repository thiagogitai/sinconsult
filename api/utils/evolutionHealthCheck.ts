import EvolutionAPI from '../services/evolution.js';
import { logger } from './logger.js';

// Criar instância
const evolutionAPI = new EvolutionAPI();

/**
 * Verifica se a Evolution API está acessível e configurada corretamente
 */
export async function checkEvolutionAPIHealth(): Promise<{
  isHealthy: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Verificar variáveis de ambiente
    const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiKey || apiKey === 'your-api-key') {
      return {
        isHealthy: false,
        message: 'Evolution API não configurada. Configure EVOLUTION_API_KEY no arquivo .env',
        details: {
          baseURL,
          apiKeyConfigured: false
        }
      };
    }

    // Tentar verificar conexão
    const isConnected = await evolutionAPI.checkConnection();

    if (!isConnected) {
      return {
        isHealthy: false,
        message: `Evolution API não está acessível em ${baseURL}. Verifique se o servidor está rodando.`,
        details: {
          baseURL,
          apiKeyConfigured: true,
          connectionFailed: true
        }
      };
    }

    return {
      isHealthy: true,
      message: 'Evolution API está configurada e acessível',
      details: {
        baseURL,
        apiKeyConfigured: true,
        connectionSuccessful: true
      }
    };

  } catch (error: any) {
    logger.error('Erro ao verificar saúde da Evolution API:', { error });
    return {
      isHealthy: false,
      message: `Erro ao verificar Evolution API: ${error.message}`,
      details: { error: error.message }
    };
  }
}

