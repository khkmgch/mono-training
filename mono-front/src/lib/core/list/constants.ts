// Backend (mono-back に ListConstants 相当が後で追加される場合) は同値を持つ必要あり —
// drift は境界条件 (size>100 / q.length>100 / sort direction 受理範囲) の挙動ずれを招く。
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_Q_LENGTH = 100;
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
