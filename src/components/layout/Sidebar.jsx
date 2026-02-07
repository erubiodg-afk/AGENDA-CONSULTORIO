import React from 'react';
import { Calendar, Users, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar({ className, onLogout }) {
    const navItems = [
        { icon: Calendar, label: 'Agenda', active: true },
        { icon: Users, label: 'Pacientes', active: false },
        { icon: Settings, label: 'Ajustes', active: false },
    ];

    return (
        <aside className={cn("w-64 bg-white border-r border-slate-200 flex flex-col h-full", className)}>
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <img src="/logo-iso.jpg" alt="Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
                    <div>
                        <h1 className="text-sm font-bold text-slate-800 leading-tight">
                            Dra. Claudia Franco
                        </h1>

                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        className={cn(
                            "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            item.active
                                ? "bg-primary-50 text-primary-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        DR
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">Dr. Franco</p>
                        <p className="text-xs text-slate-500 truncate">admin@clinic.com</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        console.log("Sidebar: Logout clicked");
                        if (onLogout) onLogout();
                        else console.error("Sidebar: onLogout prop is missing!");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
