import React, { createContext, useContext, useEffect, useState } from 'react';
import { account } from '../lib/appwrite';

type AuthUser = Record<string, any> | null;

interface AuthContextType {
    user: AuthUser;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    checkAuth: async () => {},
    logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const currentAccount = await account.get();
            setUser(currentAccount as AuthUser);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await account.deleteSession('current');
        setUser(null);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);