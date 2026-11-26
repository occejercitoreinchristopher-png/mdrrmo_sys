import { Link } from '@inertiajs/react';
import { ArrowRight, Smartphone, PhoneCall } from 'lucide-react';
import { login } from '@/routes';

export default function CallToAction() {
    const loginUrl = login ? login() : '/login';

    return (
        <section className="relative py-20 md:py-28 lg:py-32 border-t border-slate-800/80 bg-[#060B15] overflow-hidden">
            {/* Subtle Ambient Lighting Accents */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/[0.08] rounded-full blur-[140px] pointer-events-none -z-0" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-indigo-600/[0.06] rounded-full blur-[120px] pointer-events-none -z-0" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                {/* Main Heading */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                    Ready to Access the MDRRMO Emergency System?
                </h2>

                {/* Supporting Description */}
                <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                    Coordinate pre-hospital dispatch, manage emergency ambulances, and safeguard every citizen across the Municipality of Opol.
                </p>

                {/* Action Buttons: Horizontally Aligned */}
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href={loginUrl}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 border border-blue-400/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 text-center"
                    >
                        <span>Access Emergency System</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                    </Link>

                    <a
                        href="#mobile-app"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm sm:text-base font-bold text-slate-200 hover:text-white bg-[#0D1424] hover:bg-[#131D33] border border-slate-700/80 hover:border-slate-600 transition-all duration-200 shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 text-center"
                    >
                        <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>Explore OpolResQ App</span>
                    </a>
                </div>

                {/* Emergency Contact Information with Subtle Divider */}
                <div className="mt-12 sm:mt-14 pt-8 border-t border-slate-800/80 max-w-xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-400">
                    <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>For immediate life-threatening medical emergencies, call MDRRMO Opol:</span>
                    <a href="tel:09670610573" className="font-extrabold text-rose-400 hover:underline">
                        0967-061-0573
                    </a>
                </div>
            </div>
        </section>
    );
}
