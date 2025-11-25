const XLSX = require("xlsx");
const data = [
  { Nome: 'Joao123', Telefone: '(11) 99999-9999', Email: 'joao@example.com' },
  { Nome: 'Maria#@$%', Telefone: '21 9999-9999', Email: 'maria@example.com' },
  { name: 'Carlos4567', 'Telefone com DDD': '11-98765-4321', email: 'carlos@example.com' },
  { contact_name: 'Ana789', whatsapp: '+55 (31) 98888-7777', mail: 'ana@example.com' }
];
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Contatos');
XLSX.writeFile(wb, 'import_malformed.xlsx');
