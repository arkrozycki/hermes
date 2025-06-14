import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingService } from '../services/settingService';

interface AuthContextType {
    isAuthenticated: boolean;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            const isAuthed = settingService.isAuthenticated();
            setIsAuthenticated(isAuthed);
            // Show settings panel if not authenticated
            setShowSettings(!isAuthed);
        };

        checkAuth();
    }, []);

    const login = (token: string) => {
        settingService.saveToken(token);
        setIsAuthenticated(true);
        setShowSettings(false);
    };

    const logout = () => {
        settingService.logout();
        setIsAuthenticated(false);
        setShowSettings(true);
    };

    return (
        <AuthContext.Provider 
            value={{ 
                isAuthenticated, 
                showSettings, 
                setShowSettings, 
                login, 
                logout 
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 