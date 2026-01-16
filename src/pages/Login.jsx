import React from 'react';
import { Button } from '../components/ui/Button';

export function Login({ onLogin }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Background Decor - Subtle shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-mint/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Card */}
            <div className="w-full max-w-[420px] md:max-w-[420px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-10 relative z-10 flex flex-col items-center mx-4 md:mx-0">

                {/* Isotype */}
                <div className="w-16 h-16 md:w-20 md:h-20 mb-6">
                    <img
                        src="/logo-iso.jpg"
                        alt="Isotipo"
                        className="w-full h-full object-contain mix-blend-multiply"
                    />
                </div>

                {/* Brand Text */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-dark tracking-tight">
                        Dra. Claudia Franco
                    </h1>

                </div>

                {/* Value Prop */}
                <p className="text-slate-500 text-center text-sm md:text-base mb-8 leading-relaxed">
                    Gestiona las citas del consultorio de forma segura y eficiente.
                </p>

                {/* Google Button */}
                <div className="w-full space-y-4">
                    <Button
                        className="w-full h-12 md:h-14 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow transition-all duration-200 rounded-xl group relative overflow-hidden"
                        onClick={onLogin}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google"
                                className="w-5 h-5 md:w-6 md:h-6 shrink-0"
                            />
                            <span className="font-medium text-base">Continuar con Google</span>
                        </div>
                        {/* Subtle splash effect on hover */}
                        <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </Button>

                    {/* Footer Note Removed */}
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-4 text-center w-full">
                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">DentOffice System</p>
            </div>
        </div>
    );
}
