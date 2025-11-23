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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateAudio(text: string, voice: string = '21m00Tcm4TlvDq8ikWAM', options: any = {}): Promise<Buffer> {
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
      return data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        language: 'pt-BR',
        category: voice.category,
      }));
    } catch (error) {
      console.error('Erro ao buscar voices da ElevenLabs:', error);
      // Retornar voices padrão em caso de erro
      return [
        { id: '21m00Tcm4Tcm4TlvDq8ikWAM', name: 'Rachel - Feminino', language: 'pt-BR' },
        { id: 'AZnzlk1XvdvUEFnJDT0kXYEX', name: 'Domi - Masculino', language: 'pt-BR' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Feminino', language: 'pt-BR' },
        { id: 'ErXwobaYiN1PccRqvHdJ1B', name: 'Antoni - Masculino', language: 'pt-BR' },
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
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          throw new Error('Chave da API ElevenLabs não configurada');
        }
        return new ElevenLabsTTSService(apiKey);
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