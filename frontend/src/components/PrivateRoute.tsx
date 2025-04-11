import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api.ts';
import { Loader2 } from 'lucide-react';

const PrivateRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get('/api/admin/check-auth');
                if (res.status === 200) {
                    setIsAuthenticated(true);
                }
            } catch (err) {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin w-10 h-10 text-gray-600" />
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/admin-login" replace />;
};

export default PrivateRoute;
