import type { Payment } from '@/src/types'
import type { PaymentStatusDisplay } from '@/src/types'

const EXPIRES_SOON_DAYS = 30

/**
 * Derives display status (including "expires_soon") from a payment record.
 */
export function getPaymentDisplayStatus(payment: Payment): PaymentStatusDisplay {
  if (payment.status === 'canceled') return 'canceled'
  if (payment.status === 'expired') return 'expired'

  const exp = new Date(payment.expiration_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  exp.setHours(0, 0, 0, 0)

  if (exp < today) return 'expired'

  const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (daysLeft <= EXPIRES_SOON_DAYS) return 'expires_soon'

  return 'active'
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatusDisplay, string> = {
  active: 'bg-emerald-500',       // Green
  expires_soon: 'bg-amber-500',   // Orange
  expired: 'bg-red-500',          // Red
  canceled: 'bg-slate-800',       // Black
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusDisplay, string> = {
  active: 'Active',
  expires_soon: 'Expires Soon',
  expired: 'Expired',
  canceled: 'Canceled',
}
