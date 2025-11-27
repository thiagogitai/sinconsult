import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                    <Settings className="h-8 w-8 text-green-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
                        <p className="text-gray-600">Configure seu sistema CRM WhatsApp</p>
                    </div>
                </div>
            </div>

            {/* Content Test */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Teste de Renderização</h2>
                <p className="text-gray-700">
                    Se você está vendo esta mensagem, a página está renderizando corretamente.
                </p>
                <p className="text-gray-600 mt-2">
                    O problema anterior pode ter sido com o hook useToast ou algum erro de JavaScript.
                </p>
            </div>
        </div>
    );
};

export default SettingsPage;
