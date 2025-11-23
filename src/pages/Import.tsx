import React from 'react';
import { Upload, FileText, Download, Settings, AlertCircle } from 'lucide-react';

const Import: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Importar Contatos</h1>
            <p className="text-gray-600 mt-1">Importe contatos de planilhas Excel</p>
          </div>
        </div>
      </div>

      {/* Import Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Importar Planilha Excel</h2>
            <p className="text-gray-600 mb-6">
              Arraste e solte seu arquivo Excel aqui ou clique para selecionar
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2" />
                Escolher Arquivo
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Formatos aceitos: .xlsx, .xls (máximo 5MB)
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Instruções de Importação:</h3>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• A planilha deve conter as colunas: <strong>Nome</strong>, <strong>Telefone</strong>, <strong>Email</strong> (opcional)</li>
                    <li>• O telefone deve estar no formato internacional: +55 11 98765-4321</li>
                    <li>• Máximo de 1000 contatos por importação</li>
                    <li>• Contatos duplicados serão automaticamente ignorados</li>
                    <li>• Use a primeira linha para os cabeçalhos das colunas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Template */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modelo de Planilha</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-gray-700">Nome</div>
            <div className="font-medium text-gray-700">Telefone</div>
            <div className="font-medium text-gray-700">Email</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mt-2">
            <div>João Silva</div>
            <div>+55 11 98765-4321</div>
            <div>joao.silva@email.com</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mt-1">
            <div>Maria Santos</div>
            <div>+55 11 99876-5432</div>
            <div>maria.santos@email.com</div>
          </div>
        </div>
        
        <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <Download className="h-4 w-4 mr-2" />
          Baixar Modelo
        </button>
      </div>
    </div>
  );
};

export default Import;