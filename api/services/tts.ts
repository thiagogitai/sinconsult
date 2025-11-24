import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface TTSService {
  generateAudio(text: string, voice: string, options?: any): Promise<Buffer>;
  getVoices(): Promise<any[]>;
}

export class OpenAITTSService implements TTSService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Chave da API OpenAI não configurada');
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateAudio(text: string, voice: string = 'alloy', options: any = {}): Promise<Buffer> {
    try {
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        speed: options.speed || 1.0,
        response_format: 'mp3',
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('Erro ao gerar áudio com OpenAI:', error);
      throw new Error('Falha ao gerar áudio com OpenAI');
    }
  }

  async getVoices(): Promise<any[]> {
    return [
      { id: 'alloy', name: 'Alloy - Neutro', language: 'pt-BR' },
      { id: 'echo', name: 'Echo - Masculino', language: 'pt-BR' },
      { id: 'fable', name: 'Fable - Neutro', language: 'pt-BR' },
      { id: 'onyx', name: 'Onyx - Masculino', language: 'pt-BR' },
      { id: 'nova', name: 'Nova - Feminino', language: 'pt-BR' },
      { id: 'shimmer', name: 'Shimmer - Feminino', language: 'pt-BR' },
    ];
  }
}

export class ElevenLabsTTSService implements TTSService {
  private apiKey: string;
  private baseURL = 'https://api.elevenlabs.io/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Chave da API ElevenLabs não configurada. Configure ELEVENLABS_API_KEY no arquivo .env');
    }
  }

  // Voz padrão: Homem brasileiro 30-40 anos (Antoni - voz masculina profissional)
  async generateAudio(text: string, voice: string = 'ErXwobaYiN1PccRqvHdJ1B', options: any = {}): Promise<Buffer> {
    try {
      const response = await fetch(`${this.baseURL}/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarity_boost || 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API ElevenLabs: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer;
    } catch (error) {
      console.error('Erro ao gerar áudio com ElevenLabs:', error);
      throw new Error('Falha ao gerar áudio com ElevenLabs');
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/voices`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar voices da ElevenLabs: ${response.status}`);
      }

      const data = await response.json();
      
      // Filtrar e mapear vozes, priorizando português brasileiro
      const allVoices = data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        language: 'pt-BR',
        category: voice.category,
        description: voice.description || '',
        labels: voice.labels || {}
      }));

      // Vozes brasileiras recomendadas (masculinas e femininas)
      const brazilianVoices = [
        // Homem 30-40 anos (vozes masculinas profissionais)
        { id: 'ErXwobaYiN1PccRqvHdJ1B', name: 'Antoni - Homem 30-40 anos', gender: 'masculino', age: '30-40', language: 'pt-BR', description: 'Voz masculina profissional, ideal para comunicação corporativa' },
        { id: 'AZnzlk1XvdvUEFnJDT0kXYEX', name: 'Domi - Homem 30-40 anos', gender: 'masculino', age: '30-40', language: 'pt-BR', description: 'Voz masculina clara e confiável' },
        { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Adam - Homem 30-40 anos', gender: 'masculino', age: '30-40', language: 'pt-BR', description: 'Voz masculina natural e expressiva' },
        
        // Homem 50+ anos (vozes masculinas mais maduras)
        { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold - Homem 50+ anos', gender: 'masculino', age: '50+', language: 'pt-BR', description: 'Voz masculina madura e experiente' },
        { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh - Homem 50+ anos', gender: 'masculino', age: '50+', language: 'pt-BR', description: 'Voz masculina sênior e autoritativa' },
        
        // Mulher 30-40 anos (vozes femininas profissionais)
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Mulher 30-40 anos', gender: 'feminino', age: '30-40', language: 'pt-BR', description: 'Voz feminina profissional e elegante' },
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Mulher 30-40 anos', gender: 'feminino', age: '30-40', language: 'pt-BR', description: 'Voz feminina clara e amigável' },
        { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli - Mulher 30-40 anos', gender: 'feminino', age: '30-40', language: 'pt-BR', description: 'Voz feminina natural e calorosa' },
        
        // Mulher 40-50 anos (vozes femininas mais maduras)
        { id: 'flq6f7yk4E4fJM5XTYuZ', name: 'Grace - Mulher 40-50 anos', gender: 'feminino', age: '40-50', language: 'pt-BR', description: 'Voz feminina madura e confiável' },
        { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Gigi - Mulher 40-50 anos', gender: 'feminino', age: '40-50', language: 'pt-BR', description: 'Voz feminina experiente e profissional' }
      ];

      // Combinar vozes da API com vozes brasileiras recomendadas
      // Priorizar vozes brasileiras conhecidas
      const combinedVoices = [...brazilianVoices];
      
      // Adicionar outras vozes da API que não estão na lista
      allVoices.forEach((voice: any) => {
        if (!brazilianVoices.find(v => v.id === voice.id)) {
          combinedVoices.push(voice);
        }
      });

      return combinedVoices;
    } catch (error) {
      console.error('Erro ao buscar voices da ElevenLabs:', error);
      // Retornar voices padrão brasileiras em caso de erro
      return [
        { id: 'ErXwobaYiN1PccRqvHdJ1B', name: 'Antoni - Homem 30-40 anos', gender: 'masculino', age: '30-40', language: 'pt-BR', description: 'Voz masculina profissional' },
        { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold - Homem 50+ anos', gender: 'masculino', age: '50+', language: 'pt-BR', description: 'Voz masculina madura' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Mulher 30-40 anos', gender: 'feminino', age: '30-40', language: 'pt-BR', description: 'Voz feminina profissional' },
        { id: 'flq6f7yk4E4fJM5XTYuZ', name: 'Grace - Mulher 40-50 anos', gender: 'feminino', age: '40-50', language: 'pt-BR', description: 'Voz feminina madura' },
      ];
    }
  }
}

// Factory para criar o serviço apropriado
export class TTSServiceFactory {
  static createService(provider: string): TTSService {
    switch (provider) {
      case 'openai':
        return new OpenAITTSService();
      case 'elevenlabs':
        // ElevenLabs é o padrão recomendado
        return new ElevenLabsTTSService();
      default:
        throw new Error(`Provedor TTS não suportado: ${provider}`);
    }
  }
}

// Função utilitária para salvar arquivo de áudio
export function saveAudioFile(buffer: Buffer, filename: string): string {
  const audioDir = path.join(__dirname, '../../uploads/audio');
  
  // Criar diretório se não existir
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const filePath = path.join(audioDir, filename);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

// Função para gerar nome único de arquivo
export function generateAudioFilename(text: string, provider: string, voice: string): string {
  const timestamp = Date.now();
  const textHash = text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
  return `tts_${provider}_${voice}_${textHash}_${timestamp}.mp3`;
}