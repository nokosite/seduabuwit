/**
 * Duitku Get Payment Methods API Proxy
 *
 * This endpoint proxies requests to Duitku API to avoid CORS issues
 *
 * Endpoint: POST /api/duitku/get-payment-methods
 * Body: { amount: number }
 */

import crypto from 'crypto';

// Duitku Configuration
const DUITKU_CONFIG = {
  merchantCode: process.env.DUITKU_MERCHANT_CODE,
  apiKey: process.env.DUITKU_API_KEY,
  sandboxUrl: 'https://sandbox.duitku.com',
  productionUrl: 'https://passport.duitku.com',
  environment: process.env.DUITKU_ENV || 'sandbox'
};

// Validate required environment variables
if (!DUITKU_CONFIG.merchantCode || !DUITKU_CONFIG.apiKey) {
  console.error('Missing required environment variables: DUITKU_MERCHANT_CODE or DUITKU_API_KEY');
}

/**
 * Get base URL based on environment
 */
function getBaseUrl() {
  return DUITKU_CONFIG.environment === 'production'
    ? DUITKU_CONFIG.productionUrl
    : DUITKU_CONFIG.sandboxUrl;
}

/**
 * Get current datetime in Duitku format
 */
function getCurrentDatetime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate signature for getPaymentMethod
 * Formula: sha256(merchantCode + amount + datetime + apiKey)
 */
function generateSignature(amount, datetime) {
  const signatureString = `${DUITKU_CONFIG.merchantCode}${amount}${datetime}${DUITKU_CONFIG.apiKey}`;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { amount } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const datetime = getCurrentDatetime();
    const signature = generateSignature(amount, datetime);

    const requestBody = {
      merchantcode: DUITKU_CONFIG.merchantCode,  // lowercase sesuai dokumentasi
      amount: amount,
      datetime: datetime,
      signature: signature
    };

    // Call Duitku API
    const response = await fetch(
      `${getBaseUrl()}/webapi/api/merchant/paymentmethod/getpaymentmethod`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    // Check response
    if (data.responseCode === '00') {
      return res.status(200).json({
        success: true,
        data: data.paymentFee
      });
    } else {
      return res.status(200).json({
        success: false,
        message: data.responseMessage || 'Failed to get payment methods',
        code: data.responseCode
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
