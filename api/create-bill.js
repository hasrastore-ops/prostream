// create-bill.js
import fetch from 'node-fetch';

// ==============================
// ✅ CONFIGURATION
// ==============================
const TOYYIB_API_KEY = 'b2kcp05o-b5m0-q000-55i7-w3j57riufv7h';
const CATEGORY_CODE = '8f5ynfpt';
const BILL_NAME = 'PROSTREAM';
const SITE_URL = 'https://prostream-rho.vercel.app';

// ==============================
// ✅ MAIN HANDLER
// ==============================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, totalAmount, orderData } = req.body;

    if (!name || !email || !phone || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Current timestamp (UTC)
    const now = new Date();
    const billExternalReferenceNo = `PS${now.getTime()}`;

    // Expiry date 3 days later in Malaysia timezone
    const expiryMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(expiryMs);

    const opts = {
      timeZone: 'Asia/Kuala_Lumpur',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };

    const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(expiryDate);
    const dd = parts.find(p => p.type === 'day').value;
    const mm = parts.find(p => p.type === 'month').value;
    const yyyy = parts.find(p => p.type === 'year').value;
    const hh = parts.find(p => p.type === 'hour').value;
    const min = parts.find(p => p.type === 'minute').value;
    const sec = parts.find(p => p.type === 'second').value;
    const formattedExpiryDate = `${dd}-${mm}-${yyyy} ${hh}:${min}:${sec}`;

    // Return / Callback URLs (must match your domain)
    const billReturnUrl = `${SITE_URL}/payment-successful.html`;
    const billCallbackUrl = `${SITE_URL}/api/payment-callback`;

    // Amount in sen (ToyyibPay requires *100)
    const billAmount = String(Math.round(Number(totalAmount) * 100));

    // ==============================
    // ✅ BUILD BILL PAYLOAD
    // ==============================
    const body = new URLSearchParams({
      userSecretKey: TOYYIB_API_KEY,
      categoryCode: CATEGORY_CODE,
      billName: BILL_NAME,
      billDescription: 'ProStream Subscription Order',
      billPriceSetting: '1',
      billPayorInfo: '1',
      billAmount,
      billReturnUrl,
      billCallbackUrl,
      billExternalReferenceNo,
      billTo: name,
      billEmail: email,
      billPhone: phone,
      billSplitPayment: '0',
      billSplitPaymentArgs: '',
      billPaymentChannel: '0',
      billContentEmail: 'Thank you for purchasing ProStream package!',
      billChargeToCustomer: '',
      billExpiryDate: formattedExpiryDate
    });

    // ==============================
    // ✅ CALL TOYYIBPAY API
    // ==============================
    const result = await fetch('https://toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await result.json();
    console.log('🧾 ToyyibPay response:', data);

    if (Array.isArray(data) && data[0]?.BillCode) {
      const billCode = data[0].BillCode;

      // Return JSON response to frontend
      return res.status(200).json({
        success: true,
        billCode,
        billUrl: `https://toyyibpay.com/${billCode}`,
        billExternalReferenceNo,
        expiry: formattedExpiryDate
      });
    }

    throw new Error(`ToyyibPay failed: ${JSON.stringify(data)}`);
  } catch (err) {
    console.error('❌ Error creating bill:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
