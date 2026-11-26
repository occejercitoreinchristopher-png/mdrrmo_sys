import { useState, useEffect } from 'react';
import {
    Smartphone,
    BellRing,
    MapPin,
    Ambulance,
    ShieldCheck,
    PhoneCall,
    CheckCircle2,
    Download,
    Navigation,
    QrCode,
    Cpu,
    Calendar,
    HardDrive,
    Radio,
    Shield,
} from 'lucide-react';

export default function MobileAppSection() {
    const [qrError, setQrError] = useState(false);
    const [originUrl, setOriginUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOriginUrl(window.location.origin);
        }
    }, []);

    const downloadUrl = '/download/app';
    const fullDownloadUrl = originUrl ? `${originUrl}${downloadUrl}` : downloadUrl;

    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(
        fullDownloadUrl
    )}`;

    const features = [
        {
            title: 'Real-Time Emergency Response',
            desc: 'Instant incident dispatch and pre-hospital medical triage coordinated live with MDRRMO teams.',
            icon: Ambulance,
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
        },
        {
            title: 'GPS Location Tracking',
            desc: 'Automated coordinate sharing and live ambulance route tracking across all 14 barangays.',
            icon: Navigation,
            color: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
        },
        {
            title: 'Emergency Notifications',
            desc: 'Direct municipal disaster advisories, severe weather warnings, and evacuation alerts.',
            icon: BellRing,
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
        },
        {
            title: 'Direct MDRRMO Communication',
            desc: '24/7 hotline line and command center connection for pre-arrival lifesaving instructions.',
            icon: PhoneCall,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        },
    ];

    return (
        <section
            id="mobile-app"
            className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#060B15] overflow-hidden"
        >
            {/* Ambient Lighting Accents */}
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[140px] pointer-events-none -z-0" />
            <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] bg-indigo-600/[0.05] rounded-full blur-[130px] pointer-events-none -z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    {/* LEFT COLUMN: APPLICATION INFORMATION */}
                    <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
                        {/* Eyebrow Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>MDRRMO Mobile Ecosystem</span>
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Emergency Protection in the Palm of Every Opolanon
                        </h2>

                        {/* Description */}
                        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                            The MDRRMO Opol Mobile Applications connect residents and emergency responders through real-time emergency reporting, dispatch coordination, GPS tracking, and emergency notifications.
                        </p>

                        {/* Four Compact Feature Cards in a 2-Column Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-left">
                            {features.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.title}
                                        className="p-5 rounded-2xl bg-[#0D1424]/90 hover:bg-[#0F172A] border border-slate-800 hover:border-slate-700/80 transition-all duration-200 shadow-lg flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div
                                                className={`w-10 h-10 rounded-xl ${f.color} border flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-105 transition-transform`}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">
                                                {f.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 leading-relaxed font-normal">
                                                {f.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Trust & Compatibility Badges */}
                        <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1424] border border-slate-800">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>Official MDRRMO Package</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1424] border border-slate-800">
                                <Cpu className="w-4 h-4 text-blue-400" />
                                <span>Android 8.0+ Ready</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1424] border border-slate-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Direct APK Installation</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PROMINENT UNIFIED APPLICATION DOWNLOAD PANEL (DENNIS TRUCKING STYLE) */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="relative rounded-3xl bg-[#0B1222]/95 border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
                            {/* Subtle Ambient Card Glow */}
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500/40 via-indigo-500/60 to-blue-500/40 rounded-t-3xl" />

                            {/* Application Header Information */}
                            <div className="flex items-start gap-4 pb-5 border-b border-slate-800/80">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-lg text-blue-400">
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-2xl font-black text-white tracking-tight truncate">
                                        OpolResq App
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                                        Unified Emergency & Disaster Response Suite
                                    </p>
                                </div>
                            </div>

                            {/* Center Scannable QR Code */}
                            <div className="my-6 flex flex-col items-center justify-center text-center">
                                <div className="relative group p-3.5 rounded-2xl bg-white shadow-xl shadow-black/40 border border-slate-200/90 transition-transform duration-200 hover:scale-[1.02]">
                                    {!qrError ? (
                                        <img
                                            src={qrCodeApiUrl}
                                            alt="OpolResq APK Download QR Code"
                                            className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                                            onError={() => setQrError(true)}
                                            loading="lazy"
                                        />
                                    ) : (
                                        /* Offline / Fallback Clean Vector QR Matrix Graphic */
                                        <div className="w-40 h-40 sm:w-44 sm:h-44 bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-200">
                                            <QrCode className="w-20 h-20 text-slate-800 mb-1" />
                                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                                Scan to Download
                                            </span>
                                            <span className="text-[9px] text-slate-500">
                                                OpolResq App
                                            </span>
                                        </div>
                                    )}

                                    {/* Scan Corner Crosshairs */}
                                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-slate-800" />
                                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-slate-800" />
                                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-slate-800" />
                                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-slate-800" />
                                </div>

                                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Scan with phone camera or QR scanner</span>
                                </div>
                            </div>

                            {/* Technical Metadata Grid */}
                            <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
                                <div className="p-3 rounded-xl bg-[#070D1A]/80 border border-slate-800/80">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Version
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">
                                        v1.0.4
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-[#070D1A]/80 border border-slate-800/80">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        File Size
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">
                                        35.8 MB
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-[#070D1A]/80 border border-slate-800/80">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Updated
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block truncate">
                                        Nov 2026
                                    </span>
                                </div>
                            </div>

                            {/* Big Primary Action: Download APK Button */}
                            <div className="space-y-3">
                                <a
                                    href={downloadUrl}
                                    download
                                    className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/25 border border-blue-400/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2.5 group"
                                >
                                    <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm sm:text-base">
                                        Download OpolResq APK
                                    </span>
                                </a>

                                <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Direct & secure municipal APK distribution</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
