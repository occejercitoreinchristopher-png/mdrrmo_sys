import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Smartphone,
} from 'lucide-react';
import { login } from '@/routes';

export default function HeroSection() {
    const loginUrl = login ? login() : '/login';

    return (
        <section id="hero" className="relative min-h-[700px] lg:min-h-[780px] pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32 overflow-hidden bg-[#070B14] flex items-center">
            {/* Ambient Background Glow on the left */}
            <div className="absolute top-0 left-0 w-full max-w-4xl h-[650px] pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-20 left-10 w-[550px] h-[550px] bg-blue-600/[0.12] rounded-full blur-[140px]" />
                <div className="absolute top-40 left-1/4 w-[450px] h-[450px] bg-sky-500/[0.08] rounded-full blur-[130px]" />
            </div>

            {/* Seamless Cinematic Rescue Fleet Image on the Right */}
            <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[62%] xl:w-[60%] h-full pointer-events-none select-none overflow-hidden z-0">
                <div className="relative w-full h-full">
                    {/* The Real Opol Rescue Fleet Photo */}
                    <img
                        src="/images/landing/opol-rescue-fleet.jpg"
                        alt="MDRRMO Opol Emergency Rescue Fleet"
                        className="w-full h-full object-cover object-[center_35%] lg:object-[center_30%] transform scale-100 animate-hero-breathe"
                    />

                    {/* Smooth Horizontal Feathered Mask from Dark Left to Vibrant Right */}
                    <div className="absolute inset-y-0 left-0 w-full sm:w-[60%] lg:w-[48%] bg-gradient-to-r from-[#070B14] via-[#070B14]/85 to-transparent" />

                    {/* Top Vignette Fade into Header */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#070B14] via-[#070B14]/50 to-transparent" />

                    {/* Bottom Vignette Fade into Section Bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070B14] via-[#070B14]/70 to-transparent" />
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl space-y-7 text-left">
                    {/* Main Headline (3 Lines matching user reference design) */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.06]">
                        Every Second<br />
                        Matters.<br />
                        <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                            Every Life Counts.
                        </span>
                    </h1>

                    {/* Supporting Narrative */}
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
                        The official emergency response and ambulance dispatch platform for the Municipality of Opol. Coordinating 24/7 hotline triage, rapid ambulance deployment, and live GPS tracking for citizen safety.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-1">
                        <Link
                            href={loginUrl}
                            className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/45 border border-blue-400/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2.5"
                        >
                            <span>Access Emergency System</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <a
                            href="#mobile-app"
                            className="w-full sm:w-auto px-7 py-4 text-sm font-bold text-slate-200 hover:text-white bg-[#0F172A]/85 hover:bg-[#1E293B] border border-slate-700/80 hover:border-slate-600 rounded-2xl backdrop-blur-md transition-all text-center flex items-center justify-center gap-2.5 shadow-sm"
                        >
                            <Smartphone className="w-4 h-4 text-sky-400" />
                            <span>Explore OpolResq App</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
