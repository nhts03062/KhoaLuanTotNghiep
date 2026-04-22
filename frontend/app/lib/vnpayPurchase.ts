export const PENDING_PURCHASE_KEY = 'bestgym_pending_purchase';

export type PendingPurchase = {
  packageId: string;
  branchId: string;
  packageName?: string;
  branchName?: string;
  amount?: number;
};

export function savePendingPurchase(data: PendingPurchase) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(data));
}

export function getPendingPurchase(): PendingPurchase | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_PURCHASE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPurchase;
  } catch {
    return null;
  }
}

export function clearPendingPurchase() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_PURCHASE_KEY);
}

export function markTxnProcessed(txnRef: string) {
  if (typeof window === 'undefined' || !txnRef) return;
  sessionStorage.setItem(`bestgym_vnpay_done_${txnRef}`, '1');
}

export function isTxnProcessed(txnRef: string): boolean {
  if (typeof window === 'undefined' || !txnRef) return false;
  return sessionStorage.getItem(`bestgym_vnpay_done_${txnRef}`) === '1';
}
