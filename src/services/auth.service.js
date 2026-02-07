/**
 * Servicio de Autenticación (Supabase Auth)
 */
import { supabase } from '../lib/supabase';

export const authService = {
    loginWithGoogle: async () => {
        // 1. Obtener URL de autenticación sin redirigir automáticamente
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: import.meta.env.PROD
                    ? 'https://agenda-consultorio.netlify.app'
                    : window.location.origin,
                skipBrowserRedirect: true, // Importante: Control manual
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent select_account', // Supabase debería ponerlo, pero aseguramos abajo
                },
                scopes: 'https://www.googleapis.com/auth/calendar'
            }
        });

        if (error) throw error;

        // 2. Forzar manualmente los parámetros en la URL generada
        if (data?.url) {
            const urlObj = new URL(data.url);
            // Sobrescribir prompt para asegurar que nada lo quite
            urlObj.searchParams.set('prompt', 'consent select_account');

            console.log("Redirigiendo manualmente a Google Auth:", urlObj.toString());
            window.location.href = urlObj.toString();
        }

        return data; // Por compatibilidad, aunque la página cambiará
    },

    logout: async () => {
        // 1. Revocar token de Google (Hard Logout)
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

        // 3. Limpieza local explícita (por si acaso)
        localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL + '-auth-token');
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
