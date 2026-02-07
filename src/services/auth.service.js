/**
 * Servicio de Autenticación (Supabase Auth)
 */
import { supabase } from '../lib/supabase';

export const authService = {
    loginWithGoogle: async () => {
        console.log("Iniciando login con Google (Manual/Clean)...");

        // 1. Obtener URL base de Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: import.meta.env.PROD
                    ? 'https://agenda-consultorio.netlify.app'
                    : window.location.origin,
                skipBrowserRedirect: true,
                // NO pasamos queryParams aquí para evitar conflictos.
                scopes: 'https://www.googleapis.com/auth/calendar'
            }
        });

        if (error) throw error;

        // 2. Construcción URL Manual
        if (data?.url) {
            const urlObj = new URL(data.url);

            // Limpieza TOTAL de parámetros que puedan inducir auto-login
            urlObj.searchParams.delete('prompt');
            urlObj.searchParams.delete('access_type');
            urlObj.searchParams.delete('ux_mode');
            urlObj.searchParams.delete('login_hint');

            // Configuración forzada para mostrar selector
            // SOLICITUD DE USUARIO: prompt: 'select_account' y ux_mode: 'redirect'
            urlObj.searchParams.set('prompt', 'select_account'); // Fuerza lista de cuentas
            urlObj.searchParams.set('access_type', 'offline');
            urlObj.searchParams.set('ux_mode', 'redirect'); // Fuerza redirección (GIS/Standard)

            console.log("Redirecting to (Strict/UserRequested):", urlObj.toString());
            window.location.href = urlObj.toString();
        } else {
            throw new Error('No se pudo generar la URL de autenticación.');
        }

        return data;
    },

    logout: async () => {
        console.log("Ejecutando Cierre Forzado de Sesión (v5 - Specific Cookie Nuke)...");

        // 1. Obtener Sesión para Email y Token
        let userEmail = null;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const providerToken = session?.provider_token;
            userEmail = session?.user?.email;

            // 1a. Revocación de Token (Servidor)
            if (providerToken) {
                console.log("Revocando token de Google en servidor...");
                await fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `token=${providerToken}`
                });
            }
        } catch (e) { console.warn("Error getting session for revoke:", e); }

        // 1b. Revocación de Permisos por Email (Cliente - GSI) OBLIGATORIA
        if (userEmail && window.google?.accounts?.id) {
            console.log(`INTENTO DE REVOCACIÓN GSI para: ${userEmail}`);
            window.google.accounts.id.revoke(userEmail, done => {
                console.log('GSI Revocation callback received for ' + userEmail);
                if (done.error) console.error("GSI Revoke Error:", done.error);
            });
        } else {
            // Fallback si no hay email en contexto (usuario ya limpio localstorage?)
            // Intentar revocar al "usuario actual" si la librería lo permite (no documentado std, pero intentamos disableAutoSelect)
            try {
                window.google.accounts.id.disableAutoSelect();
            } catch (e) { }
        }

        // 1c. Disable AutoSelect (Redundante pero necesario)
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }

        // 2. Limpieza de Cookies Específicas (Espejo de index.html)
        const cookiesToNuke = ["G_AUTHUSER_H", "G_ENABLED_IDPS", "G_AUTHUSER", "sb-access-token", "sb-refresh-token"];
        cookiesToNuke.forEach(name => {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });

        // 3. Limpieza de Cookies General (Brute force)
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
        } catch (e) {
            console.warn("Supabase signOut error:", e);
        }

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
