import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import {
    ArrowLeft, ArrowUpDown, User as UserIcon, Mail, Phone, MapPin, Calendar, Shield, CheckCircle2, ChevronLeft, ChevronRight, Clock, AlertTriangle, Eye, Copy, Check, Truck, Smartphone, UserCheck, PhoneCall, Home, FileText, Activity, RotateCcw, Search, ShieldAlert, ShieldCheck, Hash, Cake, X
} from 'lucide-react';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import AdminLayout from '@/admin/layouts/AdminLayout';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import StatusBadge from '@/shared/components/StatusBadge';
import IncidentDetails from '@/dispatcher/components/Incidents/IncidentDetails';
import { toPascalCase } from '@/shared/utils/utils';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface Barangay {
    id: number;
    barangay_name: string;
}

interface ResidentProfile {
    id: number;
    user_id: number;
    barangay_id: number;
    birthdate?: string | null;
    gender?: 'male' | 'female' | null;
    barangay?: Barangay | null;
}

interface IncidentRecord {
    id: number;
    resident_id: number;
    incident_type_id: number;
    description: string;
    chief_complaint?: string | null;
    place_of_incident?: string | null;
    incident_address?: string | null;
    location_code?: string | null;
    incident_latitude: number;
    incident_longitude: number;
    reporter_latitude: number;
    reporter_longitude: number;
    incident_status: string;
    priority: string;
    reported_at: string;
    verified_at?: string | null;
    resolved_at?: string | null;
    report_source?: 'resident_app' | 'dispatcher' | 'walk_in' | string;
    incident_type?: {
        id: number;
        name: string;
    } | null;
    images?: Array<{
        id: number;
        image_path: string;
    }>;
    dispatches?: Array<{
        id: number;
        dispatch_status: string;
        assigned_at?: string | null;
        en_route_at?: string | null;
        arrived_at?: string | null;
        completed_at?: string | null;
        ambulance?: {
            id: number;
            call_sign: string;
            plate_number: string;
        } | null;
        driver?: {
            id: number;
            first_name: string;
            last_name: string;
        } | null;
        emt?: {
            id: number;
            first_name: string;
            last_name: string;
        } | null;
        team_leader?: {
            id: number;
            first_name: string;
            last_name: string;
        } | null;
        pcr_record?: any;
    }>;
}

interface ResidentDetailsProps {
    resident: {
        id: number;
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        email: string;
        phone_number?: string | null;
        gender?: string | null;
        birthdate?: string | null;
        birthday?: string | null;
        age?: number | null;
        address?: string | null;
        role: string;
        status: string;
        verification_status?: 'Verified' | 'Pending' | string | null;
        is_verified?: boolean;
        created_at: string;
        reported_incidents_count: number;
        profile_photo_url?: string | null;
        resident_profile?: ResidentProfile | null;
    };
    incidents: IncidentRecord[];
    missingFields?: string[];
}

interface InfoFieldCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value?: string | null;
    fallback?: string;
    uppercaseValue?: boolean;
    mono?: boolean;
    className?: string;
    action?: {
        icon: React.ComponentType<{ className?: string }>;
        onClick: () => void;
        title: string;
    };
}

function InfoFieldCard({
    icon: Icon,
    label,
    value,
    fallback = '—',
    uppercaseValue = false,
    mono = false,
    className,
    action,
}: InfoFieldCardProps) {
    return (
        <div
            className={clsx(
                'group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-200',
                'bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30',
                'shadow-xs hover:shadow-md hover:shadow-slate-200/40 dark:hover:shadow-none',
                className
            )}
        >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-none">
                        {label}
                    </p>
                    <p
                        className={clsx(
                            'text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate tracking-tight',
                            uppercaseValue && 'uppercase',
                            mono && 'font-mono'
                        )}
                    >
                        {value || fallback}
                    </p>
                </div>
            </div>

            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    title={action.title}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors shrink-0 ml-2 cursor-pointer"
                >
                    <action.icon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

export default function ResidentDetailsPage({ resident, incidents = [], missingFields = [] }: ResidentDetailsProps) {
    const { auth } = usePage().props as any;
    const Layout = auth?.user?.role === 'admin' ? AdminLayout : DispatcherLayout;
    
    const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
    const [resolvedLocations, setResolvedLocations] = useState<Record<number, string>>({});
    const [activeTab, setActiveTab] = useState<'overview' | 'incidents'>('overview');

    // Incident History Search, Filter, Sort & Pagination state
    const incidentsSectionRef = useRef<HTMLDivElement>(null);
    const [incidentSearchInput, setIncidentSearchInput] = useState('');
    const [incidentAppliedSearch, setIncidentAppliedSearch] = useState('');
    const [incidentStatusFilter, setIncidentStatusFilter] = useState<'all' | 'resolved' | 'active' | 'cancelled'>('all');
    const [incidentSortOrder, setIncidentSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [incidentPerPage, setIncidentPerPage] = useState<number>(5);
    const [incidentPage, setIncidentPage] = useState<number>(1);

    useEffect(() => {
        setIncidentAppliedSearch(incidentSearchInput.trim());
    }, [incidentSearchInput]);

    useEffect(() => {
        setIncidentPage(1);
    }, [incidentAppliedSearch, incidentStatusFilter, incidentSortOrder, incidentPerPage, incidents.length]);

    const profile = resident.resident_profile;
    const isVerified = resident.is_verified ?? resident.verification_status === 'Verified';
    const rawGender = resident.gender || profile?.gender || null;
    const rawBirthdate = resident.birthdate || resident.birthday || profile?.birthdate || null;
    const rawBarangay = profile?.barangay?.barangay_name || 'Unassigned';
    const barangayName = toPascalCase(rawBarangay);
    const rawFullName = [resident?.first_name, resident?.middle_name, resident?.last_name]
        .filter(Boolean)
        .join(' ');
    const displayFullName = rawFullName.toUpperCase();
    const initials = `${resident.first_name?.[0] || 'R'}${resident.last_name?.[0] || 'R'}`.toUpperCase();
    
    const residentId = `MDRRMO-RES-${String(resident.id).padStart(3, '0')}`;

    // Reverse geocode any coordinates that don't have a place name yet
    React.useEffect(() => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!token) return;

        incidents.forEach((inc) => {
            const hasLocationName = inc.place_of_incident || inc.incident_address;
            if (!hasLocationName && inc.incident_latitude && inc.incident_longitude) {
                const lat = inc.incident_latitude;
                const lng = inc.incident_longitude;
                fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=PH&types=poi,address,neighborhood,locality`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.features && data.features.length > 0) {
                            setResolvedLocations((prev) => ({
                                ...prev,
                                [inc.id]: data.features[0].place_name,
                            }));
                        }
                    })
                    .catch(() => { });
            }
        });
    }, [incidents]);

    const getIncidentLocation = (inc: IncidentRecord) => {
        if (inc.place_of_incident) return toPascalCase(inc.place_of_incident);
        if (inc.incident_address) return toPascalCase(inc.incident_address);
        if (resolvedLocations[inc.id]) return toPascalCase(resolvedLocations[inc.id]);
        if (inc.location_code) {
            const codeStr = typeof inc.location_code === 'object' ? (inc.location_code as any)?.location_code || (inc.location_code as any)?.code : inc.location_code;
            return `Location Marker: ${codeStr}`;
        }
        if (profile?.barangay?.barangay_name) return `Brgy. ${toPascalCase(profile.barangay.barangay_name)}, Opol`;
        return 'Opol, Misamis Oriental';
    };

    // Full address computation (prefer saved home address from users table, then barangay fallback)
    const fullAddress = (() => {
        const savedAddress = resident.address?.trim();
        if (savedAddress) {
            const brgy = profile?.barangay?.barangay_name;
            if (brgy && !savedAddress.toLowerCase().includes(brgy.toLowerCase())) {
                return `${savedAddress}, Barangay ${toPascalCase(brgy)}, Opol, Misamis Oriental`;
            }
            return savedAddress;
        }
        if (profile?.barangay?.barangay_name) {
            return `Barangay ${toPascalCase(profile.barangay.barangay_name)}, Opol, Misamis Oriental`;
        }
        return 'No address provided';
    })();

    const formattedRegisteredDate = resident.created_at
        ? new Date(resident.created_at).toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : '—';

    const parsedBirthdate = (() => {
        if (!rawBirthdate) return null;
        const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(rawBirthdate));
        const d = isoMatch
            ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
            : new Date(rawBirthdate);
        return isNaN(d.getTime()) ? null : d;
    })();

    const formattedBirthdate = parsedBirthdate
        ? parsedBirthdate.toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : null;

    const calculatedAge = (() => {
        if (parsedBirthdate) {
            const today = new Date();
            let years = today.getFullYear() - parsedBirthdate.getFullYear();
            const monthDiff = today.getMonth() - parsedBirthdate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirthdate.getDate())) {
                years--;
            }
            if (years >= 0 && years <= 120) return years;
        }
        return typeof resident.age === 'number' && resident.age > 0 ? resident.age : null;
    })();

    const handleCopy = (text: string, title: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${title} to clipboard.`);
    };

    const filteredIncidents = useMemo(() => {
        const query = incidentAppliedSearch.toLowerCase();

        const matched = incidents.filter((inc) => {
            const status = (inc.incident_status || '').toLowerCase();
            if (incidentStatusFilter === 'resolved' && status !== 'resolved') return false;
            if (incidentStatusFilter === 'active' && !['pending', 'verified', 'assigned', 'responding'].includes(status)) return false;
            if (incidentStatusFilter === 'cancelled' && !['cancelled', 'rejected', 'unfounded'].includes(status)) return false;

            if (!query) return true;

            const reportedDateStr = inc.reported_at
                ? new Date(inc.reported_at).toLocaleString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                  })
                : '';
            const longDateStr = inc.reported_at
                ? new Date(inc.reported_at).toLocaleDateString('en-PH', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                  })
                : '';

            const haystack = [
                `#${inc.id}`,
                String(inc.id),
                inc.incident_type?.name,
                inc.description,
                inc.chief_complaint,
                getIncidentLocation(inc),
                inc.incident_status,
                inc.report_source,
                inc.priority,
                inc.reported_at,
                reportedDateStr,
                longDateStr,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });

        return [...matched].sort((a, b) => {
            const ta = a.reported_at ? new Date(a.reported_at).getTime() : 0;
            const tb = b.reported_at ? new Date(b.reported_at).getTime() : 0;
            const diff = tb - ta;
            if (diff !== 0) return incidentSortOrder === 'newest' ? diff : -diff;
            return incidentSortOrder === 'newest' ? b.id - a.id : a.id - b.id;
        });
    }, [incidents, incidentAppliedSearch, incidentStatusFilter, incidentSortOrder, resolvedLocations]);

    const incidentTotalPages = Math.max(1, Math.ceil(filteredIncidents.length / incidentPerPage));
    const safeIncidentPage = Math.min(incidentPage, incidentTotalPages);
    const incidentStartIndex = (safeIncidentPage - 1) * incidentPerPage;
    const paginatedIncidents = filteredIncidents.slice(incidentStartIndex, incidentStartIndex + incidentPerPage);

    const incidentPageNumbers = useMemo(() => {
        if (incidentTotalPages <= 7) {
            return Array.from({ length: incidentTotalPages }, (_, idx) => idx + 1);
        }
        const pages: Array<number | 'ellipsis'> = [1];
        const start = Math.max(2, safeIncidentPage - 1);
        const end = Math.min(incidentTotalPages - 1, safeIncidentPage + 1);
        if (start > 2) pages.push('ellipsis');
        for (let p = start; p <= end; p++) pages.push(p);
        if (end < incidentTotalPages - 1) pages.push('ellipsis');
        pages.push(incidentTotalPages);
        return pages;
    }, [safeIncidentPage, incidentTotalPages]);

    const hasActiveIncidentFilters =
        Boolean(incidentAppliedSearch) || incidentStatusFilter !== 'all' || incidentSortOrder !== 'newest';

    const handleIncidentSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIncidentAppliedSearch(incidentSearchInput.trim());
        setIncidentPage(1);
    };

    const handleResetIncidentFilters = () => {
        setIncidentSearchInput('');
        setIncidentAppliedSearch('');
        setIncidentStatusFilter('all');
        setIncidentSortOrder('newest');
        setIncidentPage(1);
    };

    const handleIncidentPageChange = (nextPage: number) => {
        const clamped = Math.max(1, Math.min(incidentTotalPages, nextPage));
        if (clamped === safeIncidentPage) return;
        setIncidentPage(clamped);
        incidentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderSourceBadge = (source?: string) => {
        switch (source) {
            case 'walk_in':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        <UserCheck className="w-3 h-3" />
                        Walk-In
                    </span>
                );
            case 'dispatcher':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                        <PhoneCall className="w-3 h-3" />
                        Dispatcher / Web
                    </span>
                );
            case 'resident_app':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                        <Smartphone className="w-3 h-3" />
                        Resident App
                    </span>
                );
        }
    };

    return (
        <Layout title={`Resident: ${toPascalCase(rawFullName)}`}>
            <Head title={`Resident Profile - MDRRMO Opol`} />

            <div className="max-w-6xl mx-auto space-y-6 pb-16">
                
                {/* Back Link positioned above Hero */}
                <div>
                    <Link
                        href={auth?.user?.role === 'admin' ? '/admin/residents' : '/dispatcher/residents'}
                        className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-sm transition-all duration-150 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Residents</span>
                    </Link>
                </div>

                {/* 1. HERO & BANNER CARD */}
                <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-sm">
                    {/* Architectural Ambient Cover Banner */}
                    <div className="relative h-40 sm:h-48 w-full bg-slate-950 overflow-hidden">
                        {/* High-tech Professional Grid Pattern */}
                        <div 
                            className="absolute inset-0 opacity-[0.15] pointer-events-none"
                            style={{
                                backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
                                backgroundSize: '32px 32px',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none" />
                        
                        {/* Elegant Ambient lighting */}
                        <div className="absolute -top-24 -right-12 w-96 h-96 rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-12 w-96 h-96 rounded-full bg-blue-500/15 blur-[80px] pointer-events-none" />

                        {/* Banner Agency Watermark / Title */}
                        <div className="absolute inset-0 px-6 sm:px-8 flex items-center justify-between pointer-events-none">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                    Community Member Profile
                                </span>
                                <p className="text-white/60 text-xs sm:text-sm font-semibold tracking-wide uppercase mt-1">
                                    MDRRMO OPOL • Misamis Oriental Operations Center
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Content Row overlapping banner */}
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-16 sm:-mt-20">
                            {/* Avatar & User Core Details */}
                            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                                <div className="relative shrink-0 group">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold tracking-wider shadow-2xl shadow-indigo-600/30 ring-4 ring-white dark:ring-[#0c1220] overflow-hidden">
                                        {resident?.profile_photo_url ? (
                                            <img
                                                src={resident.profile_photo_url}
                                                alt={displayFullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            initials
                                        )}
                                    </div>
                                </div>

                                {/* Names and Badges */}
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                                            {displayFullName}
                                        </h1>
                                        {isVerified ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                                <ShieldCheck className="w-3 h-3" />
                                                Verified Resident
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25">
                                                <Clock className="w-3 h-3" />
                                                Pending Verification
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        Community Member • Barangay {barangayName}
                                    </p>
                                </div>
                            </div>

                            {/* Top Quick Navigation Tabs */}
                            <div className="flex items-center gap-2 self-start sm:self-end pt-2 sm:pt-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('overview')}
                                    className={clsx(
                                        'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                        activeTab === 'overview'
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                    )}
                                >
                                    Overview
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('incidents')}
                                    className={clsx(
                                        'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                                        activeTab === 'incidents'
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                    )}
                                >
                                    <Activity className="w-3 h-3" />
                                    <span>Incident History</span>
                                    <span className={clsx(
                                        "ml-1 px-1.5 py-0.5 rounded-full text-[10px]", 
                                        activeTab === 'incidents' ? "bg-white/20 dark:bg-black/20" : "bg-slate-200 dark:bg-white/10"
                                    )}>{incidents.length}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TWO-COLUMN WORKSPACE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Identity & Credentials Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Card A: Account Status & Resident ID */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-purple-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                        Resident Clearance
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {resident.status?.toUpperCase() || 'ACTIVE'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        RESIDENT ID
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                            {residentId}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(residentId, 'Resident ID')}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        MEMBER SINCE
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                                        {formattedRegisteredDate}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        BARANGAY
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 capitalize">
                                        {barangayName}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        INCIDENTS REPORTED
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                                        {incidents.length} Emergency Logs
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card B: App Status */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-slate-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                        App Connectivity
                                    </h3>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Registered for the MDRRMO Resident Mobile App for emergency reporting.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Modules & Forms (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* TAB 1: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {!isVerified && missingFields.length > 0 && (
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 shadow-xs">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                        <div className="text-xs leading-relaxed space-y-1.5">
                                            <p>
                                                <span className="font-bold">Profile Pending Verification:</span>{' '}
                                                This resident has not yet completed all required profile details in the mobile app.
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[11px] font-semibold opacity-80">Missing required:</span>
                                                {missingFields.map((field) => (
                                                    <span
                                                        key={field}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30"
                                                    >
                                                        {field}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MODULE 1: Personal Details */}
                                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                Personal Details
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Verified identification and personal background records.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3-Column Names */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="First Name"
                                            value={resident?.first_name}
                                            uppercaseValue
                                        />
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="Middle Name (Optional)"
                                            value={resident?.middle_name}
                                            uppercaseValue
                                        />
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="Last Name"
                                            value={resident?.last_name}
                                            uppercaseValue
                                        />
                                    </div>

                                    {/* 3-Column Demographics */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <InfoFieldCard
                                            icon={UserIcon}
                                            label="Gender"
                                            value={rawGender}
                                            uppercaseValue={true}
                                        />
                                        <InfoFieldCard
                                            icon={Cake}
                                            label="Birthday"
                                            value={formattedBirthdate}
                                        />
                                        <InfoFieldCard
                                            icon={Clock}
                                            label="Age"
                                            value={calculatedAge !== null ? `${calculatedAge} yrs old` : '—'}
                                        />
                                    </div>
                                </div>

                                {/* MODULE 2: Contact & Location */}
                                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                Contact & Location
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Direct telecommunications and designated residential address.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2-Column Communications */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <InfoFieldCard
                                            icon={Mail}
                                            label="Email Address"
                                            value={resident?.email}
                                            action={resident?.email ? {
                                                icon: Copy,
                                                title: 'Copy Email',
                                                onClick: () => handleCopy(resident.email, 'Email address'),
                                            } : undefined}
                                        />
                                        <InfoFieldCard
                                            icon={Phone}
                                            label="Contact Number"
                                            value={resident?.phone_number}
                                            mono
                                            action={resident?.phone_number ? {
                                                icon: Copy,
                                                title: 'Copy Contact Number',
                                                onClick: () => handleCopy(resident.phone_number!, 'Phone number'),
                                            } : undefined}
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="grid grid-cols-1 gap-3.5">
                                        <InfoFieldCard
                                            icon={MapPin}
                                            label="Present Address"
                                            value={fullAddress}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: INCIDENTS HISTORY */}
                        {activeTab === 'incidents' && (
                            <div ref={incidentsSectionRef} className="space-y-4 scroll-mt-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5 text-[#F61509]" />
                                            Emergency Incident Report History
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Showing incidents reported by <strong className="text-slate-900 dark:text-white">{displayFullName}</strong> ({incidents.length} total).
                                        </p>
                                    </div>
                                </div>

                                {/* Search, Filter & Pagination Toolbar */}
                                {incidents.length > 0 && (
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm p-3.5 sm:p-4 space-y-3">
                                        <form onSubmit={handleIncidentSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
                                            <div className="relative flex-1">
                                                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    value={incidentSearchInput}
                                                    onChange={(e) => setIncidentSearchInput(e.target.value)}
                                                    placeholder="Search incident #, type, description, location, date, or status..."
                                                    className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F61509]/30 focus:border-[#F61509]/60 transition-all"
                                                />
                                                {incidentSearchInput && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIncidentSearchInput('');
                                                            setIncidentAppliedSearch('');
                                                        }}
                                                        title="Clear search"
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F61509] hover:bg-red-600 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-red-600/20 transition-all cursor-pointer shrink-0"
                                            >
                                                <Search className="w-4 h-4" />
                                                <span>Search</span>
                                            </button>
                                        </form>

                                        {/* Status Filters, Sort & Page Size */}
                                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {(
                                                    [
                                                        { id: 'all', label: 'All' },
                                                        { id: 'resolved', label: 'Resolved' },
                                                        { id: 'active', label: 'Active' },
                                                        { id: 'cancelled', label: 'Cancelled / Rejected' },
                                                    ] as const
                                                ).map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setIncidentStatusFilter(opt.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                                                            incidentStatusFilter === opt.id
                                                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-xs'
                                                                : 'bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIncidentSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
                                                    }
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                                                    title="Toggle chronological order"
                                                >
                                                    <ArrowUpDown className="w-3.5 h-3.5 text-[#F61509]" />
                                                    <span>{incidentSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                                                </button>

                                                <select
                                                    value={incidentPerPage}
                                                    onChange={(e) => setIncidentPerPage(Number(e.target.value))}
                                                    aria-label="Incidents per page"
                                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F61509]/30 cursor-pointer"
                                                >
                                                    <option value={5}>5 / page</option>
                                                    <option value={10}>10 / page</option>
                                                    <option value={20}>20 / page</option>
                                                </select>

                                                {hasActiveIncidentFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={handleResetIncidentFilters}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        <span>Reset</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Live Count Summary */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                            <span>
                                                {filteredIncidents.length === 0 ? (
                                                    'No matching incident reports'
                                                ) : (
                                                    <>
                                                        Showing{' '}
                                                        <span className="font-bold text-slate-900 dark:text-white">
                                                            {incidentStartIndex + 1}–{Math.min(incidentStartIndex + incidentPerPage, filteredIncidents.length)}
                                                        </span>{' '}
                                                        of{' '}
                                                        <span className="font-bold text-slate-900 dark:text-white">
                                                            {filteredIncidents.length}
                                                        </span>{' '}
                                                        {filteredIncidents.length === 1 ? 'report' : 'reports'}
                                                        {filteredIncidents.length !== incidents.length && (
                                                            <span className="ml-1 text-slate-400 dark:text-slate-500">
                                                                (filtered from {incidents.length} total)
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </span>
                                            {incidentTotalPages > 1 && (
                                                <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                                                    Page {safeIncidentPage} of {incidentTotalPages}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Card padding={false} className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm rounded-2xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03]">
                                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">#ID</th>
                                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">Incident Type</th>
                                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">Date & Location</th>
                                                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">Status / Source</th>
                                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                                                {incidents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-400">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">No Incidents Reported</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    This resident has not submitted any emergency reports.
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredIncidents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                                            <div className="flex flex-col items-center justify-center gap-2.5">
                                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-400">
                                                                    <Search className="w-5 h-5" />
                                                                </div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">No Matching Incident Reports</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    Try searching with a different keyword, date, or clear your active filters.
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleResetIncidentFilters}
                                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 transition-colors cursor-pointer mt-1"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                                    <span>Clear Search &amp; Filters</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedIncidents.map((incident) => {
                                                        const reportedDate = incident.reported_at
                                                            ? new Date(incident.reported_at).toLocaleString('en-PH', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })
                                                            : '—';

                                                        const incidentTypeName = toPascalCase(incident.incident_type?.name || 'Emergency');
                                                        const locationDisplay = getIncidentLocation(incident);

                                                        return (
                                                            <tr
                                                                key={incident.id}
                                                                onClick={() => setSelectedIncident(incident)}
                                                                className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                                            >
                                                                {/* ID */}
                                                                <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                    #{incident.id}
                                                                </td>

                                                                {/* Type & Desc */}
                                                                <td className="px-5 py-4 max-w-[200px]">
                                                                    <span className="font-semibold text-slate-900 dark:text-white group-hover:text-[#F61509] transition-colors capitalize block">
                                                                        {incidentTypeName}
                                                                    </span>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5" title={incident.description}>
                                                                        {incident.description || incident.chief_complaint || 'No details.'}
                                                                    </p>
                                                                </td>

                                                                {/* Date & Location */}
                                                                <td className="px-5 py-4 max-w-[220px]">
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                                            <span>{reportedDate}</span>
                                                                        </div>
                                                                        <div className="flex items-start gap-1.5 text-xs">
                                                                            <MapPin className="w-3 h-3 text-[#F61509] mt-0.5 shrink-0" />
                                                                            <span className="font-medium text-slate-800 dark:text-slate-200 capitalize truncate" title={locationDisplay}>
                                                                                {locationDisplay}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Status & Source */}
                                                                <td className="px-5 py-4">
                                                                    <div className="flex flex-col gap-2 items-start">
                                                                        <StatusBadge status={incident.incident_status} />
                                                                        {renderSourceBadge(incident.report_source)}
                                                                    </div>
                                                                </td>

                                                                {/* Action */}
                                                                <td className="px-5 py-4 text-right">
                                                                    <Button
                                                                        size="xs"
                                                                        variant="secondary"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedIncident(incident);
                                                                        }}
                                                                        className="group-hover:border-blue-500/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs font-semibold"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5 mr-1" />
                                                                        Inspect
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Pagination Bar */}
                                {incidentTotalPages > 1 && filteredIncidents.length > 0 && (
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#090e1a] shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Showing{' '}
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {incidentStartIndex + 1}–{Math.min(incidentStartIndex + incidentPerPage, filteredIncidents.length)}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {filteredIncidents.length}
                                            </span>{' '}
                                            incident reports
                                        </p>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleIncidentPageChange(safeIncidentPage - 1)}
                                                disabled={safeIncidentPage <= 1}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Prev</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {incidentPageNumbers.map((page, idx) =>
                                                    page === 'ellipsis' ? (
                                                        <span
                                                            key={`inc-ellipsis-${idx}`}
                                                            className="px-2 py-1 text-xs text-slate-400 dark:text-slate-500 select-none"
                                                        >
                                                            …
                                                        </span>
                                                    ) : (
                                                        <button
                                                            key={page}
                                                            type="button"
                                                            onClick={() => handleIncidentPageChange(page)}
                                                            className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                                page === safeIncidentPage
                                                                    ? 'bg-[#F61509] text-white border-[#F61509] shadow-sm shadow-red-600/25'
                                                                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleIncidentPageChange(safeIncidentPage + 1)}
                                                disabled={safeIncidentPage >= incidentTotalPages}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            >
                                                <span className="hidden sm:inline">Next</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Incident Details Drawer Modal */}
                {selectedIncident && (
                    <IncidentDetails
                        incident={selectedIncident}
                        open={!!selectedIncident}
                        onClose={() => setSelectedIncident(null)}
                    />
                )}
            </div>
        </Layout>
    );
}
