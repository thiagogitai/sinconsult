const XLSX = require("xlsx");
const rows = [
  { "Nome": "Joao123", "Telefone com DDD": "(11) 99999-9999", "Email": "joao@example.com" },
  { "Cliente": "Maria#@$%", "WhatsApp": "21 9999-9999", "mail": "maria@example.com" },
  { "Contato": "Carlos4567", "DDD+Telefone": "11-98765-4321", "email": "carlos@example.com" },
  { "Nome Completo": "Ana789", "whatsapp": "+55 (31) 98888-7777", "E-mail": "ana@example.com" },
  { "name": "Pedro", "Numero": "(62) 91234-5678" },
  { "nome": "Luiza", "Telefone": "(65) 98117-3624" },
  { "contact_name": "Paulo", "Celular": "(21) 99876-5432" },
  { "Cliente": "Rita", "DDD+Numero": "71 98765 4321" },
  { "Contato": "Bruno", "Fone": "+55 48 98888 7777" },
  { "Nome": "Alice", "WhatsApp com DDD": "34 99999-8888" }
];
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Contatos');
XLSX.writeFile(wb, 'import_exec.xlsx');
