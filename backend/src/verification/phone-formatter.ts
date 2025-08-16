export function formatPhoneToE164(phone: string, defaultCountryCode: string = '+1'): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add default country code
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 for US numbers if it's 11 digits
    if (defaultCountryCode === '+1' && cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = cleaned.substring(1);
    }
    
    // Remove leading 0 for international numbers
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    cleaned = defaultCountryCode + cleaned;
  }
  
  return cleaned;
}

export function formatPhoneForDisplay(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // US phone number formatting
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // US with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not US format
  return phone;
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Check for valid lengths (10 digits for US, 11 with country code, or 7-15 for international)
  return cleaned.length >= 7 && cleaned.length <= 15;
}