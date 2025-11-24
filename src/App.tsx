import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LayoutWithImages from "@/components/LayoutWithImages";
import DashboardPremium from "@/pages/DashboardPremium";
import Campaigns from "@/pages/Campaigns";
import Contacts from "@/pages/Contacts";
import Import from "@/pages/Import";
import Schedules from "@/pages/Schedules";
import TTS from "@/pages/TTS";
import WhatsAppInstances from "@/pages/WhatsAppInstances";
import Settings from "@/pages/Settings";
import SMS from "@/pages/SMS";
import Email from "@/pages/Email";
import Login from "@/pages/Login";
import ToastContainer from "@/components/ToastContainer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

function App() {
  const { toasts, dismiss } = useToast();
  const { isAuthenticated, loading, checkAuth } = useAuth();

  // Verificar autenticação ao carregar
  useEffect(() => {
    if (!loading) {
      checkAuth();
    }
  }, [loading, checkAuth]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route path="/*" element={
          isAuthenticated ? (
            <LayoutWithImages>
              <Routes>
                <Route path="/" element={<DashboardPremium />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/import" element={<Import />} />
                <Route path="/schedules" element={<Schedules />} />
                <Route path="/tts" element={<TTS />} />
                <Route path="/whatsapp" element={<WhatsAppInstances />} />
                <Route path="/sms" element={<SMS />} />
                <Route path="/email" element={<Email />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <ToastContainer toasts={toasts} onDismiss={dismiss} />
            </LayoutWithImages>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
