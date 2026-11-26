import { useAuth } from '../context/AuthContext';

export const useIsDIDStore = (): boolean => {
  const auth = useAuth();
  const u = auth?.user as any;
  return Boolean(u?.isDIDStore ?? u?.data?.isDIDStore);
};