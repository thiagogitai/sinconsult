import React, { useState, useEffect } from 'react';

const StatsSidebar: React.FC = () => {
  const [stats, setStats] = useState({
    contacts: 0,
    campaigns: 0,
    deliveryRate: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      // Buscar estatísticas do dashboard
      const response = await fetch(`${apiBase}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          contacts: data.total_contacts || 0,
          campaigns: 0, // Será buscado separadamente se necessário
          deliveryRate: data.delivery_rate || 0
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  return (
    <div className="border-t border-white/20 pt-4">
      <h3 className="px-3 text-xs font-semibold text-white/60 uppercase tracking-wider">Estatísticas</h3>
      <div className="mt-3 space-y-2">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Contatos</span>
            <span className="text-sm font-semibold text-green-400">{stats.contacts.toLocaleString()}</span>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Taxa Entrega</span>
            <span className="text-sm font-semibold text-emerald-400">{stats.deliveryRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSidebar;

