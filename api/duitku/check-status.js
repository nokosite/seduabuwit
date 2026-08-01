/**
 * Duitku Check Transaction Status API Proxy
 *
 * This endpoint checks transaction status from Duitku
 *
 * Endpoint: POST /api/duitku/check-status
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
 * Generate signature for checkStatus
 * Formula: md5(merchantCode + merchantOrderId + apiKey)
 */
function generateSignature(merchantOrderId) {
  const signatureString = `${DUITKU_CONFIG.merchantCode}${merchantOrderId}${DUITKU_CONFIG.apiKey}`;
  return crypto.createHash('md5').update(signatureString).digest('hex');
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
    const { merchantOrderId } = req.body;

    // Validate input
    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: 'merchantOrderId is required'
      });
    }

    const signature = generateSignature(merchantOrderId);

    const requestBody = {
      merchantCode: DUITKU_CONFIG.merchantCode,
      merchantOrderId: merchantOrderId,
      signature: signature
    };

    // Call Duitku API
    const response = await fetch(
      `${getBaseUrl()}/webapi/api/merchant/transactionStatus`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    // Return response
    if (data.statusCode) {
      return res.status(200).json({
        success: true,
        status: data.statusMessage,
        statusCode: data.statusCode,
        amount: data.amount,
        reference: data.reference
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Failed to check status'
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
