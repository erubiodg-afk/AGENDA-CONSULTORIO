import { supabase } from '../lib/supabase';

export const calendarService = {
    /**
     * Obtiene el token de proveedor (Google Access Token) de la sesión actual
     */
    async getProviderToken() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.provider_token) {
            console.warn("No hay provider_token. El usuario debe volver a iniciar sesión.");
            return null;
        }
        return session.provider_token;
    },

    /**
     * Lista eventos del calendario principal
     * @param {Date} timeMin Inicio del rango
     * @param {Date} timeMax Fin del rango
     */
    async listEvents(timeMin, timeMax) {
        const token = await this.getProviderToken();
        if (!token) throw new Error("No autenticado con Google");

        const params = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
        });

        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error fetching calendar events');
        }

        const data = await response.json();
        return data.items || [];
    },

    /**
     * Crea un evento en Google Calendar
     */
    async createEvent(eventDetails) {
        const token = await this.getProviderToken();
        if (!token) throw new Error("No autenticado con Google");

        const event = {
            summary: eventDetails.title, // Nombre del paciente / Cita
            description: eventDetails.description || '',
            start: {
                dateTime: eventDetails.start.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: eventDetails.end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            // Color id 1-11 (opcional)
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error creating event');
        }

        return await response.json();
    }
};
