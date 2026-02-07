/**
 * Servicio de Base de Datos (Supabase)
 */
import { supabase } from '../lib/supabase';

export const dbService = {
    // Verificar si un email está autorizado y obtener su rol
    checkUserAuthorized: async (email) => {
        try {
            const { data, error } = await supabase
                .from('usuarios_autorizados')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null; // No autorizado
            if (!data.activo) return null; // Inactivo

            return data;
        } catch (error) {
            console.error('Error verificando autorización:', error);
            throw error;
        }
    },

    // Métodos genéricos para otras colecciones (citas, pacientes, etc.)
    collection: (tableName) => {
        return {
            get: async () => {
                const { data, error } = await supabase.from(tableName).select('*');
                if (error) throw error;
                return data;
            },
            add: async (item) => {
                const { data, error } = await supabase.from(tableName).insert(item).select().single();
                if (error) throw error;
                return data;
            },
            update: async (id, updates) => {
                const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
                if (error) throw error;
                return data;
            },
            delete: async (id) => {
                const { error } = await supabase.from(tableName).delete().eq('id', id);
                if (error) throw error;
                return true;
            }
        };
    }
};
