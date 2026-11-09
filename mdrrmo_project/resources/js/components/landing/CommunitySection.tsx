import { useState } from 'react';
import { MapPin, Building2, Shield, HeartHandshake, PhoneCall, Clock, CheckCircle2 } from 'lucide-react';

const stats = [
    { label: 'Barangays Covered', value: '14', desc: 'Complete municipal coverage across Opol' },
    { label: 'EOC Readiness', value: '24/7/365', desc: 'Continuous emergency command standby' },
    { label: 'Ambulance Fleet', value: '6 Vehicles', desc: 'Type 1 & 2 pre-hospital medical units' },
    { label: 'Response Standard', value: '< 5 Mins', desc: 'Rapid priority mobilization goal' },
];

const allBarangays = [
    { name: 'Poblacion', sector: 'Coastal', responseTime: '2–3 mins', status: 'Central Base' },
    { name: 'Barra', sector: 'Coastal', responseTime: '3–4 mins', status: 'Substation Monitored' },
    { name: 'Bonbon', sector: 'Coastal', responseTime: '4–5 mins', status: 'Direct Highway Access' },
    { name: 'Luyong Bonbon', sector: 'Coastal', responseTime: '4–5 mins', status: 'Coastal Access' },
    { name: 'Igpit', sector: 'Highway', responseTime: '3–4 mins', status: 'Highway Outpost' },
    { name: 'Taboc', sector: 'Highway', responseTime: '4–5 mins', status: 'Highway Outpost' },
    { name: 'Malanang', sector: 'Interior', responseTime: '5–7 mins', status: 'Interior Sector' },
    { name: 'Patag', sector: 'Interior', responseTime: '6–8 mins', status: 'Interior Sector' },
    { name: 'Nangcaon', sector: 'Interior', responseTime: '7–9 mins', status: 'Interior Sector' },
    { name: 'Awang', sector: 'Upland', responseTime: '8–11 mins', status: '4x4 Rescue Unit' },
    { name: 'Bagocboc', sector: 'Upland', responseTime: '9–12 mins', status: '4x4 Rescue Unit' },
    { name: 'Cauyonan', sector: 'Upland', responseTime: '10–14 mins', status: '4x4 Rescue Unit' },
    { name: 'Limonda', sector: 'Upland', responseTime: '12–16 mins', status: '4x4 Rescue Unit' },
    { name: 'Tingalan', sector: 'Upland', responseTime: '12–16 mins', status: '4x4 Rescue Unit' },
];

export default function CommunitySection() {
    const [selectedSector, setSelectedSector] = useState<'all' | 'Coastal' | 'Highway' | 'Interior' | 'Upland'>('all');

    const filteredBarangays = selectedSector === 'all'
        ? allBarangays
        : allBarangays.filter((b) => b.sector === selectedSector);

    return (
        <section id="community" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#070B14] overflow-hidden">
            {/* Subtle Abstract Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    {/* Left Column: Narrative & Covered Barangays */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Municipal Coverage & Resilience</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Serving Every Barangay Across Opol
                        </h2>

                        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                            Built specifically for the Municipality of Opol, Misamis Oriental. From coastal communities along Macajalar Bay to interior agricultural and upland hinterland barangays, the MDRRMO emergency system ensures fast, equitable medical rescue.
                        </p>

                        {/* Interactive Sector Filter */}
                        <div className="pt-2">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 mb-4">
                                {(
                                    [
                                        { id: 'all', label: 'All Barangays (14)' },
                                        { id: 'Coastal', label: 'Coastal Sector (4)' },
                                        { id: 'Highway', label: 'Highway Corridor (2)' },
                                        { id: 'Interior', label: 'Interior Sector (3)' },
                                        { id: 'Upland', label: 'Upland Sector (5)' },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setSelectedSector(tab.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            selectedSector === tab.id
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                : 'bg-[#111B2D] border border-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Barangays Chips Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {filteredBarangays.map((b) => (
                                    <div
                                        key={b.name}
                                        className="p-3 rounded-2xl bg-[#0D1424] border border-slate-800 hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white">{b.name}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                            <span>{b.status}</span>
                                            <span className="text-blue-400 font-mono font-semibold">{b.responseTime}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Key Stats Cards */}
                    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stats.map((s) => (
                            <div
                                key={s.label}
                                className="p-6 rounded-3xl bg-[#0D1424]/90 border border-slate-800 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all duration-300"
                            >
                                <span className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                                    {s.value}
                                </span>
                                <h3 className="text-sm font-bold text-slate-200 mt-2.5">
                                    {s.label}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">
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
