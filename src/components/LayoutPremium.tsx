import React, { useState } from 'react';
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
  Globe,
  Zap,
  Target,
  CheckCircle,
  Activity
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutPremium: React.FC<LayoutProps> = ({ children }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Premium - Estilo Sim Consult */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-green-500 shadow-2xl fixed top-0 left-0 right-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e Menu Mobile */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              {/* Logo Sim Consult Premium */}
              <div className="flex items-center space-x-4">
                <img src="/logo-sim-consult-premium.svg" alt="Sim Consult" className="h-14 w-auto drop-shadow-lg" />
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-black text-white tracking-wide">SIM CONSULT</h1>
                  <p className="text-green-100 text-xs font-semibold tracking-wider">WHATSAPP BUSINESS CRM</p>
                </div>
              </div>
            </div>

            {/* Área Central - Status do Sistema */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Sistema Online</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                <Target className="h-4 w-4 text-green-200" />
                <span className="text-sm font-medium text-white">100% Otimizado</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-green-200" />
                <span className="text-sm font-medium text-white">Performance Máxima</span>
              </div>
            </div>

            {/* Área do Usuário */}
            <div className="flex items-center space-x-4">
              {/* Notificações */}
              <button className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
              </button>

              {/* Busca */}
              <div className="hidden md:flex items-center bg-white/10 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-green-200 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent border-none outline-none text-sm text-white placeholder-green-200 w-32 focus:w-48 transition-all font-medium"
                />
              </div>

              {/* Menu do Usuário */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">AD</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-white">Administrador</p>
                    <p className="text-xs text-green-100">admin@simconsult.com</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-green-200" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-green-600" />
                      Configurações
                    </Link>
                    <button className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors font-medium">
                      <LogOut className="h-4 w-4 mr-3 text-red-500" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="pt-20">
        <div className="flex">
          {/* Sidebar Premium */}
          <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out pt-20 lg:pt-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
            <div className="flex flex-col h-full">
              {/* Menu de Navegação */}
              <nav className="flex-1 px-6 py-8">
                <div className="mb-8">
                  <h3 className="px-3 text-xs font-black text-gray-400 uppercase tracking-widest">MENU PRINCIPAL</h3>
                  <div className="mt-4 space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                              : 'text-gray-600 hover:text-green-700 hover:bg-green-50 hover:scale-105'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="mr-4 h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Seção de Estatísticas Rápidas */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="px-3 text-xs font-black text-gray-400 uppercase tracking-widest">RESUMO</h3>
                  <div className="mt-4 space-y-3">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">Contatos</span>
                        <span className="text-lg font-black text-gray-700">1,247</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-800">Campanhas</span>
                        <span className="text-lg font-black text-green-600">23</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-800">Taxa Entrega</span>
                        <span className="text-lg font-black text-emerald-600">94%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Status do Sistema */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-gray-700">Sistema Online</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Atualizado: {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 lg:ml-0">
            <main className="p-8">
              {/* Breadcrumb Premium */}
              <div className="mb-8">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <Link to="/" className="text-green-600 hover:text-green-700 transition-colors">
                        <Globe className="h-4 w-4" />
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <span className="text-gray-400 mx-2">/</span>
                        <span className="text-gray-700 font-bold">
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
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default LayoutPremium;