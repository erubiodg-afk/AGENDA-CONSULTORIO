import React from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export function AppLayout({ children, onLogout }) {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50">
            <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block h-full`}>
                <Sidebar onLogout={onLogout} />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Topbar Mobile Toggle */}
                <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <span className="font-bold text-slate-800">DentOffice</span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
