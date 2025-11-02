// File: /api/create-bill.js
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Get data from the frontend request
        const { name, email, phone, amount, billDescription } = req.body;

        // Your SECRET data is now safe on the server
        const userSecretKey = 'b2kcp05o-b5m0-q000-55i7-w3j57riufv7h';
        const categoryCode = '8f5ynfpt';
        const billName = 'PROSTREAM';
        const billPriceSetting = '1';
        const billPayorInfo = '1';
        const billAmount = `${amount * 100}`; // Convert to cents
        const billReturnUrl = 'https://prostream-rho.vercel.app/payment-successful.html';
        const billCallbackUrl = 'https://prostream-rho.vercel.app/api/payment-callback';
        const billExternalReferenceNo = `PS${Date.now()}`;
        const billTo = name;
        const billEmail = email;
        const billPhone = phone;
        const billSplitPayment = '0';
        const billPaymentChannel = '0';
        const billChargeToCustomer = '1';

        // Create expiry date in UTC to avoid timezone issues
        const expiryDate = new Date();
        expiryDate.setUTCDate(expiryDate.getUTCDate() + 3);
        const formattedExpiryDate = 
            `${expiryDate.getUTCDate().toString().padStart(2, '0')}-` +
            `${(expiryDate.getUTCMonth() + 1).toString().padStart(2, '0')}-` +
            `${expiryDate.getUTCFullYear()} ` +
            `${expiryDate.getUTCHours().toString().padStart(2, '0')}:` +
            `${expiryDate.getUTCMinutes().toString().padStart(2, '0')}:` +
            `${expiryDate.getUTCSeconds().toString().padStart(2, '0')}`;

        // Create the form data for ToyyibPay
        const body = new FormData();
        body.append('userSecretKey', userSecretKey);
        body.append('categoryCode', categoryCode);
        body.append('billName', billName);
        body.append('billDescription', billDescription);
        body.append('billPriceSetting', billPriceSetting);
        body.append('billPayorInfo', billPayorInfo);
        body.append('billAmount', billAmount);
        body.append('billReturnUrl', billReturnUrl);
        body.append('billCallbackUrl', billCallbackUrl);
        body.append('billExternalReferenceNo', billExternalReferenceNo);
        body.append('billTo', billTo);
        body.append('billEmail', billEmail);
        body.append('billPhone', billPhone);
        body.append('billSplitPayment', billSplitPayment);
        body.append('billPaymentChannel', billPaymentChannel);
        body.append('billChargeToCustomer', billChargeToCustomer);
        body.append('billExpiryDate', formattedExpiryDate);

        // Make the API call to ToyyibPay from the server
        const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
            method: 'POST',
            body: body,
        });

        const textResult = await response.text();
        let result;

        try {
            result = JSON.parse(textResult);
        } catch (e) {
            console.error("Failed to parse ToyyibPay response:", textResult);
            return res.status(500).json({ success: false, error: 'Invalid response from payment provider.' });
        }

        // Check if the bill was created successfully
        if (result && result.length > 0 && result[0].BillCode) {
            const billCode = result[0].BillCode;
            const billUrl = `https://toyyibpay.com/${billCode}`;

            // Send the successful response back to the frontend
            return res.status(200).json({ success: true, billCode, billUrl });
        } else {
            console.error("ToyyibPay API Error:", result);
            return res.status(400).json({ success: false, error: 'Failed to create payment bill.', details: result });
        }
    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
    }
}
