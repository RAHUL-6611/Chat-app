import { createContext, use, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in (optional: could hit a /profile or /me endpoint)
        const storedUser = localStorage.getItem('chat_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setUser(data);
        localStorage.setItem('chat_user', JSON.stringify(data));
        return data;
    };

    const signup = async (username, email, password) => {
        const { data } = await api.post('/auth/signup', { username, email, password });
        setUser(data);
        localStorage.setItem('chat_user', JSON.stringify(data));
        return data;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        localStorage.removeItem('chat_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => use(AuthContext);
