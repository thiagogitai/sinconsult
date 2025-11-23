import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  Phone, 
  Upload,
  Clock,
  Volume2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  Globe
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Campanhas', href: '/campaigns', icon: MessageSquare },
    { name: 'Contatos', href: '/contacts', icon: Users },
    { name: 'Importar Excel', href: '/import', icon: Upload },
    { name: 'Agendamentos', href: '/schedules', icon: Clock },
    { name: 'TTS - Áudio', href: '/tts', icon: Volume2 },
    { name: 'WhatsApp', href: '/whatsapp', icon: Phone },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal - Estilo Sim Consult */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo e Menu Mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            {/* Logo Sim Consult Style */}
            <div className="flex items-center space-x-3">
              <img src="/logo-sim-consult.svg" alt="Sim Consult" className="h-12 w-auto drop-shadow-lg" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent">Sim Consult</h1>
                <p className="text-xs text-gray-500 font-medium">WhatsApp Business CRM</p>
              </div>
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-gray-50 text-gray-700 border-b-2 border-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Área do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>

            {/* Busca */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500 w-32 focus:w-48 transition-all"
              />
            </div>

            {/* Menu do Usuário */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">AD</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">Administrador</p>
                  <p className="text-xs text-gray-500">admin@simconsult.com</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="pt-20 lg:pt-16">
        <div className="flex">
          {/* Sidebar - Estilo Profissional */}
          <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out pt-20 lg:pt-16 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
            <div className="flex flex-col h-full">
              {/* Menu de Navegação */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu Principal</h3>
                  <div className="mt-3 space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isActive(item.href)
                              ? 'bg-gray-50 text-gray-700 border-r-2 border-gray-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Seção de Estatísticas Rápidas */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estatísticas</h3>
                  <div className="mt-3 space-y-2">
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Contatos</span>
                        <span className="text-sm font-semibold text-gray-700">1,247</span>
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Campanhas</span>
                        <span className="text-sm font-semibold text-green-600">23</span>
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Taxa Entrega</span>
                        <span className="text-sm font-semibold text-emerald-600">94%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Status do Sistema */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Sistema Online</span>
                </div>
                <div className="text-xs text-gray-500">
                  Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 lg:ml-0">
            <main className="p-6">
              {/* Breadcrumb */}
              <div className="mb-6">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <Link to="/" className="text-gray-500 hover:text-gray-700">
                        <Globe className="h-4 w-4" />
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <span className="text-gray-400 mx-2">/</span>
                        <span className="text-gray-700 font-medium">
                          {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                        </span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>

              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;