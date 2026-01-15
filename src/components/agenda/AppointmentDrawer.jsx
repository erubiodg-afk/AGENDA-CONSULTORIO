import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { format, addMinutes, parse } from 'date-fns';
import { cn } from '../../lib/utils';
import { Calendar as CalendarIcon, Clock, User, Phone, FileText, AlertCircle } from 'lucide-react';

export function AppointmentDrawer({ isOpen, onClose, initialDate, initialEvent, onSave, onDelete }) {
    const isEditing = !!initialEvent;
    const [formData, setFormData] = useState({
        phone: '',
        patient: '',
        treatment: 'Consulta',
        notes: '',
        date: '',
        time: '',
        duration: '45'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (initialEvent) {
                setFormData({
                    phone: initialEvent.phone || '',
                    patient: initialEvent.title.split(' - ')[1]?.trim() || initialEvent.title,
                    treatment: initialEvent.title.split(' - ')[0]?.trim() || 'Consulta',
                    notes: initialEvent.notes || '',
                    date: format(initialEvent.start, 'yyyy-MM-dd'),
                    time: format(initialEvent.start, 'HH:mm'),
                    duration: String((initialEvent.end - initialEvent.start) / 60000)
                });
            } else if (initialDate) {
                setFormData({
                    phone: '',
                    patient: '',
                    treatment: 'Consulta',
                    notes: '',
                    date: format(initialDate, 'yyyy-MM-dd'),
                    time: format(initialDate, 'HH:mm'),
                    duration: '45'
                });
            }
        }
    }, [isOpen, initialDate, initialEvent]);

    const validate = () => {
        const newErrors = {};
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
        if (!formData.patient.trim()) newErrors.patient = 'El nombre es obligatorio';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            ...formData,
            id: initialEvent?.id,
        });
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Cita" : "Nueva Cita"}
            footer={
                <>
                    {isEditing && (
                        <Button variant="danger" className="mr-auto" onClick={() => onDelete(initialEvent.id)}>
                            Cancelar
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="bg-brand-purple hover:bg-brand-dark text-white">
                        Guardar
                    </Button>
                </>
            }
        >
            <form className="space-y-5" onSubmit={handleSubmit}>

                {/* Phone & Patient (Priority) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="tel"
                            className={cn(
                                "w-full pl-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all",
                                errors.phone ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-brand-purple"
                            )}
                            placeholder="999 999 999"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            autoFocus
                        />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Paciente <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            className={cn(
                                "w-full pl-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all",
                                errors.patient ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-brand-purple"
                            )}
                            placeholder="Nombre completo..."
                            value={formData.patient}
                            onChange={e => setFormData({ ...formData, patient: e.target.value })}
                        />
                    </div>
                    {errors.patient && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.patient}</p>}
                </div>

                <div className="border-t border-slate-100 my-4" />

                {/* Details */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                    <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        value={formData.treatment}
                        onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                    >
                        <option value="Consulta">Consulta General</option>
                        <option value="Limpieza">Limpieza Dental</option>
                        <option value="Ortodoncia">Ortodoncia</option>
                        <option value="Blanqueamiento">Blanqueamiento</option>
                        <option value="Urgencia">Urgencia</option>
                        <option value="Cirugía">Cirugía</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas Internas (Opcional)</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        <textarea
                            className="w-full pl-10 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20 min-h-[80px]"
                            placeholder="Detalles clínicos o preferencias..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                {/* Date & Time Grid */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Horario</label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                className="w-full pl-11 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hora inicio</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="time"
                                className="w-full pl-11 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700">Duración (min)</label>
                            {formData.time && formData.duration && (
                                <span className="text-xs font-medium text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded">
                                    Termina: {(() => {
                                        try {
                                            const start = parse(formData.time, 'HH:mm', new Date());
                                            const end = addMinutes(start, parseInt(formData.duration) || 0);
                                            return format(end, 'HH:mm');
                                        } catch (e) { return '--:--'; }
                                    })()}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3 items-center">
                            <input
                                type="number"
                                min="5"
                                step="5"
                                className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none font-medium"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                            />
                            <div className="flex gap-2 flex-1 flex-wrap">
                                {[30, 45, 60, 90].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, duration: String(mins) })}
                                        className={cn(
                                            "px-3 py-1.5 text-xs border rounded-full transition-all",
                                            formData.duration === String(mins)
                                                ? "bg-brand-purple text-white border-brand-purple"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-brand-purple/50 hover:bg-slate-50"
                                        )}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </Drawer>
    );
}
