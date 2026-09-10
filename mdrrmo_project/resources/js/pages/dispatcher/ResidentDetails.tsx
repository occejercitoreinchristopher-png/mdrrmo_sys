import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    Copy,
    Check,
    Truck,
    Smartphone,
    UserCheck,
    PhoneCall,
    Home,
    FileText,
    Activity,
    ShieldAlert,
} from 'lucide-react';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import StatusBadge from '@/shared/components/StatusBadge';
import IncidentDetails from '@/dispatcher/components/Incidents/IncidentDetails';

interface Barangay {
    id: number;
    barangay_name: string;
}

interface ResidentProfile {
    id: number;
    user_id: number;
    barangay_id: number;
    house_no?: string | null;
    street?: string | null;
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
        role: string;
        status: string;
        created_at: string;
        reported_incidents_count: number;
        resident_profile?: ResidentProfile | null;
    };
    incidents: IncidentRecord[];
}

export default function ResidentDetailsPage({ resident, incidents = [] }: ResidentDetailsProps) {
    const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
    const [copiedPhone, setCopiedPhone] = useState(false);

    const profile = resident.resident_profile;
    const barangayName = profile?.barangay?.barangay_name || 'Unassigned';
    const fullName = `${resident.first_name} ${resident.last_name}`;

    // Full address computation
    const addressParts = [
        profile?.house_no,
        profile?.street,
        profile?.barangay ? `Barangay ${profile.barangay.barangay_name}` : null,
        'Opol, Misamis Oriental',
    ].filter(Boolean);
    const fullAddress = addressParts.length > 1 ? addressParts.join(', ') : 'No full street address provided';

    const formattedRegisteredDate = resident.created_at
        ? new Date(resident.created_at).toLocaleDateString('en-PH', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';

    const formattedBirthdate = profile?.birthdate
        ? new Date(profile.birthdate).toLocaleDateString('en-PH', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

    const calculatedAge = profile?.birthdate
        ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear()
        : null;

    const handleCopyPhone = () => {
        if (!resident.phone_number) return;
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(resident.phone_number).then(() => {
                    setCopiedPhone(true);
                    setTimeout(() => setCopiedPhone(false), 2000);
                }).catch(() => {
                    fallbackCopy(resident.phone_number!);
                });
            } else {
                fallbackCopy(resident.phone_number);
            }
        } catch {
            fallbackCopy(resident.phone_number);
        }
    };

    const fallbackCopy = (text: string) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        } catch {}
    };

    // Quick calculations
    const pendingCount = incidents.filter((i) => ['pending', 'verified', 'assigned', 'responding'].includes(i.incident_status)).length;
    const resolvedCount = incidents.filter((i) => i.incident_status === 'resolved').length;

    // Helper for source badge
    const renderSourceBadge = (source?: string) => {
        switch (source) {
            case 'walk_in':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <UserCheck className="w-3 h-3" />
                        Walk-In
                    </span>
                );
            case 'dispatcher':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        <PhoneCall className="w-3 h-3" />
                        Dispatcher / Web
                    </span>
                );
            case 'resident_app':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Smartphone className="w-3 h-3" />
                        Resident App
                    </span>
                );
        }
    };

    return (
        <DispatcherLayout title={`Resident: ${fullName}`}>
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Back button and Top bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dispatcher/residents"
                        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Residents Directory
                    </Link>

                    <div className="flex items-center gap-2">
                        <StatusBadge status={resident.status || 'active'} />
                    </div>
                </div>

                {/* Profile Overview Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 shadow-2xl p-6 md:p-8">
                    {/* Background glow effects */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-rose-500/30 via-orange-500/20 to-indigo-500/30 border border-rose-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <span className="text-xl sm:text-2xl font-black text-rose-300 tracking-wider">
                                    {resident.first_name?.[0]}
                                    {resident.last_name?.[0]}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                        {fullName}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                        Resident
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                                    <span>Member since {formattedRegisteredDate}</span>
                                    <span>•</span>
                                    <span className="text-slate-300 font-medium">Brgy. {barangayName}</span>
                                </p>
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                                <span className="block text-xl font-bold text-white">{incidents.length}</span>
                                <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total Reports</span>
                            </div>
                            <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center min-w-[90px]">
                                <span className="block text-xl font-bold text-rose-300">{pendingCount}</span>
                                <span className="text-[11px] text-rose-300/80 uppercase tracking-wider">Active</span>
                            </div>
                            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[90px]">
                                <span className="block text-xl font-bold text-emerald-300">{resolvedCount}</span>
                                <span className="text-[11px] text-emerald-300/80 uppercase tracking-wider">Resolved</span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Demographics & Contact Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
                        {/* Email */}
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-slate-400 uppercase font-medium">Email Address</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate mt-0.5" title={resident.email}>
                                    {resident.email || '—'}
                                </p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                                <Phone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-slate-400 uppercase font-medium">Phone Number</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs sm:text-sm font-mono font-semibold text-slate-200">
                                        {resident.phone_number || '—'}
                                    </span>
                                    {resident.phone_number && (
                                        <button
                                            type="button"
                                            onClick={handleCopyPhone}
                                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                            title="Copy phone"
                                        >
                                            {copiedPhone ? (
                                                <Check className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Barangay & Demographics */}
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-slate-400 uppercase font-medium">Demographics</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-200 capitalize mt-0.5">
                                    {profile?.gender || 'Gender unrecorded'}
                                    {calculatedAge !== null ? ` • ${calculatedAge} yrs old` : ''}
                                </p>
                                {formattedBirthdate && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Born {formattedBirthdate}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Home Address */}
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0 text-rose-400">
                                <Home className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-slate-400 uppercase font-medium">Home Address</p>
                                <p className="text-xs font-medium text-slate-200 line-clamp-2 mt-0.5" title={fullAddress}>
                                    {fullAddress}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strictly Filtered Incident History Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-rose-400" />
                                Emergency Incident Report History
                            </h2>
                            <p className="text-xs text-slate-400">
                                Showing incidents reported specifically by {fullName} ({incidents.length} total).
                            </p>
                        </div>
                        <div className="text-xs text-slate-400">
                            Click any record to inspect full response timeline, map pinpoint, photos, and crew dispatch.
                        </div>
                    </div>

                    <Card padding={false} className="border-white/10 bg-slate-900/60 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/[0.03]">
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">#ID</th>
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Incident Type</th>
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Description</th>
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Date & Time Reported</th>
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Location & Barangay</th>
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Incident Status</th>
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Dispatch / Unit</th>
                                        <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Source</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {incidents.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-sm font-medium text-white">No Incidents Reported</p>
                                                    <p className="text-xs text-slate-500">
                                                        This resident has not submitted or been logged for any emergency reports.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        incidents.map((incident) => {
                                            const activeDispatch = incident.dispatches?.[0];
                                            const reportedDate = incident.reported_at
                                                ? new Date(incident.reported_at).toLocaleString('en-PH', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '—';

                                            const locationText =
                                                incident.place_of_incident ||
                                                incident.incident_address ||
                                                (incident.location_code ? `Marker: ${incident.location_code}` : `${incident.incident_latitude}, ${incident.incident_longitude}`);

                                            return (
                                                <tr
                                                    key={incident.id}
                                                    onClick={() => setSelectedIncident(incident)}
                                                    className="hover:bg-rose-500/[0.04] transition-colors cursor-pointer group"
                                                >
                                                    {/* Incident ID */}
                                                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-300">
                                                        #{incident.id}
                                                    </td>

                                                    {/* Incident Type */}
                                                    <td className="px-5 py-4">
                                                        <span className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                                                            {incident.incident_type?.name || 'Emergency'}
                                                        </span>
                                                        {incident.chief_complaint && (
                                                            <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                                                                {incident.chief_complaint}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Description */}
                                                    <td className="px-5 py-4 text-xs text-slate-300 max-w-[220px]">
                                                        <p className="line-clamp-2 leading-relaxed" title={incident.description}>
                                                            {incident.description || 'No additional details provided.'}
                                                        </p>
                                                    </td>

                                                    {/* Date & Time Reported */}
                                                    <td className="px-5 py-4 text-xs text-slate-300 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                            <span>{reportedDate}</span>
                                                        </div>
                                                    </td>

                                                    {/* Location */}
                                                    <td className="px-5 py-4 text-xs max-w-[200px]">
                                                        <div className="flex items-start gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                                                            <span className="truncate text-slate-300" title={locationText}>
                                                                {locationText}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Incident Status */}
                                                    <td className="px-5 py-4">
                                                        <StatusBadge status={incident.incident_status} />
                                                    </td>

                                                    {/* Dispatch Status / Unit */}
                                                    <td className="px-5 py-4 text-xs">
                                                        {activeDispatch ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Truck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                                    <span className="font-semibold text-slate-200">
                                                                        {activeDispatch.ambulance?.call_sign || 'Ambulance Unit'}
                                                                    </span>
                                                                </div>
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-400 uppercase">
                                                                    {activeDispatch.dispatch_status.replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500 italic text-xs">No dispatch yet</span>
                                                        )}
                                                    </td>

                                                    {/* Source / Platform */}
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        {renderSourceBadge(incident.report_source)}
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
                                                            className="group-hover:border-rose-500/40 group-hover:text-rose-300"
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
        </DispatcherLayout>
    );
}
