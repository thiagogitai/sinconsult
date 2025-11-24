import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, Settings, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { contactsAPI } from '../services/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportResult {
  processed: number;
  errors: number;
  errorLog: string[];
  total: number;
}

const Import: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    // Validar extensão
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Formato de arquivo inválido. Use apenas .xlsx ou .xls');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Fazer upload do arquivo
      const response = await contactsAPI.importExcel(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setImportResult(response.data);
      
      if (response.data.processed > 0) {
        toast.success(`Importação concluída! ${response.data.processed} contatos importados com sucesso.`);
      }
      
      if (response.data.errors > 0) {
        toast.warning(`${response.data.errors} erros encontrados durante a importação.`);
      }

    } catch (error: any) {
      console.error('Erro ao importar Excel:', error);
      toast.error(error.response?.data?.message || 'Erro ao importar arquivo');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isUploading
  });

  const downloadTemplate = () => {
    const templateData = [
      { Nome: 'João Silva', Telefone: '+55 11 98765-4321', Email: 'joao.silva@email.com', Tags: 'cliente,vip' },
      { Nome: 'Maria Santos', Telefone: '+55 11 99876-5432', Email: 'maria.santos@email.com', Tags: 'prospect' },
      { Nome: 'Pedro Oliveira', Telefone: '+55 21 91234-5678', Email: 'pedro.oliveira@email.com', Tags: 'cliente' }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatos');
    
    XLSX.writeFile(workbook, 'modelo_importacao_contatos.xlsx');
    toast.success('Modelo de planilha baixado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Importar Contatos</h1>
            <p className="text-gray-600 mt-1">Importe contatos de planilhas Excel com facilidade</p>
          </div>
          {importResult && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {importResult.processed} importados
              </div>
              {importResult.errors > 0 && (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  {importResult.errors} erros
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
              {isUploading ? (
                <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-green-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isUploading ? 'Importando contatos...' : 'Importar Planilha Excel'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isUploading 
                ? 'Processando seu arquivo, por favor aguarde...' 
                : 'Arraste e solte seu arquivo Excel aqui ou clique para selecionar'
              }
            </p>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors ${
                isDragActive 
                  ? 'border-green-500 bg-green-50' 
                  : isUploading 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              } ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{uploadProgress}% processado</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center space-y-4">
                    <FileText className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {isDragActive ? 'Solte o arquivo aqui' : 'Clique para selecionar'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ou arraste e solte o arquivo Excel
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Formatos aceitos: .xlsx, .xls (máximo 5MB)
                  </p>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Instruções de Importação:</h3>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• A planilha deve conter as colunas: <strong>Nome</strong>, <strong>Telefone</strong>, <strong>Email</strong> (opcional), <strong>Tags</strong> (opcional)</li>
                    <li>• O telefone deve estar no formato internacional: +55 11 98765-4321</li>
                    <li>• Use tags separadas por vírgula para segmentação (ex: cliente,vip,prospect)</li>
                    <li>• Máximo de 1000 contatos por importação</li>
                    <li>• Contatos duplicados serão automaticamente ignorados</li>
                    <li>• Use a primeira linha para os cabeçalhos das colunas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Log */}
            {importResult?.errorLog && importResult.errorLog.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mt-4">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900 mb-2">Erros encontrados:</h3>
                    <div className="text-sm text-red-800 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errorLog.map((error, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Template */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modelo de Planilha</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="font-medium text-gray-700">Nome</div>
            <div className="font-medium text-gray-700">Telefone</div>
            <div className="font-medium text-gray-700">Email</div>
            <div className="font-medium text-gray-700">Tags</div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
            <div>João Silva</div>
            <div>+55 11 98765-4321</div>
            <div>joao.silva@email.com</div>
            <div>cliente,vip</div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mt-1">
            <div>Maria Santos</div>
            <div>+55 11 99876-5432</div>
            <div>maria.santos@email.com</div>
            <div>prospect</div>
          </div>
        </div>
        
        <button 
          onClick={downloadTemplate}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar Modelo
        </button>
      </div>
    </div>
  );
};

export default Import;