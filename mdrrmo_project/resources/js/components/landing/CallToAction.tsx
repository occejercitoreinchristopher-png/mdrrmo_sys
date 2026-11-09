import { Link } from '@inertiajs/react';
import { ArrowRight, ShieldAlert, Smartphone, PhoneCall } from 'lucide-react';
import { login } from '@/routes';

export default function CallToAction() {
    const loginUrl = login ? login() : '/login';

    return (
        <section className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#060B15] overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-0" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="rounded-[36px] bg-gradient-to-b from-[#111B2D] to-[#0A1022] border border-slate-700/80 p-8 sm:p-14 md:p-16 text-center backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                    {/* Top Emergency Glow Accent */}
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-gradient-to-r from-blue-500/20 via-sky-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 border border-blue-400/30 mb-6">
                        <ShieldAlert className="w-8 h-8" />
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto leading-tight">
                        Ready to Access the MDRRMO Emergency System?
                    </h2>

                    <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
                        Coordinate pre-hospital dispatch, manage emergency ambulances, and safeguard every citizen across the Municipality of Opol.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={loginUrl}
                            className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/30 transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>Access Emergency System</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#mobile-app"
                            className="w-full sm:w-auto px-7 py-4 text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl backdrop-blur-md transition-all flex items-center justify-center gap-2.5 shadow-sm"
                        >
                            <Smartphone className="w-4 h-4 text-sky-400" />
                            <span>Explore Resident Mobile App</span>
                        </a>
                    </div>

                    {/* Hotline quick call */}
                    <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                        <span>For immediate life-threatening medical emergencies, dial:</span>
                        <a href="tel:911" className="font-extrabold text-rose-400 hover:underline">911</a>
                        <span className="text-slate-600">or</span>
                        <a href="tel:09177076765" className="font-bold text-slate-300 hover:underline">0917-707-6765</a>
                    </div>
                </div>
            </div>
        </section>
    );
}
