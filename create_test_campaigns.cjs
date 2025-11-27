const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuração
const API_URL = 'http://localhost:3006/api';
const CREDENTIALS = { email: 'admin@crm.com', password: 'admin123' };

// Arquivos Dummy (Conteúdo simples, o servidor deve aceitar se não validar magic numbers rigorosamente)
// Se falhar, precisaremos de arquivos reais.
const FILES = {
    audio: 'test_audio.mp3',
    image: 'test_image.jpg',
    video: 'test_video.mp4'
};

// Criar arquivos dummy
function createDummyFiles() {
    if (!fs.existsSync(FILES.audio)) fs.writeFileSync(FILES.audio, 'fake audio content');
    if (!fs.existsSync(FILES.image)) fs.writeFileSync(FILES.image, 'fake image content');
    if (!fs.existsSync(FILES.video)) fs.writeFileSync(FILES.video, 'fake video content');
    console.log('✅ Arquivos de teste criados.');
}

async function createCampaigns() {
    try {
        createDummyFiles();

        // 1. Login
        console.log('🔑 Realizando login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, CREDENTIALS);
        const token = loginRes.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        console.log('✅ Login realizado.');

        // Função auxiliar para upload
        async function uploadMedia(filePath, type) {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            form.append('type', type); // image, video, audio

            const res = await axios.post(`${API_URL}/upload/media`, form, {
                headers: {
                    ...headers,
                    ...form.getHeaders()
                }
            });
            return res.data.url;
        }

        // Função auxiliar para criar campanha
        async function createCampaign(name, message, type, mediaUrl, segment) {
            // Agendar para 1 minuto no futuro
            const scheduledAt = new Date(Date.now() + 60000).toISOString().slice(0, 19).replace('T', ' ');

            const payload = {
                name: name,
                message: message,
                media_type: type, // image, video, audio_upload
                media_url: mediaUrl,
                scheduled_at: scheduledAt,
                target_segment: segment
            };

            const res = await axios.post(`${API_URL}/campaigns`, payload, { headers });
            console.log(`✅ Campanha "${name}" criada! ID: ${res.data.id}`);
        }

        // 2. Campanha de Áudio (Upload)
        console.log('\n🎵 Criando Campanha de Áudio...');
        try {
            const audioUrl = await uploadMedia(FILES.audio, 'audio');
            await createCampaign(
                'Campanha Áudio Teste',
                'Olá! Esta é uma mensagem de áudio de teste.',
                'audio_upload', // Importante: usar o novo tipo que criamos
                audioUrl,
                'teste' // Segmento do contato 2
            );
        } catch (e) {
            console.error('Erro ao criar campanha de áudio (provavelmente validação de arquivo):', e.message);
        }

        // 3. Campanha de Imagem
        console.log('\n🖼️ Criando Campanha de Imagem...');
        try {
            const imageUrl = await uploadMedia(FILES.image, 'image');
            await createCampaign(
                'Campanha Imagem Teste',
                'Veja esta imagem incrível!',
                'image',
                imageUrl,
                'teste 1' // Segmento do contato 1
            );
        } catch (e) {
            console.error('Erro ao criar campanha de imagem:', e.message);
        }

        // 4. Campanha de Vídeo
        console.log('\n🎥 Criando Campanha de Vídeo...');
        try {
            const videoUrl = await uploadMedia(FILES.video, 'video');
            await createCampaign(
                'Campanha Vídeo Teste',
                'Confira este vídeo demonstrativo.',
                'video',
                videoUrl,
                '' // Sem segmento (envia para todos)
            );
        } catch (e) {
            console.error('Erro ao criar campanha de vídeo:', e.message);
        }

        console.log('\n✨ Processo finalizado!');

    } catch (error) {
        console.error('❌ Erro fatal:', error.response?.data || error.message);
    }
}

createCampaigns();
