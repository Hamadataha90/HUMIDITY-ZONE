'use server'

import crypto from 'crypto'
import axios from 'axios'

export async function createCoinPaymentTransaction(formData) {
  const amount = formData.get('amount')
  const email = formData.get('email')
  const currency2 = formData.get('currency2') || 'USDT.TRC20'

  const publicKey = process.env.COINPAYMENTS_PUBLIC_KEY
  const privateKey = process.env.COINPAYMENTS_PRIVATE_KEY

  const payload = {
    version: '1',
    cmd: 'create_transaction',
    key: publicKey,
    amount,
    currency1: 'USD',
    currency2,
    buyer_email: email,
    ipn_url: 'https://paws-trip.vercel.app/api/ipn',
    // success_url: `https://paws-trip.vercel.app/thanks?txn_id=${result.result.txn_id}&status=completed`,
    success_url: `https://paws-trip.vercel.app/thanks?txn_id=12345&status=completed`,
    cancel_url: 'https://paws-trip.vercel.app/checkout',
    format: 'json',
  }

  const encodedPayload = new URLSearchParams(payload).toString()

  const hmac = crypto
    .createHmac('sha512', privateKey)
    .update(encodedPayload)
    .digest('hex')

  try {
    const response = await axios.post(
      'https://www.coinpayments.net/api.php',
      encodedPayload,
      {
        headers: {
          HMAC: hmac,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const result = response.data

    if (result.error === 'ok') {
      return {
        success: true,
        checkout_url: result.result.checkout_url,
        txn_id: result.result.txn_id,
      }
    } else {
      return {
        success: false,
        error: result.error,
      }
    }
  } catch (error) {
    console.error('CoinPayments Error:', error.response?.data || error.message)
    return {
      success: false,
      error: 'Something went wrong with the payment.',
    }
  }
}
