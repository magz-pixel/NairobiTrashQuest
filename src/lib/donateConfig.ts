import { getCity, type CityConfig } from './cities'

function env(key: string, fallback: string): string {
  const v = import.meta.env[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

export interface MobileMoneyMethod {
  id: string
  label: string
  paybillOrTill: string
  number: string
  accountName: string
  accountReference: string
  intro: string
  steps: string[]
}

export interface DonateConfig {
  orgName: string
  money: MobileMoneyMethod[]
  usdt: {
    label: string
    network: string
    address: string
    note: string
  }
}

const usdt = {
  label: 'USDT',
  network: env('VITE_USDT_NETWORK', 'TRC20 (Tron)'),
  address: env('VITE_USDT_ADDRESS', 'TReplaceWithYourUSDTWalletAddressXXXXXXXX'),
  note: 'Send only USDT on the network shown. Wrong network may mean lost funds.',
} as const

function nairobiDonate(city: CityConfig): DonateConfig {
  return {
    orgName: city.chapterName,
    money: [
      {
        id: 'mpesa',
        label: 'M-Pesa',
        paybillOrTill: 'Till / Paybill',
        number: env('VITE_MPESA_TILL', '000000'),
        accountName: env('VITE_MPESA_ACCOUNT_NAME', city.chapterName),
        accountReference: env('VITE_MPESA_REFERENCE', 'DONATE'),
        intro: 'Send via M-Pesa using these details:',
        steps: [
          'Go to M-Pesa → Lipa na M-Pesa → Buy Goods or Pay Bill',
          'Enter the Till / Paybill number below',
          `Enter amount (${city.currency.code}) and your PIN`,
          'Keep the SMS confirmation — our team logs it on the public ledger',
        ],
      },
    ],
    usdt,
  }
}

function kampalaDonate(city: CityConfig): DonateConfig {
  return {
    orgName: city.chapterName,
    money: [
      {
        id: 'mtn',
        label: 'MTN MoMo',
        paybillOrTill: 'Merchant / MoMo number',
        number: env('VITE_MTN_MOMO_NUMBER', '000000'),
        accountName: env('VITE_MTN_MOMO_ACCOUNT_NAME', city.chapterName),
        accountReference: env('VITE_MTN_MOMO_REFERENCE', 'DONATE'),
        intro: 'Send via MTN Mobile Money (Uganda):',
        steps: [
          'Dial *165# or open the MTN MoMo app',
          'Choose Send Money / Pay Merchant',
          'Enter the merchant number below',
          `Enter amount (${city.currency.code}) and confirm with your PIN`,
          'Keep the SMS confirmation — our team logs it on the public ledger',
        ],
      },
      {
        id: 'airtel',
        label: 'Airtel Money',
        paybillOrTill: 'Merchant / Airtel number',
        number: env('VITE_AIRTEL_MONEY_NUMBER', '000000'),
        accountName: env('VITE_AIRTEL_MONEY_ACCOUNT_NAME', city.chapterName),
        accountReference: env('VITE_AIRTEL_MONEY_REFERENCE', 'DONATE'),
        intro: 'Send via Airtel Money (Uganda):',
        steps: [
          'Dial *185# or open the Airtel Money app',
          'Choose Send Money / Pay Merchant',
          'Enter the merchant number below',
          `Enter amount (${city.currency.code}) and confirm with your PIN`,
          'Keep the SMS confirmation — our team logs it on the public ledger',
        ],
      },
    ],
    usdt,
  }
}

function darDonate(city: CityConfig): DonateConfig {
  return {
    orgName: city.chapterName,
    money: [
      {
        id: 'mpesa',
        label: 'M-Pesa',
        paybillOrTill: 'Lipa number',
        number: env('VITE_TZ_MPESA_LIPA', '000000'),
        accountName: env('VITE_TZ_MPESA_ACCOUNT_NAME', city.chapterName),
        accountReference: env('VITE_TZ_MPESA_REFERENCE', 'DONATE'),
        intro: 'Send via Vodacom M-Pesa (Tanzania):',
        steps: [
          'Dial *150*00# or open the M-Pesa app',
          'Choose Lipa kwa M-Pesa / Pay Merchant',
          'Enter the Lipa number below',
          `Enter amount (${city.currency.code}) and your PIN`,
          'Keep the SMS confirmation — our team logs it on the public ledger',
        ],
      },
    ],
    usdt,
  }
}

export function getDonateConfig(city: CityConfig): DonateConfig {
  if (city.slug === 'kampala') return kampalaDonate(city)
  if (city.slug === 'dar-es-salaam') return darDonate(city)
  return nairobiDonate(city)
}

/** @deprecated Prefer getDonateConfig(useCity()) */
export const donateConfig = getDonateConfig(getCity('nairobi'))
