/**
 * Mock payment methods for development (fallback)
 */
const MOCK_PAYMENT_METHODS = [
  { paymentMethod: 'BC', paymentName: 'BCA Virtual Account', totalFee: 4500 },
  { paymentMethod: 'M2', paymentName: 'Mandiri Virtual Account', totalFee: 4500 },
  { paymentMethod: 'I1', paymentName: 'BNI Virtual Account', totalFee: 4500 },
  { paymentMethod: 'BR', paymentName: 'BRI Virtual Account', totalFee: 4500 },
  { paymentMethod: 'BT', paymentName: 'Permata Virtual Account', totalFee: 4500 },
  { paymentMethod: 'SP', paymentName: 'ShopeePay', totalFee: 0 },
  { paymentMethod: 'OV', paymentName: 'OVO', totalFee: 0 },
  { paymentMethod: 'DA', paymentName: 'DANA', totalFee: 0 },
  { paymentMethod: 'LF', paymentName: 'LinkAja', totalFee: 0 },
  { paymentMethod: 'NQ', paymentName: 'QRIS', totalFee: 0 }
];

/**
 * Get API base URL
 * Development: Use local proxy server (localhost:3001)
 * Production: Use Vercel serverless functions
 */
const getApiBaseUrl = () => {
  // Check if we're in production (deployed to Vercel)
  const isProduction = window.location.hostname !== 'localhost' &&
                       window.location.hostname !== '127.0.0.1';

  return isProduction ? '' : 'http://localhost:3001';
};

/**
 * Get available payment methods
 * @param {number} amount - Payment amount
 * @returns {Promise<Object>} Payment methods list
 */
export const getPaymentMethods = async (amount) => {
  try {
    const baseUrl = getApiBaseUrl();

    // Call backend proxy (local dev server or Vercel)
    const response = await fetch(`${baseUrl}/api/duitku/get-payment-methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.message || 'API error');
    }
  } catch (_error) {
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: MOCK_PAYMENT_METHODS,
      _mockMode: true
    };
  }
};

/**
 * Create payment transaction
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Transaction result
 */
export const createTransaction = async (paymentData) => {
  try {
    const baseUrl = getApiBaseUrl();

    // Call backend proxy (local dev server or Vercel)
    const response = await fetch(`${baseUrl}/api/duitku/create-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.message || 'Failed to create transaction'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check transaction status
 * @param {string} merchantOrderId - Merchant order ID
 * @returns {Promise<Object>} Transaction status
 */
export const checkTransactionStatus = async (merchantOrderId) => {
  try {
    const baseUrl = getApiBaseUrl();

    // Call backend proxy (local dev server or Vercel)
    const response = await fetch(`${baseUrl}/api/duitku/check-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ merchantOrderId })
    });

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        status: result.status,
        statusCode: result.statusCode,
        amount: result.amount,
        reference: result.reference
      };
    } else {
      return {
        success: false,
        error: result.message || 'Failed to check status'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get payment method display name
 * @param {string} code - Payment method code
 * @returns {string} Display name
 */
export const getPaymentMethodName = (code) => {
  const methods = {
    'VC': 'Credit Card',
    'BC': 'BCA Virtual Account',
    'BT': 'Permata VA',
    'I1': 'BNI VA',
    'M2': 'Mandiri VA',
    'VA': 'Maybank VA',
    'B1': 'CIMB Niaga VA',
    'A1': 'ATM Bersama',
    'AG': 'Bank Artha Graha',
    'NC': 'Bank Neo Commerce',
    'BR': 'BRIVA',
    'FT': 'Retail (Indomaret/Alfamart)',
    'OV': 'OVO',
    'SP': 'ShopeePay',
    'SA': 'Shopee Pay',
    'LF': 'LinkAja Fixed',
    'LA': 'LinkAja',
    'DA': 'DANA',
    'OL': 'OVO (Linked)',
    'SL': 'ShopeePay (Linked)',
    'NQ': 'QRIS by Nobu',
    'QR': 'QRIS'
  };
  
  return methods[code] || code;
};

/**
 * Format VA number for display (add spaces for readability)
 * @param {string} vaNumber - VA number
 * @param {string} paymentMethod - Payment method code
 * @returns {string} Formatted VA number
 */
export const formatVANumber = (vaNumber, paymentMethod) => {
  if (!vaNumber) return '';

  // Remove any existing spaces
  const cleaned = vaNumber.replace(/\s/g, '');

  // Format based on payment method
  switch (paymentMethod) {
    case 'BC': // BCA: 70012 1234567890
      return cleaned.replace(/(\d{5})(\d+)/, '$1 $2');

    case 'M2': // Mandiri: 88608 1234567890
      return cleaned.replace(/(\d{5})(\d+)/, '$1 $2');

    case 'I1': // BNI: 8808 12345678901
      return cleaned.replace(/(\d{4})(\d+)/, '$1 $2');

    case 'BR': // BRI: 88888 1234567890
      return cleaned.replace(/(\d{5})(\d+)/, '$1 $2');

    case 'BT': // Permata: 8528 12345678901
      return cleaned.replace(/(\d{4})(\d+)/, '$1 $2');

    case 'A1': // ATM Bersama: 70014 1234567890
      return cleaned.replace(/(\d{5})(\d+)/, '$1 $2');

    default:
      // Default: add space every 4 digits
      return cleaned.replace(/(\d{4})/g, '$1 ').trim();
  }
};

/**
 * Get VA number prefix by payment method
 * @param {string} paymentMethod - Payment method code
 * @returns {string} VA prefix
 */
export const getVAPrefix = (paymentMethod) => {
  const prefixes = {
    'BC': '70012', // BCA
    'M2': '88608', // Mandiri
    'I1': '8808',  // BNI
    'BR': '88888', // BRI
    'BT': '8528',  // Permata
    'A1': '70014'  // ATM Bersama
  };

  return prefixes[paymentMethod] || '';
};

/**
 * Validate VA number format
 * @param {string} vaNumber - VA number to validate
 * @param {string} paymentMethod - Payment method code
 * @returns {boolean} Is valid
 */
export const validateVANumber = (vaNumber, paymentMethod) => {
  if (!vaNumber) return false;

  const cleaned = vaNumber.replace(/\s/g, '');
  const prefix = getVAPrefix(paymentMethod);

  if (!prefix) return false;

  // Check if starts with correct prefix
  if (!cleaned.startsWith(prefix)) return false;

  // Check length
  const expectedLength = {
    'BC': 15, // 70012 + 10 digits
    'M2': 15, // 88608 + 10 digits
    'I1': 15, // 8808 + 11 digits
    'BR': 15, // 88888 + 10 digits
    'BT': 15, // 8528 + 11 digits
    'A1': 15  // 70014 + 10 digits
  };

  return cleaned.length === expectedLength[paymentMethod];
};

/**
 * Generate mock VA number for development
 * NOTE: In production, ALWAYS use VA from Duitku API
 * @param {string} paymentMethod - Payment method code
 * @returns {string} Mock VA number
 */
export const generateMockVA = (paymentMethod) => {
  const prefix = getVAPrefix(paymentMethod);
  if (!prefix) return '';

  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  // Calculate remaining digits needed
  const totalLength = 15;
  const remainingDigits = totalLength - prefix.length;
  const suffix = (timestamp.slice(-remainingDigits + 3) + random).slice(0, remainingDigits);

  return prefix + suffix;
};

export default {
  getPaymentMethods,
  createTransaction,
  checkTransactionStatus,
  getPaymentMethodName,
  formatVANumber,
  getVAPrefix,
  validateVANumber,
  generateMockVA
};
