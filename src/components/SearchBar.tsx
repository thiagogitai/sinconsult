import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Buscar em contatos, campanhas, etc.
      // Por enquanto, redireciona para contatos com o termo de busca
      navigate(`/contacts?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  return (
    <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white/10 rounded-lg px-3 py-2">
      <Search className="h-4 w-4 text-white/60 mr-2" />
      <input
        type="text"
        placeholder="Buscar contatos, campanhas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="bg-transparent border-none outline-none text-sm text-white placeholder-white/60 w-32 focus:w-64 transition-all"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="ml-2 p-1 hover:bg-white/10 rounded"
        >
          <X className="h-3 w-3 text-white/60" />
        </button>
      )}
    </form>
  );
};

export default SearchBar;

