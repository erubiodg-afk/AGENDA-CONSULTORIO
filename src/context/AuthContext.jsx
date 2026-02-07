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
            localStorage.removeItem('auth_cached_role'); // Limpiar caché al salir
            return;
        }

        // 1. Intentar carga rápida desde caché
        const cachedRole = localStorage.getItem('auth_cached_role');
        if (cachedRole) {
            try {
                const parsedRole = JSON.parse(cachedRole);
                if (parsedRole.email === sessionUser.email) {
                    console.log("Usando credenciales en caché");
                    setUser({ ...sessionUser, ...parsedRole });
                    setLoading(false); // Desbloquear UI inmediatamente
                }
            } catch (e) { console.error("Error parsing cached role", e); }
        }

        try {
            // 2. Revalidar con base de datos (segundo plano si ya cargó caché)
            const authorizedUser = await dbService.checkUserAuthorized(sessionUser.email);

            if (authorizedUser) {
                // Combinar datos de sesión con datos de rol
                const fullUser = { ...sessionUser, ...authorizedUser };
                setUser(fullUser);
                // Actualizar caché
                localStorage.setItem('auth_cached_role', JSON.stringify(authorizedUser));
            } else {
                console.warn(`Usuario no autorizado: ${sessionUser.email}`);
                await logout(); // Usar función segura
                setError('No tienes permiso para acceder a esta aplicación.');
                return; // Logout se encarga de limpiar
            }
        } catch (err) {
            console.error('Error verificando rol:', err);
            // Si falló la red pero teníamos caché, permitimos seguir (opcional, aquí avisamos)
            if (!cachedRole) {
                setError('Error de conexión verificando permisos.');
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        // 1. Fail-safe absoluto: si en 5 segundos sigue cargando, parar
        const safetyTimer = setTimeout(() => {
            if (mounted) {
                setLoading(current => {
                    if (current) {
                        console.warn("Forzando fin de carga por seguridad (Safety Timer).");
                        return false;
                    }
                    return current;
                });
            }
        }, 5000);

        // 2. Check sesión inicial
        const initSession = async () => {
            try {
                console.log("Iniciando sesión...");
                const { data: { session }, error } = await supabase.auth.getSession();

                if (mounted) {
                    if (error) throw error;
                    if (session) {
                        await verifyUserRole(session.user);
                    } else {
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.warn("Error initSession:", err);
                if (mounted) setLoading(false);
            }
        };

        initSession();

        // 3. Suscribirse a cambios
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);
            if (!mounted) return;

            if (event === 'SIGNED_OUT' || !session) {
                setUser(null);
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await verifyUserRole(session.user);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
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
        console.log("AuthContext: Logout initiated");
        setLoading(true);
        try {
            // Race: si Supabase tarda más de 2s, forzamos salida local
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Logout Timeout')), 2000)
            );
            await Promise.race([authService.logout(), timeoutPromise]);
        } catch (e) {
            console.warn("Cierre de sesión forzado por timeout o error:", e);
        } finally {
            // Limpieza Total del Cliente
            console.log("Limpiando estado local y storage...");
            localStorage.clear(); // [Hard Logout] Borra todo: auth, cache, settings
            setUser(null);
            setLoading(false);

            // Forzar recarga completa para asegurar limpieza de memoria/contextos
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{ user, loginGoogle, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
