import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Globe, Zap, Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast({ title: 'Sucesso', description: 'Login realizado com sucesso!' });
        navigate('/');
      } else {
        toast({ title: 'Erro', description: result.error || 'Erro ao fazer login', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({ title: 'Erro', description: 'Erro de conexão com o servidor', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
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
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Lado esquerdo - Informações */}
        <div className="hidden lg:flex lg:w-1/2 bg-white/10 backdrop-blur-sm p-12 flex-col justify-between border-r border-white/20">
          <div>
            <img src="/logo.png" alt="Logo" className="h-20 w-auto mb-8 drop-shadow-lg" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Bem-vindo ao <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">CRM System</span>
            </h1>
            <p className="text-green-100 text-lg mb-8 leading-relaxed">
              Sistema profissional de gestão de comunicação via WhatsApp. 
              Alcance seus clientes com eficiência e inteligência.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Performance Ultra Rápida</h3>
                <p className="text-green-100 text-sm">Processamento otimizado em tempo real</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Segurança Enterprise</h3>
                <p className="text-green-100 text-sm">Criptografia e proteção avançada</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Multi-usuário Ilimitado</h3>
                <p className="text-green-100 text-sm">Suporte para equipes de todos os tamanhos</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-green-200 text-sm">
              © 2025 @ Todos os direitos reservados.
            </p>
          </div>
        </div>

        {/* Lado direito - Login */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center bg-white/5 backdrop-blur-sm">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Acesse sua conta</h2>
              <p className="text-green-100">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-green-100 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-green-300" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-green-100 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-green-300" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-300 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-green-100">
                    Lembrar-me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-green-300 hover:text-white transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-green-100">
                Não tem uma conta?{' '}
                <a href="#" className="font-medium text-green-300 hover:text-white transition-colors">
                  Solicite acesso
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;