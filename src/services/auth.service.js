/**
 * Servicio de Autenticación (Supabase Auth)
 */
import { supabase } from '../lib/supabase';

export const authService = {
    loginWithGoogle: async () => {
        console.log("Iniciando login con Google...");

        // 1. Obtener URL base de Supabase sin redirigir
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: import.meta.env.PROD
                    ? 'https://agenda-consultorio.netlify.app'
                    : window.location.origin,
                skipBrowserRedirect: true,
                // NO pasamos queryParams aquí para evitar duplicados.
                scopes: 'https://www.googleapis.com/auth/calendar'
            }
        });

        if (error) throw error;

        // 2. Construcción manual y forzada de la URL
        if (data?.url) {
            const urlObj = new URL(data.url);

            // Limpiar parámetros para asegurar estado fresco
            urlObj.searchParams.delete('prompt');
            urlObj.searchParams.delete('access_type');

            // CRÍTICO: 'select_account' fuerza a Google a mostrar el selector de cuentas
            // 'consent' fuerza a Google a pedir permisos de nuevo (no siempre necesario pero útil para refresh token)
            urlObj.searchParams.set('prompt', 'consent select_account');
            urlObj.searchParams.set('access_type', 'offline');

            console.log("Redirecting to (forced):", urlObj.toString());
            window.location.href = urlObj.toString();
        } else {
            throw new Error('No se pudo generar la URL de autenticación.');
        }

        return data;
    },

    logout: async () => {
        console.log("Ejecutando Cierre Forzado de Sesión (v3 - Token Revocation)...");

        // 1. Obtener Sesión Actual para Revocar Token
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const providerToken = session?.provider_token; // Token de acceso de Google

            if (providerToken) {
                console.log("Revocando token de Google en servidor...");
                // Endpoint oficial de revocación de Google
                await fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `token=${providerToken}`
                });
                console.log("Token revocado exitosamente.");
            } else {
                console.warn("No se encontró provider_token para revocar. Es posible que la sesión ya haya expirado o no se hayan guardado tokens.");
            }
        } catch (e) {
            console.warn("Error revocando token de Google:", e);
        }

        // 2. Desactivar Auto-Select (Capa Adicional)
        try {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect();
                console.log("Google AutoSelect disabled");
            }
        } catch (e) { console.warn("Error disabling AutoSelect:", e); }

        // 3. Limpieza de Cookies por Dominio (Brute force)
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }

        // 4. Limpieza de Almacenamiento Local
        localStorage.clear();
        sessionStorage.clear();

        // 5. Cerrar sesión en Supabase
        try {
            await supabase.auth.signOut();
        } catch (e) { console.warn("Supabase signOut error:", e); }

        // 6. Redirección con Timestamp (Cache Busting)
        const timestamp = new Date().getTime();
        window.location.href = `${window.location.origin}/?logout=true&t=${timestamp}`;
    },

    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    // Listener para cambios de auth
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    }
};
