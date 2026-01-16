import React from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export function AppLayout({ children, onLogout }) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false); // Default closed on mobile

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-full shadow-2xl md:shadow-none
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onLogout={onLogout} />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                {/* Topbar Mobile Toggle */}
                <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <span className="font-bold text-slate-800">DentOffice</span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
