import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import esES from 'date-fns/locale/es';
import { addMinutes, parseISO, isSameDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, Clock, Search, User, Phone, ChevronRight, Calculator } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { AppointmentModal } from '../components/agenda/AppointmentModal';

const locales = {
    'es': esES,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

import { calendarService } from '../services/calendar.service';
import { useAuth } from '../context/AuthContext';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// ... (locales and localizer remain)

export function Agenda() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState(Views.WEEK);
    const [date, setDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Fetch Events
    const fetchEvents = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Determine range based on view
            let start, end;
            if (view === Views.MONTH) {
                start = startOfMonth(date);
                end = endOfMonth(date);
            } else {
                start = startOfWeek(date, { locale: esES }); // Ajustar inicio semana
                end = endOfWeek(date, { locale: esES });
            }
            // Buffer helper: fetch +/- 1 month roughly to be safe or just current view
            // For simplicity, fetching a wide range around current date 
            const timeMin = addDays(start, -7);
            const timeMax = addDays(end, 7);

            const googleEvents = await calendarService.listEvents(timeMin, timeMax);

            const mappedEvents = googleEvents.map(ev => ({
                id: ev.id,
                title: ev.summary || '(Sin título)',
                start: new Date(ev.start.dateTime || ev.start.date),
                end: new Date(ev.end.dateTime || ev.end.date),
                notes: ev.description,
                // Attempt to parse phone from description if structured, else undefined
            }));
            setEvents(mappedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
            // alert("Error cargando calendario. Asegúrate de haber dado permisos.");
        } finally {
            setLoading(false);
        }
    };

    // Reload when date/view changes
    React.useEffect(() => {
        fetchEvents();
    }, [date, view, user]);

    const handleSelectSlot = ({ start }) => {
        setSelectedSlot(start);
        setSelectedEvent(null);
        setIsDrawerOpen(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setSelectedSlot(null);
        setIsDrawerOpen(true);
    };

    const handleCreateNew = () => {
        const now = new Date();
        setSelectedSlot(now);
        setSelectedEvent(null);
        setIsDrawerOpen(true);
    }

    const handleSave = async (data) => {
        const startDateTime = parseISO(`${data.date}T${data.time}`);
        const endDateTime = addMinutes(startDateTime, parseInt(data.duration));

        setLoading(true);
        try {
            const newEventDetails = {
                title: `${data.treatment} - ${data.patient}`,
                description: `Tel: ${data.phone}\nNotas: ${data.notes || ''}`,
                start: startDateTime,
                end: endDateTime,
            };

            await calendarService.createEvent(newEventDetails);
            await fetchEvents(); // Refresh
            setIsDrawerOpen(false);
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Error al guardar en Google Calendar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        if (confirm('¿Eliminar cita?')) {
            setEvents(events.filter(e => e.id !== id));
            setIsDrawerOpen(false);
        }
    };

    // Filter Logic
    const filteredEventsForList = useMemo(() => {
        if (!searchTerm) {
            return events.filter(e => e.start > new Date()).sort((a, b) => a.start - b.start).slice(0, 5);
        }
        return events.filter(e =>
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.phone && e.phone.includes(searchTerm))
        ).sort((a, b) => a.start - b.start);
    }, [events, searchTerm]);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return events.filter(e =>
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.phone && e.phone.includes(searchTerm))
        );
    }, [events, searchTerm]);

    const todayEvents = events.filter(e => isSameDay(e.start, new Date())).sort((a, b) => a.start - b.start);
    const nextAppt = todayEvents.length > 0 ? todayEvents.find(e => e.start > new Date()) || todayEvents[todayEvents.length - 1] : null;

    // Custom Components for Calendar
    const components = useMemo(() => ({
        header: ({ date, label }) => {
            const isToday = isSameDay(date, new Date());
            return (
                <div className={cn(
                    "py-2 font-medium transition-colors",
                    isToday ? "bg-brand-purple/10 text-brand-dark rounded-t-md" : "text-slate-600"
                )}>
                    {label}
                </div>
            );
        },
        event: ({ event }) => (
            <div className="flex flex-col h-full justify-center px-1 py-0.5 overflow-hidden leading-tight">
                <div className="flex items-center gap-1 text-[10px] opacity-90 font-medium">
                    <Clock className="w-3 h-3" />
                    {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </div>
                <div className="font-semibold text-xs truncate mt-0.5">
                    {event.title}
                </div>
            </div>
        )
    }), []);

    return (
        <div className="h-full flex flex-col gap-4 relative">
            {/* Top Bar with Search & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800 shrink-0">Agenda</h1>

                <div className="flex-1 max-w-xl w-full relative">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-brand-purple transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por teléfono o nombre..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Quick Search Dropdown */}
                    {searchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p className="text-sm text-slate-500 mb-2">Sin resultados</p>
                                    <Button size="sm" onClick={handleCreateNew}>Crear nueva cita</Button>
                                </div>
                            ) : (
                                searchResults.map(evt => (
                                    <div
                                        key={evt.id}
                                        className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            handleSelectEvent(evt);
                                            setSearchTerm(''); // Clear search on select
                                        }}
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{evt.title}</p>
                                            <p className="text-xs text-slate-500">{format(evt.start, 'dd MMM yyyy - HH:mm')}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="hidden md:block">
                    <Button onClick={handleCreateNew} className="bg-brand-purple hover:bg-brand-dark shadow-md">
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva cita
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 h-[calc(100vh-140px)]">
                {/* Desktop Calendar View */}
                <div className="hidden md:block flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        defaultView={Views.WEEK}
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        step={30}
                        timeslots={1}
                        min={new Date(0, 0, 0, 8, 0, 0)}
                        max={new Date(0, 0, 0, 20, 0, 0)}
                        culture="es"
                        formats={{
                            dayFormat: (date) => format(date, 'eee dd', { locale: esES }),
                            weekdayFormat: (date) => format(date, 'eee', { locale: esES }),
                        }}
                        components={components} // Use custom components
                        dayLayoutAlgorithm="no-overlap"
                        messages={{
                            next: "Siguiente",
                            previous: "Anterior",
                            today: "Hoy",
                            month: "Mes",
                            week: "Semana",
                            day: "Día",
                            agenda: "Agenda",
                            date: "Fecha",
                            time: "Hora",
                            event: "Evento",
                            noEventsInRange: "No hay citas en este rango",
                            showMore: total => `+ Ver más (${total})`
                        }}
                    />
                </div>

                {/* Mobile List View */}
                <div className="md:hidden flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Mobile Date Navigator */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => setDate(addMinutes(date, -24 * 60))}>
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </Button>
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-slate-800 capitalize">
                                {format(date, 'EEEE d MMM', { locale: esES })}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {events.filter(e => isSameDay(e.start, date)).length} citas hoy
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setDate(addMinutes(date, 24 * 60))}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Mobile Event List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {events.filter(e => isSameDay(e.start, date)).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">No hay citas para este día</p>
                                <Button size="sm" variant="outline" className="mt-4" onClick={handleCreateNew}>
                                    Agendar cita
                                </Button>
                            </div>
                        ) : (
                            events.filter(e => isSameDay(e.start, date))
                                .sort((a, b) => a.start - b.start)
                                .map(evt => (
                                    <div
                                        key={evt.id}
                                        onClick={() => handleSelectEvent(evt)}
                                        className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm active:scale-[0.98] transition-transform flex gap-3"
                                    >
                                        <div className="flex flex-col items-center justify-center px-3 bg-brand-purple/5 rounded border border-brand-purple/10 min-w-[60px]">
                                            <span className="text-sm font-bold text-brand-purple">{format(evt.start, 'HH:mm')}</span>
                                            <span className="text-[10px] text-slate-400">{format(evt.end, 'HH:mm')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <h3 className="font-semibold text-slate-800 truncate text-base">{evt.title.split(' - ')[1] || evt.title}</h3>
                                            <p className="text-sm text-slate-500 truncate">{evt.title.split(' - ')[0]}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {evt.phone && (
                                                    <a href={`tel:${evt.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                                                        <Phone className="w-3 h-3" />
                                                        Llamar
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center text-slate-300">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Side Panel for Lists */}
                <div className="hidden md:flex w-72 flex-col gap-4">
                    {/* Today Block */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Hoy
                            </h3>
                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{todayEvents.length} citas</span>
                        </div>

                        {todayEvents.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-slate-400 mb-2 italic">Agenda libre hoy</p>
                                <Button variant="outline" size="sm" className="w-full justify-center" onClick={handleCreateNew}>Agendar ahora</Button>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-brand-purple/5 to-transparent border border-brand-purple/10 rounded-lg p-3">
                                {nextAppt ? (
                                    <>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider bg-brand-purple/10 px-1.5 py-0.5 rounded">Próxima</span>
                                            <span className="text-sm font-bold text-slate-800">{format(nextAppt.start, 'h:mm a')}</span>
                                        </div>
                                        <div className="font-medium text-slate-900 text-sm truncate mb-1" title={nextAppt.title}>
                                            {nextAppt.title}
                                        </div>
                                        <Button size="sm" className="w-full mt-2 bg-white border border-slate-200 text-slate-700 hover:bg-brand-purple hover:text-white hover:border-transparent transition-all h-8 text-xs" onClick={() => handleSelectEvent(nextAppt)}>
                                            Ver detalle
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500 italic text-center py-2">Todas las citas completadas.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Block */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col min-h-0">
                        <h3 className="font-semibold text-slate-700 mb-3 sticky top-0 bg-white z-10 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-brand-mint" />
                            {searchTerm ? 'Resultados' : 'Próximas'}
                        </h3>

                        <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
                            {filteredEventsForList.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No hay citas {searchTerm ? 'que coincidan' : 'programadas'}</p>}

                            {filteredEventsForList.map(evt => (
                                <div
                                    key={evt.id}
                                    className="p-2.5 rounded-lg border border-slate-100 hover:border-brand-purple/30 hover:bg-brand-purple/5 cursor-pointer group transition-all"
                                    onClick={() => handleSelectEvent(evt)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 text-center bg-slate-50 group-hover:bg-white rounded p-1 shrink-0 transition-colors border border-slate-100">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase">{format(evt.start, 'MMM')}</span>
                                            <span className="block text-base font-bold text-slate-700 leading-none">{format(evt.start, 'dd')}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-slate-800 truncate text-sm">{evt.title.split(' - ')[1] || evt.title}</p>
                                            <p className="text-xs text-slate-500 truncate">{evt.title.split(' - ')[0]}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-bold text-brand-purple bg-brand-purple/5 px-1.5 py-0.5 rounded">{format(evt.start, 'HH:mm')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile FAB */}
            <button
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-purple text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-dark transition-colors z-50 active:scale-95"
                onClick={handleCreateNew}
            >
                <Plus className="w-8 h-8" />
            </button>

            <AppointmentModal
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                initialDate={selectedSlot}
                initialEvent={selectedEvent}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
}
