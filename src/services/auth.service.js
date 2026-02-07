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
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent select_account', // Supabase debería ponerlo
                },
                scopes: 'https://www.googleapis.com/auth/calendar'
            }
        });

        if (error) throw error;

        // 2. Construcción manual (redundancia de seguridad)
        if (data?.url) {
            const urlObj = new URL(data.url);

            // Confirmar que prompt esté presente
            if (!urlObj.searchParams.has('prompt') || !urlObj.searchParams.get('prompt').includes('select_account')) {
                urlObj.searchParams.set('prompt', 'consent select_account');
            }
            // Asegurar access_type
            if (!urlObj.searchParams.has('access_type')) {
                urlObj.searchParams.set('access_type', 'offline');
            }

            console.log("Redirecting to (final):", urlObj.toString());
            window.location.href = urlObj.toString();
        } else {
            throw new Error('No se pudo generar la URL de autenticación.');
        }

        return data;
    },

    logout: async () => {
        console.log("Ejecutando Cierre Forzado de Sesión (v4 - Email Revocation)...");

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

        // 1b. Revocación de Permisos por Email (Cliente - GSI)
        // Esto es CRÍTICO si el token falló o no existe.
        if (userEmail && window.google?.accounts?.id) {
            console.log(`Revocando permisos GSI para: ${userEmail}`);
            window.google.accounts.id.revoke(userEmail, done => {
                console.log('Revocation complete for email ' + userEmail);
            });
        }

        // 1c. Disable AutoSelect
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
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
