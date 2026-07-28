// `orders.total_amount` is numeric(10,2) — rupees with paise. Adding those as
// floats drifts (0.1 + 0.2 !== 0.3), and these totals are what vendors get paid
// against, so every sum accumulates in integer paise and converts back once at
// the end.

export function toPaise(amount: number | string | null | undefined): number {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (n == null || !Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

export function fromPaise(paise: number): number {
  return Math.round(paise) / 100
}
