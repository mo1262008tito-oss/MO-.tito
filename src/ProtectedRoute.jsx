import { Navigate } from 'react-router-dom';
import { auth } from './firebase'; // تأكد أن الملف في نفس المجلد
import { useAuthState } from 'react-firebase-hooks/auth';

const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="loader">جاري التحقق من الهوية...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;