// hooks/useAuth.ts
import { useState, useEffect } from "react";
import axios from "axios";

export const useAuth = () => {
    const [user, setUser] = useState<null | { role: string }>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await axios.get("http://localhost:5001/api/auth/me", {
                    withCredentials: true,
                });
                setUser(res.data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    return { user, loading };
};
