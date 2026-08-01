/**
 * Duitku Return Handler
 * 
 * Endpoint ini dipanggil saat user kembali dari halaman pembayaran Duitku
 * URL: /api/duitku/return?merchantOrderId=xxx&resultCode=00
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { merchantOrderId, resultCode } = req.query;

    // Redirect to success/failed page based on resultCode
    if (resultCode === '00') {
      return res.redirect(`/payment/success?orderId=${merchantOrderId}`);
    } else {
      return res.redirect(`/payment/failed?orderId=${merchantOrderId}&code=${resultCode}`);
    }

  } catch (_error) {
    return res.redirect('/payment/error');
  }
}
