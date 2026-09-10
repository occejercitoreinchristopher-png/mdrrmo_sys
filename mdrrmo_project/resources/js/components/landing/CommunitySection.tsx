import { MapPin, Building2, Shield, HeartHandshake } from 'lucide-react';

const stats = [
    { label: 'Barangays Covered', value: '14', desc: 'Complete municipal coverage' },
    { label: 'Dispatch Readiness', value: '24/7', desc: 'Round-the-clock coordination' },
    { label: 'Response Fleet', value: 'Ambulance Units', desc: 'Equipped emergency response' },
    { label: 'Community Focus', value: 'Opol, MisOr', desc: 'Locally dedicated system' },
];

const barangays = [
    'Barra', 'Bonbon', 'Cauyonan', 'Igpit', 'Limonda',
    'Luyong Bonbon', 'Malanang', 'Nangcaon', 'Patag',
    'Poblacion', 'Taboc', 'Awang', 'Bagocboc', 'Tingalan'
];

export default function CommunitySection() {
    return (
        <section id="community" className="relative py-16 md:py-24 border-t border-white/5 bg-[#080d1a] overflow-hidden">
            {/* Subtle Abstract Geographic Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="opolGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-400" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#opolGrid)" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column: Narrative & Details */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Municipal Emergency Operations</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                            Serving the Community of Opol
                        </h2>

                        <p className="text-base text-slate-400 leading-relaxed">
                            Built to support emergency medical response coordination across the communities of Opol, Misamis Oriental.
                        </p>

                        <p className="text-sm text-slate-500 leading-relaxed">
                            From coastal communities along Macajalar Bay to interior agricultural barangays, the MDRRMO system ensures equitable, swift dispatch and medical assistance wherever and whenever emergencies occur.
                        </p>

                        {/* Covered Barangays Pills */}
                        <div className="pt-2">
                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                <span>14 Covered Municipal Barangays</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {barangays.map((b) => (
                                    <span
                                        key={b}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/10"
                                    >
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Key Stats Glass Cards */}
                    <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stats.map((s, idx) => (
                            <div
                                key={s.label}
                                className="p-6 rounded-2xl bg-[#0a1022]/80 border border-white/10 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all duration-300"
                            >
                                <span className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                                    {s.value}
                                </span>
                                <h3 className="text-sm font-bold text-slate-200 mt-2">
                                    {s.label}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    {s.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
