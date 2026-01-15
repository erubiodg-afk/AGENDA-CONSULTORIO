import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { format, addMinutes, parse, differenceInMinutes, isValid, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { Calendar as CalendarIcon, Clock, User, Phone, FileText, AlertCircle, Trash2 } from 'lucide-react';

export function AppointmentModal({ isOpen, onClose, initialDate, initialEvent, onSave, onDelete }) {
    const isEditing = !!initialEvent;

    // Form State
    const [formData, setFormData] = useState({
        patient: '',
        phone: '',
        treatment: '', // Motivo
        notes: '',
        date: '',
        startTime: '09:00',
        endTime: '09:45',
        duration: 45
    });

    const [errors, setErrors] = useState({});

    // Initialize State
    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (initialEvent) {
                // Edit Mode
                const start = initialEvent.start;
                const end = initialEvent.end;
                const duration = differenceInMinutes(end, start);

                const titleParts = initialEvent.title.split(' - ');
                const treatment = titleParts[0]?.trim() || '';
                const patient = titleParts[1]?.trim() || initialEvent.title;

                setFormData({
                    patient: patient,
                    phone: initialEvent.phone || '',
                    treatment: treatment,
                    notes: initialEvent.notes || '',
                    date: format(start, 'yyyy-MM-dd'),
                    startTime: format(start, 'HH:mm'),
                    endTime: format(end, 'HH:mm'),
                    duration: duration
                });
            } else {
                // New Mode
                const date = initialDate || new Date();
                const now = new Date();
                // Round to next 15 min if "Agendar ahora" (no initial slot)
                const startHour = initialDate ? format(initialDate, 'HH:mm') : "09:00";

                setFormData({
                    patient: '',
                    phone: '',
                    treatment: '',
                    notes: '',
                    date: format(date, 'yyyy-MM-dd'),
                    startTime: startHour,
                    endTime: format(addMinutes(parse(startHour, 'HH:mm', new Date()), 45), 'HH:mm'),
                    duration: 45
                });
            }
        }
    }, [isOpen, initialDate, initialEvent]);

    // Update EndTime when Duration changes
    const updateDuration = (mins) => {
        const minutes = parseInt(mins);
        if (isNaN(minutes)) return;

        try {
            const start = parse(formData.startTime, 'HH:mm', new Date());
            const end = addMinutes(start, minutes);
            setFormData(prev => ({
                ...prev,
                duration: minutes,
                endTime: format(end, 'HH:mm')
            }));
        } catch (e) { }
    };

    // Update Duration when EndTime changes
    const handleEndTimeChange = (e) => {
        const newEndTime = e.target.value;
        setFormData(prev => ({ ...prev, endTime: newEndTime }));

        try {
            const start = parse(formData.startTime, 'HH:mm', new Date());
            const end = parse(newEndTime, 'HH:mm', new Date());

            if (isValid(start) && isValid(end)) {
                let diff = differenceInMinutes(end, start);
                if (diff < 0) diff += 24 * 60; // Handle overnight? (Simple version: just allow it)
                setFormData(prev => ({ ...prev, endTime: newEndTime, duration: diff }));
            }
        } catch (e) { }
    };

    // Update EndTime when StartTime changes (keep duration constant)
    const handleStartTimeChange = (e) => {
        const newStartTime = e.target.value;
        try {
            const start = parse(newStartTime, 'HH:mm', new Date());
            const end = addMinutes(start, formData.duration);
            setFormData(prev => ({
                ...prev,
                startTime: newStartTime,
                endTime: format(end, 'HH:mm')
            }));
        } catch (e) {
            setFormData(prev => ({ ...prev, startTime: newStartTime }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.patient.trim()) newErrors.patient = 'El nombre es obligatorio';
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
        if (!formData.date) newErrors.date = 'Fecha requerida';
        if (!formData.startTime) newErrors.startTime = 'Hora requerida';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        // Construct full Date objects
        const startDateTime = parse(`${formData.date}T${formData.startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
        const endDateTime = parse(`${formData.date}T${formData.endTime}`, "yyyy-MM-dd'T'HH:mm", new Date());

        onSave({
            id: initialEvent?.id,
            title: `${formData.treatment || 'Consulta'} - ${formData.patient}`,
            patient: formData.patient,
            treatment: formData.treatment || 'Consulta',
            phone: formData.phone,
            notes: formData.notes,
            start: startDateTime,
            end: endDateTime
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Cita" : "Nueva Cita"}
            footer={
                <>
                    {/* Delete Icon Button (Left aligned) if editing */}
                    {isEditing && (
                        <div className="mr-auto">
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50 hover:text-red-600 px-3"
                                onClick={() => {
                                    if (confirm('¿Seguro que deseas eliminar esta cita?')) onDelete(initialEvent.id);
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                        </div>
                    )}

                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="bg-brand-purple hover:bg-brand-dark text-white shadow-md">
                        Guardar
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* 1) Encabezado del Evento */}
                <div className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                className={cn(
                                    "w-full pl-11 rounded-lg border pr-3 py-2 text-sm transition-all shadow-sm placeholder:text-slate-400",
                                    errors.patient
                                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                                        : "border-slate-300 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20"
                                )}
                                placeholder="Nombre completo..."
                                value={formData.patient}
                                onChange={e => setFormData({ ...formData, patient: e.target.value })}
                                autoFocus
                            />
                        </div>
                        {errors.patient && <p className="text-xs text-red-500 mt-1 ml-1">{errors.patient}</p>}
                    </div>

                    {/* Teléfono */}
                    <div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="tel"
                                className={cn(
                                    "w-full pl-11 rounded-lg border pr-3 py-2 text-sm transition-all shadow-sm placeholder:text-slate-400",
                                    errors.phone
                                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                                        : "border-slate-300 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20"
                                )}
                                placeholder="999 999 999"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
                    </div>

                    {/* Motivo (Opcional) */}
                    <div>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                className="w-full pl-11 rounded-lg border border-slate-300 pr-3 py-2 text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20 transition-all shadow-sm placeholder:text-slate-400"
                                placeholder="Ej: Limpieza, Ortodoncia... (Opcional)"
                                value={formData.treatment}
                                onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* 2) Bloque de Horario (Google Calendar Style) */}
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</label>

                    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        {/* Fecha */}
                        <div className="md:col-span-3 relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                className={cn(
                                    "w-full pl-11 rounded-lg border pr-3 py-2 text-sm transition-all shadow-sm",
                                    errors.date ? "border-red-500" : "border-slate-300 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20"
                                )}
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        {/* Hora Inicio */}
                        <div className="md:col-span-2 relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="time"
                                className="w-full pl-11 rounded-lg border border-slate-300 pr-3 py-2 text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20 transition-all shadow-sm"
                                value={formData.startTime}
                                onChange={handleStartTimeChange}
                            />
                        </div>

                        {/* Hora Fin */}
                        <div className="md:col-span-2 relative flex items-center gap-2">
                            {/* Separator */}
                            <span className="text-slate-400 text-sm hidden md:block">–</span>
                            <input
                                type="time"
                                className="w-full pl-2 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20 transition-all shadow-sm text-center"
                                value={formData.endTime}
                                onChange={handleEndTimeChange}
                            />
                        </div>
                    </div>

                    {/* Duration Chips */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-slate-500 font-medium mr-1">Duración:</span>
                        {[15, 30, 45, 60, 90].map((mins) => (
                            <button
                                key={mins}
                                type="button"
                                onClick={() => updateDuration(mins)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                                    formData.duration === mins
                                        ? "bg-brand-purple text-white border-brand-purple shadow-sm ring-1 ring-brand-purple/20"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-brand-purple/50 hover:bg-slate-50"
                                )}
                            >
                                {mins} min
                            </button>
                        ))}
                        <span className="text-xs text-slate-400 ml-auto hidden md:block group relative cursor-help">
                            {formData.duration} min
                            <span className="absolute bottom-full right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded mb-1 hidden group-hover:block whitespace-nowrap">
                                Calculado automáticamente
                            </span>
                        </span>
                    </div>
                </div>

                {/* Notas (Opcional y menos prominente) */}
                <div>
                    <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20 transition-all shadow-sm min-h-[60px] resize-none placeholder:text-slate-400"
                        placeholder="Añadir notas o detalles adicionales..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>
            </div>
        </Modal>
    );
}
