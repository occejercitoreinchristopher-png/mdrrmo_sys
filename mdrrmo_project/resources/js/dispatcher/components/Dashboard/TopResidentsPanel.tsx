import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import ReactApexChart from 'react-apexcharts';
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Clock,
    Crown,
    MapPin,
    PhoneCall,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import { toPascalCase } from '@/shared/utils/utils';
import { TopResidentSummary } from './DashboardCards';

export interface CommunityInsights {
    top_residents?: TopResidentSummary[];
    total_residents?: number;
    verified_residents?: number;
    pending_residents?: number;
    active_reporters?: number;
    sim_caller_reports?: number;
    verification_rate?: number;
}

interface TopResidentsPanelProps {
    community?: CommunityInsights;
}

export default function TopResidentsPanel({ community = {} }: TopResidentsPanelProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';

    const [sortMode, setSortMode] = useState<'resolved' | 'total'>('resolved');
    const [barsReady, setBarsReady] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setBarsReady(true), 140);
        return () => window.clearTimeout(t);
    }, []);

    const rawTopResidents = community.top_residents ?? [];

    const rankedResidents = useMemo(() => {
        return [...rawTopResidents]
            .sort((a, b) => {
                if (sortMode === 'resolved') {
                    return b.resolved_reports - a.resolved_reports || b.total_reports - a.total_reports;
                }
                return b.total_reports - a.total_reports || b.resolved_reports - a.resolved_reports;
            })
            .slice(0, 5);
    }, [rawTopResidents, sortMode]);

    const maxMetric = useMemo(() => {
        if (rankedResidents.length === 0) return 1;
        return Math.max(
            1,
            ...rankedResidents.map((r) => (sortMode === 'resolved' ? r.resolved_reports : r.total_reports))
        );
    }, [rankedResidents, sortMode]);

    const totalResidents = community.total_residents ?? 0;
    const verifiedResidents = community.verified_residents ?? 0;
    const pendingResidents = community.pending_residents ?? 0;
    const activeReporters = community.active_reporters ?? 0;
    const simReports = community.sim_caller_reports ?? 0;
    const verificationRate = community.verification_rate ?? 0;

    const radialOptions: any = useMemo(
        () => ({
            chart: {
                type: 'radialBar',
                background: 'transparent',
                sparkline: { enabled: true },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 1200,
                    animateGradually: { enabled: true, delay: 150 },
                    dynamicAnimation: { enabled: true, speed: 500 },
                },
            },
            plotOptions: {
                radialBar: {
                    startAngle: -135,
                    endAngle: 135,
                    hollow: {
                        margin: 0,
                        size: '68%',
                        background: 'transparent',
                    },
                    track: {
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                        strokeWidth: '100%',
                        dropShadow: { enabled: false },
                    },
                    dataLabels: {
                        show: true,
                        name: {
                            offsetY: 22,
                            show: true,
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontSize: '11px',
                            fontWeight: 600,
                        },
                        value: {
                            offsetY: -12,
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '28px',
                            fontWeight: 800,
                            formatter: (val: number) => `${Math.round(val)}%`,
                        },
                    },
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'horizontal',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#06b6d4'],
                    inverseColors: false,
                    opacityFrom: 1,
                    opacityTo: 1,
                    stops: [0, 100],
                },
            },
            colors: ['#10b981'],
            stroke: { lineCap: 'round' },
            labels: ['Verified Rate'],
        }),
        [isDark]
    );

    const medalStyles = [
        'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30',
        'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-sm',
        'bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-sm',
        'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
        'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            {/* LEFT (7 cols): Top Resident Reporters Leaderboard */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 shadow-xs overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                            <Crown className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Top Resident Reporters
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Residents with the highest resolved &amp; submitted emergency reports
                            </p>
                        </div>
                    </div>

                    {/* Sort Switcher Pill */}
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setSortMode('resolved')}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                sortMode === 'resolved'
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Most Resolved
                        </button>
                        <button
                            type="button"
                            onClick={() => setSortMode('total')}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                sortMode === 'total'
                                    ? 'bg-[#F61509] text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Most Reports
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-5 flex-1">
                    {rankedResidents.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                                <Award className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                No Resident Reports Yet
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Top community reporters will appear here once residents submit emergency reports.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rankedResidents.map((res, idx) => {
                                const metricValue = sortMode === 'resolved' ? res.resolved_reports : res.total_reports;
                                const barPercent = Math.max(8, Math.round((metricValue / maxMetric) * 100));

                                return (
                                    <Link
                                        key={res.id}
                                        href={`/dispatcher/residents/${res.id}`}
                                        className="block p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 dark:bg-white/[0.025] dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07] hover:border-amber-400/40 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Rank Medal */}
                                                <div
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                                        medalStyles[idx] || medalStyles[4]
                                                    }`}
                                                >
                                                    #{idx + 1}
                                                </div>

                                                {/* Avatar */}
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ring-2 ring-white dark:ring-[#0b1120]">
                                                    {res.profile_photo_url ? (
                                                        <img
                                                            src={res.profile_photo_url}
                                                            alt={res.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        res.initials
                                                    )}
                                                </div>

                                                {/* Name & Barangay */}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate capitalize group-hover:text-[#F61509] transition-colors">
                                                            {toPascalCase(res.name)}
                                                        </p>
                                                        {res.is_verified && (
                                                            <ShieldCheck
                                                                className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                                                                aria-label="Verified Resident"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3 text-[#F61509] shrink-0" />
                                                        <span className="truncate">
                                                            Brgy. {toPascalCase(res.barangay || 'Unassigned')}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Report Pills */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {res.resolved_reports} Resolved
                                                </span>
                                                <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono">
                                                    {res.total_reports} Total
                                                </span>
                                            </div>
                                        </div>

                                        {/* Animated Rising Progress Bar */}
                                        <div className="mt-2.5 flex items-center gap-2.5">
                                            <div className="flex-1 h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.07] overflow-hidden">
                                                <div
                                                    style={{
                                                        width: barsReady ? `${barPercent}%` : '0%',
                                                        transitionDelay: `${idx * 90}ms`,
                                                    }}
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                        sortMode === 'resolved'
                                                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                                                            : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400'
                                                    }`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 w-10 text-right">
                                                {res.resolution_rate}%
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT (5 cols): Resident User Community Breakdown + Animated Radial Gauge */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 shadow-xs overflow-hidden flex flex-col justify-between">
                <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500">
                            <Users className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Resident Community Overview
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Account verification &amp; reporting engagement
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dispatcher/residents"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
                    >
                        View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    {/* Animated Radial Gauge */}
                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-[230px]">
                            <ReactApexChart
                                options={radialOptions}
                                series={[verificationRate]}
                                type="radialBar"
                                height={195}
                            />
                        </div>
                    </div>

                    {/* Community Breakdown Rows */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    Verified
                                </span>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                                {verifiedResidents}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                of {totalResidents} residents
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    Pending
                                </span>
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                                {pendingResidents}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                incomplete profiles
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-500/[0.07] border border-blue-500/20">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                    Active Reporters
                                </span>
                                <Users className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                                {activeReporters}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                submitted ≥1 report
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-500/[0.07] border border-rose-500/20">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                    Phone / SIM
                                </span>
                                <PhoneCall className="w-3.5 h-3.5 text-[#F61509]" />
                            </div>
                            <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                                {simReports}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                hotline call reports
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
