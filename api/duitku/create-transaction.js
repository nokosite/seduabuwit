/**
 * Duitku Create Transaction API Proxy
 *
 * This endpoint proxies transaction creation to Duitku API
 *
 * Endpoint: POST /api/duitku/create-transaction
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
 * Generate signature for createTransaction
 * Formula: md5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 */
function generateSignature(merchantOrderId, paymentAmount) {
  const signatureString = `${DUITKU_CONFIG.merchantCode}${merchantOrderId}${paymentAmount}${DUITKU_CONFIG.apiKey}`;
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
    const {
      paymentMethod,
      paymentAmount,
      merchantOrderId,
      productDetails,
      customerVaName,
      email,
      phoneNumber,
      callbackUrl,
      returnUrl,
      expiryPeriod = 1440,
      studentId
    } = req.body;

    // Validate required fields
    if (!paymentMethod || !paymentAmount || !merchantOrderId || !customerVaName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const signature = generateSignature(merchantOrderId, paymentAmount);

    // Get origin for callback/return URLs
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
    const baseUrl = origin.replace(/\/$/, '');

    const requestBody = {
      merchantCode: DUITKU_CONFIG.merchantCode,
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
      merchantOrderId: merchantOrderId,
      productDetails: productDetails || 'Pembayaran Sumbangan Sukarela',
      customerVaName: customerVaName,
      email: email,
      phoneNumber: phoneNumber || '08123456789',
      callbackUrl: callbackUrl || `${baseUrl}/api/duitku/callback`,
      returnUrl: returnUrl || `${baseUrl}/payment/success`,
      signature: signature,
      expiryPeriod: expiryPeriod,
      // Additional fields
      merchantUserInfo: email,
      additionalParam: JSON.stringify({
        studentId: studentId || '',
        paymentType: 'Sumbangan Sukarela'
      })
    };

    // Call Duitku API
    const response = await fetch(
      `${getBaseUrl()}/webapi/api/merchant/v2/inquiry`,
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
    if (data.statusCode === '00') {
      return res.status(200).json({
        success: true,
        data: {
          reference: data.reference,
          vaNumber: data.vaNumber,
          qrString: data.qrString,
          amount: data.amount,
          paymentUrl: data.paymentUrl,
          merchantOrderId: merchantOrderId
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        message: data.statusMessage || 'Failed to create transaction',
        code: data.statusCode
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
