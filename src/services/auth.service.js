/**
 * Servicio de Autenticación (Supabase Auth)
 */
import { supabase } from '../lib/supabase';

export const authService = {
    loginWithGoogle: async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: import.meta.env.PROD
                    ? 'https://agenda-consultorio.netlify.app'
                    : window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent select_account',
                },
                scopes: 'https://www.googleapis.com/auth/calendar'
            }
        });
        if (error) throw error;
        return data;
    },

    logout: async () => {
        // Intentar revocar token de Google si existe
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.provider_token) {
                await fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `token=${session.provider_token}`
                });
            }
        } catch (e) {
            console.warn("Error revoking Google token:", e);
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
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
