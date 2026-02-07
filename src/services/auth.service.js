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
                // NO pasamos queryParams aquí para evitar duplicados o conflictos internos.
                // Los inyectaremos manualmente en la URL generada.
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

            // Inyección explícita de parámetros
            // 'consent' fuerza la pantalla de permisos (para obtener refresh token)
            // 'select_account' fuerza el selector de cuentas
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
        // 1. Intentar obtener sesión para revocar token
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.provider_token) {
                console.log("Revocando token de Google...");
                await fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `token=${session.provider_token}`
                });
            }
        } catch (e) {
            console.warn("Error revoking Google token:", e);
        }

        // 2. Cerrar sesión en Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // 3. Limpieza local TOTAL
        console.log("Realizando limpieza local exhaustiva...");
        localStorage.clear(); // Borra todo
        sessionStorage.clear(); // Borra todo

        // Eliminar cookies específicas si existen (aunque HttpOnly no se pueden borrar desde JS)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
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
