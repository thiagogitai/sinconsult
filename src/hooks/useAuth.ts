import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null
  });

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const loadAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
          setAuth({
            user: JSON.parse(user),
            token,
            loading: false,
            error: null
          });
        } else {
          setAuth(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Erro ao carregar autenticação:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuth({ user: null, token: null, loading: false, error: null });
      }
    };

    loadAuth();
  }, []);

  // Função para verificar token com o backend
  const verifyToken = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.user;
      } else {
        throw new Error('Token inválido');
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      throw error;
    }
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    setAuth(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { user, token } = data.data;
        
        // Salvar no localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setAuth({
          user,
          token,
          loading: false,
          error: null
        });
        
        return { success: true };
      } else {
        const error = data.message || 'Erro ao fazer login';
        setAuth(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = 'Erro de conexão com o servidor';
      console.error('Erro ao fazer login:', error);
      setAuth(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Chamar API de logout
      if (auth.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          }
        }).catch(console.error); // Ignorar erros no logout
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setAuth({
        user: null,
        token: null,
        loading: false,
        error: null
      });
    }
  };

  // Verificar token atual
  const checkAuth = useCallback(async () => {
    if (!auth.token) return false;
    
    try {
      const user = await verifyToken(auth.token);
      setAuth(prev => ({ ...prev, user, error: null }));
      return true;
    } catch (error) {
      // Token inválido, fazer logout
      await logout();
      return false;
    }
  }, [auth.token, verifyToken]);

  // Atualizar usuário
  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setAuth(prev => ({ ...prev, user }));
  };

  return {
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: !!auth.user && !!auth.token,
    login,
    logout,
    checkAuth,
    updateUser
  };
};