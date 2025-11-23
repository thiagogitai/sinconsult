/**
 * Validação de números de telefone
 * Suporta formatos brasileiros e internacionais
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  countryCode?: string;
  error?: string;
}

/**
 * Valida e formata número de telefone
 * @param phone - Número de telefone a ser validado
 * @returns Resultado da validação com número formatado
 */
export function validatePhone(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Número de telefone inválido'
    };
  }

  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Validação para números brasileiros
  if (cleaned.length >= 10 && cleaned.length <= 13) {
    // Formato brasileiro: +55 (11) 99999-9999 ou 11999999999
    let digits = cleaned;
    
    // Se começa com 55 (código do Brasil), remove
    if (digits.startsWith('55') && digits.length > 11) {
      digits = digits.substring(2);
    }

    // Deve ter 10 ou 11 dígitos (com ou sem DDD)
    if (digits.length === 10 || digits.length === 11) {
      // Formata: (XX) XXXXX-XXXX ou (XX) XXXXXXXXX
      const ddd = digits.substring(0, 2);
      const number = digits.substring(2);
      const formatted = digits.length === 11
        ? `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`
        : `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;

      return {
        isValid: true,
        formatted: formatted,
        countryCode: '55'
      };
    }
  }

  // Validação para números internacionais (10-15 dígitos)
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    // Formato internacional básico
    const formatted = `+${cleaned}`;
    
    return {
      isValid: true,
      formatted: formatted,
      countryCode: cleaned.substring(0, 3)
    };
  }

  return {
    isValid: false,
    error: 'Número de telefone deve ter entre 10 e 15 dígitos'
  };
}

/**
 * Normaliza número de telefone para formato internacional
 * @param phone - Número de telefone
 * @returns Número normalizado (apenas dígitos com código do país)
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não começa com código de país e tem 10-11 dígitos, assume Brasil
  if (cleaned.length >= 10 && cleaned.length <= 11 && !cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Formata número para exibição
 * @param phone - Número de telefone
 * @returns Número formatado para exibição
 */
export function formatPhoneForDisplay(phone: string): string {
  const validation = validatePhone(phone);
  return validation.formatted || phone;
}

