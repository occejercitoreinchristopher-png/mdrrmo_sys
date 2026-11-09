import { useState } from 'react';
import {
    Activity,
    Ambulance,
    Radio,
    MapPin,
    Navigation,
    Clock,
    ShieldAlert,
    CheckCircle2,
    AlertCircle,
    Info,
    ArrowUpRight,
    Wifi,
    Compass,
    Shield,
    Zap,
    Fuel,
    Gauge,
    Check,
} from 'lucide-react';

const fleetUnits = [
    {
        id: 'AMB-01',
        model: 'Toyota HiAce High-Roof EMS',
        plate: 'SAB-1402',
        sector: 'Barangay Poblacion',
        crew: 'EMT J. Reyes • Driver M. Tan',
        speed: '52 km/h',
        fuel: 88,
        status: 'EN ROUTE',
        statusColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        mission: 'INC-2026-00084 (Respiratory Distress)',
    },
    {
        id: 'AMB-02',
        model: 'Nissan NV350 Rescue Ambulance',
        plate: 'SAA-8910',
        sector: 'Barangay Igpit (Highway)',
        crew: 'EMT R. Gomez • Driver D. Cruz',
        speed: '0 km/h',
        fuel: 74,
        status: 'ON SCENE',
        statusColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        mission: 'INC-2026-00083 (Motorcycle Collision)',
    },
    {
        id: 'AMB-03',
        model: 'Hyundai Staria Advanced Medical',
        plate: 'SAB-9921',
        sector: 'EOC Central Station, Poblacion',
        crew: 'Team Alpha Standby (On Call)',
        speed: '0 km/h',
        fuel: 95,
        status: 'STANDBY READY',
        statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        mission: 'Ready for Dispatch',
    },
    {
        id: 'AMB-04',
        model: 'Toyota Commuter Patient Transport',
        plate: 'SAB-3341',
        sector: 'Barangay Barra Substation',
        crew: 'Team Bravo Standby',
        speed: '0 km/h',
        fuel: 90,
        status: 'STANDBY READY',
        statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        mission: 'Ready for Dispatch',
    },
    {
        id: 'AMB-05',
        model: 'Isuzu D-Max 4x4 Upland Rescue',
        plate: 'SAA-4402',
        sector: 'Awang / Bagocboc Upland Sector',
        crew: 'Upland Quick Response Team',
        speed: '0 km/h',
        fuel: 82,
        status: 'STANDBY READY',
        statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        mission: 'Ready for Upland Terrain',
    },
    {
        id: 'AMB-06',
        model: 'Mitsubishi Strada SAR Disaster Unit',
        plate: 'SAA-5519',
        sector: 'Municipal Complex Base',
        crew: 'Technical Extrication Team',
        speed: '0 km/h',
        fuel: 92,
        status: 'STANDBY READY',
        statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        mission: 'Disaster Risk Reserve',
    },
];

const barangaysStatus = [
    { name: 'Poblacion', status: 'ACTIVE INCIDENT', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30', desc: 'AMB-01 En Route • Zone 2' },
    { name: 'Igpit', status: 'ON SCENE CARE', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', desc: 'AMB-02 on scene • Highway crossing' },
    { name: 'Barra', status: 'TRIAGE REVIEW', color: 'text-sky-400 bg-sky-500/15 border-sky-500/30', desc: 'Precautionary elderly checkup' },
    { name: 'Bonbon', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Coastal sector monitored' },
    { name: 'Luyong Bonbon', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Coastal sector monitored' },
    { name: 'Taboc', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Highway corridor clear' },
    { name: 'Malanang', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Agricultural zone clear' },
    { name: 'Patag', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Interior sector clear' },
    { name: 'Nangcaon', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Interior sector clear' },
    { name: 'Awang', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Upland outpost ready' },
    { name: 'Bagocboc', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Upland zone clear' },
    { name: 'Cauyonan', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Upland zone clear' },
    { name: 'Limonda', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Upland zone clear' },
    { name: 'Tingalan', status: 'ALL CLEAR', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', desc: 'Upland zone clear' },
];

export default function LiveOperationsPreview() {
    const [activeTab, setActiveTab] = useState<'incidents' | 'fleet' | 'sectors'>('incidents');

    return (
        <section id="operations" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#070B14] overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <Radio className="w-3.5 h-3.5" />
                        <span>Real-Time Dispatch Intelligence</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        Live Emergency Operations Preview
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                        A real-time demonstration of the municipal dispatch telemetry, GPS fleet tracking, and incident coordination system powering MDRRMO Opol 24 hours a day.
                    </p>
                </div>

                {/* KPI Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-5 rounded-2xl bg-[#0D1424]/90 border border-slate-800 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Incidents</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        </div>
                        <div className="text-3xl font-black text-white">3</div>
                        <div className="text-xs text-rose-400 mt-1 font-semibold flex items-center gap-1">
                            <span>2 Dispatched • 1 In Triage</span>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0D1424]/90 border border-slate-800 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ambulance Fleet</span>
                            <Ambulance className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-3xl font-black text-white">4 <span className="text-base font-normal text-slate-500">/ 6</span></div>
                        <div className="text-xs text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                            <span>4 Standby • 2 On Mission</span>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0D1424]/90 border border-slate-800 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Responders On Duty</span>
                            <Radio className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="text-3xl font-black text-white">18</div>
                        <div className="text-xs text-sky-400 mt-1 font-semibold">
                            <span>Certified EMTs & Drivers</span>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0D1424]/90 border border-slate-800 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Dispatch Speed</span>
                            <Clock className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-black text-white">2.4m</div>
                        <div className="text-xs text-emerald-400 mt-1 font-semibold">
                            <span>Exceeds DOH Standard</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Operations Preview Window */}
                <div className="rounded-3xl bg-[#0D1424]/95 border border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden">
                    {/* Window Title Bar */}
                    <div className="px-6 py-4 bg-[#090E1A] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                            </div>
                            <span className="text-xs font-mono text-slate-400 font-semibold pl-3 border-l border-slate-800">
                                MDRRMO Opol Command Center • Tactical Operations View
                            </span>
                        </div>

                        {/* Interactive View Selector */}
                        <div className="flex items-center gap-1 bg-[#111B2D] border border-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActiveTab('incidents')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'incidents'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Dispatch Queue (3)
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('fleet')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'fleet'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Fleet Telemetry (6)
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('sectors')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'sectors'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                14 Barangays Status
                            </button>
                        </div>
                    </div>

                    {/* Window Main Content */}
                    <div className="p-6 lg:p-8">
                        {/* TAB 1: Incidents View */}
                        {activeTab === 'incidents' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
                                <div className="lg:col-span-7 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-blue-400" />
                                            <span>Incident Dispatch Queue</span>
                                        </h3>
                                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Feed Active
                                        </span>
                                    </div>

                                    {/* Incident Card 1 */}
                                    <div className="p-4.5 rounded-2xl bg-[#090E1A] border border-rose-500/30 hover:border-rose-500/50 transition-colors shadow-lg">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-mono font-bold text-slate-400">INC-2026-00084</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                            PRIORITY 1 • CRITICAL
                                                        </span>
                                                    </div>
                                                    <h4 className="text-base font-bold text-white mt-1">
                                                        Severe Respiratory Distress / Asthma
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                                        <span>Zone 2, Barangay Poblacion • Near Opol National HS</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-mono text-slate-500 font-medium">1m ago</span>
                                        </div>

                                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <span className="text-blue-400 font-bold flex items-center gap-1.5">
                                                <Ambulance className="w-4 h-4" />
                                                <span>AMB-01 Dispatched (Alpha Team)</span>
                                            </span>
                                            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                                                ETA: 3.8 Mins
                                            </span>
                                        </div>
                                    </div>

                                    {/* Incident Card 2 */}
                                    <div className="p-4.5 rounded-2xl bg-[#090E1A] border border-amber-500/30 hover:border-amber-500/50 transition-colors shadow-lg">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <ShieldAlert className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-mono font-bold text-slate-400">INC-2026-00083</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            PRIORITY 2 • VEHICULAR
                                                        </span>
                                                    </div>
                                                    <h4 className="text-base font-bold text-white mt-1">
                                                        Motorcycle Collision / Trauma
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>Highway Crossing, Barangay Igpit</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-mono text-slate-500 font-medium">9m ago</span>
                                        </div>

                                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>AMB-02 Actively On Scene (Patient Care Underway)</span>
                                            </span>
                                            <span className="font-mono text-slate-400">ePCR Logged</span>
                                        </div>
                                    </div>

                                    {/* Incident Card 3 */}
                                    <div className="p-4.5 rounded-2xl bg-[#090E1A]/70 border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Radio className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-mono font-bold text-slate-400">INC-2026-00082</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                            PRIORITY 3 • IN REVIEW
                                                        </span>
                                                    </div>
                                                    <h4 className="text-base font-bold text-white mt-1">
                                                        Elderly Fall / Precautionary Medical Checkup
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                                        <span>Coastal Road, Barangay Barra</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-mono text-slate-500 font-medium">14m ago</span>
                                        </div>

                                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <span className="text-slate-400 font-medium">
                                                Dispatcher Review Verified • Assigning Unit
                                            </span>
                                            <span className="text-blue-400 font-semibold font-mono">Queue Pos: 1</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tactical Radar Simulation */}
                                <div className="lg:col-span-5 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                                            <Compass className="w-4 h-4 text-sky-400" />
                                            <span>Municipal Sector Radar</span>
                                        </h3>
                                        <span className="text-[11px] text-slate-400 font-mono">GPS: ±2m Accuracy</span>
                                    </div>

                                    <div className="relative h-64 w-full rounded-2xl bg-[#090E1A] border border-slate-800 p-4 overflow-hidden flex flex-col justify-between">
                                        <div
                                            className="absolute inset-0 opacity-15"
                                            style={{
                                                backgroundImage: 'radial-gradient(circle at 1px 1px, #38BDF8 1px, transparent 0)',
                                                backgroundSize: '24px 24px',
                                            }}
                                        />

                                        <div className="relative z-10 flex items-center justify-between text-[11px]">
                                            <span className="font-mono font-bold text-slate-400">SECTOR: OPOL_CENTRAL_01</span>
                                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                                <Wifi className="w-3.5 h-3.5" />
                                                <span>Telemetry Live</span>
                                            </span>
                                        </div>

                                        <div className="relative z-10 my-auto flex items-center justify-around">
                                            <div className="text-center">
                                                <div className="w-9 h-9 rounded-full bg-blue-600/30 border-2 border-blue-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30">
                                                    <MapPin className="w-4 h-4 text-blue-300" />
                                                </div>
                                                <p className="text-[10px] font-bold text-white mt-1">EOC Base</p>
                                                <p className="text-[9px] text-slate-500 font-mono">Poblacion</p>
                                            </div>

                                            <div className="text-center">
                                                <div className="relative w-9 h-9 rounded-full bg-rose-600/30 border-2 border-rose-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-500/30">
                                                    <span className="animate-ping absolute inset-0 rounded-full bg-rose-400 opacity-60" />
                                                    <Ambulance className="w-4 h-4 text-rose-300 relative z-10" />
                                                </div>
                                                <p className="text-[10px] font-bold text-rose-400 mt-1">AMB-01</p>
                                                <p className="text-[9px] text-slate-400 font-mono">48 km/h</p>
                                            </div>

                                            <div className="text-center">
                                                <div className="w-9 h-9 rounded-full bg-amber-600/30 border-2 border-amber-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-500/30">
                                                    <Ambulance className="w-4 h-4 text-amber-300" />
                                                </div>
                                                <p className="text-[10px] font-bold text-amber-400 mt-1">AMB-02</p>
                                                <p className="text-[9px] text-slate-400 font-mono">Brgy. Igpit</p>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                            <span>LAT: 8.5204° N</span>
                                            <span>LON: 124.5719° E</span>
                                            <span>ALT: 12m ASL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Fleet Telemetry View */}
                        {activeTab === 'fleet' && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Ambulance className="w-4 h-4 text-blue-400" />
                                        <span>Municipal Emergency Fleet Telemetry & Readiness</span>
                                    </h3>
                                    <span className="text-xs text-slate-400 font-mono">6 of 6 Vehicles Monitored</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {fleetUnits.map((unit) => (
                                        <div
                                            key={unit.id}
                                            className="p-5 rounded-2xl bg-[#090E1A] border border-slate-800 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-base font-black text-white">{unit.id}</span>
                                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${unit.statusColor}`}>
                                                        {unit.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-300">{unit.model}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Plate: {unit.plate} • {unit.sector}</p>
                                                <p className="text-xs text-blue-400 mt-2 font-medium">{unit.mission}</p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                                                    <span>Fuel: {unit.fuel}%</span>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                                                    <span className="font-mono">{unit.speed}</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: 14 Barangays Status Grid */}
                        {activeTab === 'sectors' && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-blue-400" />
                                        <span>14 Municipal Barangays • Sector Readiness Grid</span>
                                    </h3>
                                    <span className="text-xs text-slate-400 font-mono">100% Territorial Coverage</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {barangaysStatus.map((b) => (
                                        <div
                                            key={b.name}
                                            className="p-3.5 rounded-xl bg-[#090E1A] border border-slate-800 hover:border-slate-700 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm font-bold text-white">{b.name}</span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${b.color}`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-normal leading-snug">
                                                {b.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Demonstration Disclaimer Banner */}
                    <div className="px-6 py-4 bg-[#090E1A] border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="leading-relaxed">
                            <strong className="text-slate-200">Demonstration Telemetry Interface:</strong> Live GPS positioning, ambulance telemetry, and confidential patient records stream securely inside the authenticated command portals for authorized MDRRMO personnel.
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
