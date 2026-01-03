import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="loader">جاري التحقق من الهوية...</div>;
  if (!user) return <Navigate to="/" />; // يرجعه لصفحة Login إذا لم يسجل

  return children;
};

export default ProtectedRoute;