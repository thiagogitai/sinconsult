import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Search,
  Globe,
  Zap,
  Target,
  Mail,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import SearchBar from './SearchBar';
import StatsSidebar from './StatsSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutWithImages: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Campanhas', href: '/campaigns', icon: MessageSquare },
    { name: 'Contatos', href: '/contacts', icon: Users },
    { name: 'Importar Excel', href: '/import', icon: Upload },
    { name: 'Agendamentos', href: '/schedules', icon: Clock },
    { name: 'TTS - Áudio', href: '/tts', icon: Volume2 },
    { name: 'WhatsApp', href: '/whatsapp', icon: Phone },
    { name: 'SMS', href: '/sms', icon: MessageCircle },
    { name: 'Email', href: '/email', icon: Mail },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image com overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent"></div>
      </div>

      {/* Header com Logo PNG */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo e Menu Mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-white hover:text-gray-200 hover:bg-white/10 transition-colors"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            {/* Logo PNG do Sim Consult */}
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Sim Consult" className="h-12 w-auto drop-shadow-lg" />
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
                      ? 'bg-white/20 text-white border-b-2 border-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
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
            <NotificationsDropdown />

            {/* Busca */}
            <SearchBar />

            {/* Menu do Usuário */}
            <div className="relative">
              <button
                onClick={() => {
                  setSidebarOpen(false)
                  setUserMenuOpen(!userMenuOpen)
                }}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">AD</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name || 'Administrador'}</p>
                  <p className="text-xs text-white/80">{user?.email || 'admin@simconsult.com'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/60" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 py-1 z-50">
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault()
                      setUserMenuOpen(false)
                      navigate('/settings')
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false)
                      await logout()
                      navigate('/login')
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
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
      <div className="relative z-10 pt-20 lg:pt-16">
        <div className="flex">
          {/* Sidebar com Background Image */}
          <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-black/40 backdrop-blur-lg border-r border-white/10 transform transition-transform duration-300 ease-in-out pt-20 lg:pt-16 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
            <div className="flex flex-col h-full">
              {/* Menu de Navegação */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-white/60 uppercase tracking-wider">Menu Principal</h3>
                  <div className="mt-3 space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isActive(item.href)
                              ? 'bg-white/20 text-white border-r-2 border-green-400'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
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
                <StatsSidebar />
              </nav>

              {/* Status do Sistema */}
              <div className="border-t border-white/20 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/70">Sistema Online</span>
                </div>
                <div className="text-xs text-white/50">
                  Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 lg:ml-0">
            <main className="p-4 sm:p-6">
              {/* Breadcrumb */}
              <div className="mb-6">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <Link to="/" className="text-white/60 hover:text-white">
                        <Globe className="h-4 w-4" />
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <span className="text-white/40 mx-2">/</span>
                        <span className="text-white font-medium">
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

export default LayoutWithImages;