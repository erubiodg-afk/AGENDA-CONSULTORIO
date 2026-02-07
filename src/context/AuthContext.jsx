import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { dbService } from '../services/db.service';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para verificar permisos adicionales tras login
    const verifyUserRole = async (sessionUser) => {
        if (!sessionUser) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            // Verificar si está en la tabla de usuarios autorizados
            const authorizedUser = await dbService.checkUserAuthorized(sessionUser.email);

            if (authorizedUser) {
                // Combinar datos de sesión con datos de rol
                setUser({ ...sessionUser, ...authorizedUser });
            } else {
                console.warn(`Usuario no autorizado: ${sessionUser.email}`);
                await authService.logout();
                setError('No tienes permiso para acceder a esta aplicación.');
                setUser(null);
            }
        } catch (err) {
            console.error('Error verificando rol:', err);
            setError('Error de conexión verificando permisos.');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 1. Check sesión inicial
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                await verifyUserRole(session?.user);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        initSession();

        // 2. Suscribirse a cambios
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);

            if (event === 'SIGNED_OUT' || !session) {
                setUser(null);
                setLoading(false);
                return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await verifyUserRole(session.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loginGoogle = async () => {
        setLoading(true);
        setError(null);
        try {
            await authService.loginWithGoogle();
            // La redirección ocurrirá, la verificación se hará al volver
        } catch (e) {
            setError(e.message);
            setLoading(false);
            throw e;
        }
    };

    const logout = async () => {
        setLoading(true);
        await authService.logout();
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loginGoogle, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
