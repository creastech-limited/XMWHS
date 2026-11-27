import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const DIDStoreRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const u = auth?.user as any;
  const isDIDStore = Boolean(u?.isDIDStore ?? u?.data?.isDIDStore);

  return isDIDStore ? <>{children}</> : <Navigate to="/store" replace />;
};