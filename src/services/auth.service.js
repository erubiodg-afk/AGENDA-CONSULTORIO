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
        console.log("Ejecutando Cierre Forzado de Sesión (v2 - Cache Buster)...");

        // 1. Revocación Inmediata (Google Identity Services)
        try {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect();
                // Intento de revocar si tenemos el correo (a veces funciona sin token)
                // window.google.accounts.id.revoke('user_email', done => ...); 
                console.log("Google AutoSelect disabled");
            }
        } catch (e) {
            console.warn("Error disabling Google AutoSelect:", e);
        }

        // 2. Limpieza de Cookies por Dominio (Brute force)
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }

        // 3. Limpieza de Almacenamiento Local
        localStorage.clear();
        sessionStorage.clear();

        // 4. Cerrar sesión en Supabase
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn("Supabase signOut error:", e);
        }

        // 5. Redirección con Timestamp (Cache Busting)
        // Agregamos timestamp para evitar que el navegador use una versión caché de la redirección
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
