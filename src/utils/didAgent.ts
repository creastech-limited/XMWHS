export const isDidAgent = (
  user?: { role?: string; isDIDAgent?: boolean } | null
): boolean =>
  String(user?.role ?? '').toLowerCase() === 'agent' && user?.isDIDAgent === true;