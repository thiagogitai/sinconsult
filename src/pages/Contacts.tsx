import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  Tag,
  MoreVertical,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Contacts: React.FC = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para visualizar contatos',
          variant: 'destructive'
        });
        setContacts([]);
        setLoading(false);
        return;
      }
      
      // Buscar contatos da API
      const response = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        // A API retorna array diretamente, não dentro de data.data
        const contactsList = Array.isArray(data) ? data : (data.data || []);
        // Converter tags de string para array se necessário
        const normalizedContacts = contactsList.map((contact: any) => {
          const isActiveNum = contact.is_active;
          const isBlockedNum = contact.is_blocked;
          const isActive = isActiveNum === 1 || isActiveNum === '1' || isActiveNum === true || isActiveNum === null || isActiveNum === undefined;
          const isBlocked = isBlockedNum === 1 || isBlockedNum === '1' || isBlockedNum === true;
          return {
            ...contact,
            tags: contact.tags 
              ? (Array.isArray(contact.tags) 
                  ? contact.tags 
                  : (contact.tags.split ? contact.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []))
              : [],
            status: !isBlocked && isActive ? 'active' : 'cancelled'
          };
        });
        setContacts(normalizedContacts);
      } else {
        console.error('Erro ao carregar contatos:', data.message);
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao carregar contatos',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar contatos', variant: 'destructive' });
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para criar contatos',
          variant: 'destructive'
        });
        return;
      }

      const contactData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contactData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Contato criado com sucesso!'
        });
        setShowModal(false);
        setFormData({ name: '', phone: '', email: '', tags: '' });
        fetchContacts();
      } else {
        const errorMessage = data.error || data.message || 'Erro ao criar contato';
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: 'Erro',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      });
    }
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      tags: contact.tags ? contact.tags.join(', ') : ''
    });
    setShowModal(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para atualizar contatos',
          variant: 'destructive'
        });
        return;
      }

      const contactData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contactData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Contato atualizado com sucesso!'
        });
        setShowModal(false);
        setEditingContact(null);
        setFormData({ name: '', phone: '', email: '', tags: '' });
        fetchContacts();
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao atualizar contato',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: 'Erro',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para excluir contatos',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Contato excluído com sucesso!'
        });
        fetchContacts();
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao excluir contato',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast({
        title: 'Erro',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      });
    }
  };

  const handleExportExcel = () => {
    const csvContent = [
      ['Nome', 'Telefone', 'Email', 'Tags', 'Status'],
      ...contacts.map(contact => [
        contact.name,
        contact.phone,
        contact.email || '',
        contact.tags ? contact.tags.join(', ') : '',
        contact.status === 'active' ? 'Ativo' : 'Cancelado'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contatos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando contatos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Estilo Clean Importar Excel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Gestão de Contatos</h1>
                <p className="text-gray-600 text-base sm:text-xl font-light mt-1">Base de dados inteligente</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <Phone className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Comunicação Direta</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <Tag className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Segmentação Inteligente</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleExportExcel}
              className="bg-gray-700 text-white hover:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-semibold shadow-lg text-sm sm:text-base"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Exportar</span>
            </button>
            <button
              onClick={() => {
                setEditingContact(null);
                setFormData({ name: '', phone: '', email: '', tags: '' });
                setShowModal(true);
              }}
              className="bg-green-600 text-white hover:bg-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-semibold shadow-lg text-sm sm:text-base"
            >
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Total de Contatos</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              <p className="text-xs text-gray-500">Na base de dados</p>
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Contatos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.filter(c => c.status === 'active').length}</p>
              <p className="text-xs text-gray-500">Prontos para receber</p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Com Email</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.filter(c => c.email).length}</p>
              <p className="text-xs text-gray-500">Com email cadastrado</p>
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Com Tags</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.filter(c => {
                const tags = Array.isArray(c.tags) ? c.tags : (c.tags ? c.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []);
                return tags.length > 0;
              }).length}</p>
              <p className="text-xs text-gray-500">Segmentados</p>
            </div>
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
              <Tag className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 font-semibold transition-colors">
            <Filter className="h-4 w-4" />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Contatos ({filteredContacts.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie sua base de contatos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{contact.name}</div>
                        <div className="text-xs text-gray-500">
                          {contact.created_at ? new Date(contact.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center font-medium">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {contact.phone}
                    </div>
                    {contact.email && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags && contact.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      contact.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {contact.status === 'active' ? 'Ativo' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Editar Contato"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                        title="Excluir Contato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingContact ? 'Editar Contato' : 'Adicionar Contato'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="Nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="+55 11 98765-4321"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="cliente, vip, prospect"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingContact ? handleUpdateContact : handleCreateContact}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors shadow-lg"
              >
                {editingContact ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;