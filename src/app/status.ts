export enum COMMON_STATUS {
  'idle' = 'idle',
  'pending' = 'pending',
  'resolved' = 'resolved',
  'rejected' = 'rejected',
}

export function isIdle(status: COMMON_STATUS): boolean {
  return status === COMMON_STATUS.idle;
}

export function isPending(status: COMMON_STATUS): boolean {
  return status === COMMON_STATUS.pending;
}

export function isResolved(status: COMMON_STATUS): boolean {
  return status == COMMON_STATUS.resolved;
}

export function isRejected(status: COMMON_STATUS): boolean {
  return status === COMMON_STATUS.rejected;
}
