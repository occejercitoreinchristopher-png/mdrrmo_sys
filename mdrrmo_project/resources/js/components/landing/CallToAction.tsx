import { Link } from '@inertiajs/react';
import { ArrowRight, ShieldAlert, Smartphone } from 'lucide-react';
import { login } from '@/routes';

export default function CallToAction() {
    const loginUrl = login ? login() : '/login';

    return (
        <section className="relative py-16 md:py-24 border-t border-white/5 overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/15 p-8 sm:p-12 md:p-16 text-center backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                    {/* Top Emergency Glow Accent */}
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-r from-rose-500/20 to-blue-500/20 rounded-full blur-2xl" />

                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30 mb-6">
                        <ShieldAlert className="w-7 h-7" />
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight max-w-2xl mx-auto">
                        Ready to access the MDRRMO system?
                    </h2>

                    <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Access the emergency management platform and help keep emergency response operations coordinated and efficient.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={loginUrl}
                            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>Login to System</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#mobile-app"
                            className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-slate-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
                        >
                            <Smartphone className="w-4 h-4 text-sky-400" />
                            <span>Resident Mobile App</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
