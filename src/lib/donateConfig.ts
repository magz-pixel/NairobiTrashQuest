/**
 * Public donate details for Fix Nairobi & XPNC.
 * Set real values via Vite env (local `.env` or Vercel) — never commit secrets.
 */

function env(key: string, fallback: string): string {
  const v = import.meta.env[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

export const donateConfig = {
  orgName: 'Fix Nairobi & XPNC',
  mpesa: {
    label: 'M-Pesa',
    paybillOrTill: 'Till / Paybill',
    number: env('VITE_MPESA_TILL', '000000'),
    accountName: env('VITE_MPESA_ACCOUNT_NAME', 'Fix Nairobi'),
    accountReference: env('VITE_MPESA_REFERENCE', 'DONATE'),
    steps: [
      'Go to M-Pesa → Lipa na M-Pesa → Buy Goods or Pay Bill',
      'Enter the Till / Paybill number below',
      'Enter amount (KES) and your PIN',
      'Keep the SMS confirmation — our team logs it on the public ledger',
    ],
  },
  usdt: {
    label: 'USDT',
    network: env('VITE_USDT_NETWORK', 'TRC20 (Tron)'),
    address: env('VITE_USDT_ADDRESS', 'TReplaceWithYourUSDTWalletAddressXXXXXXXX'),
    note: 'Send only USDT on the network shown. Wrong network may mean lost funds.',
  },
} as const
