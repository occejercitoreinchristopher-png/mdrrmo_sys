import { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/admin/layouts/AdminLayout';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import {
    ArrowLeft,
    Clock,
    Info,
    Truck,
    CheckCircle2,
    UserCircle,
    MapPin,
    AlertCircle,
    Printer,
    Phone,
    User,
    Shield,
    XCircle,
    Radio,
    ChevronRight,
    ExternalLink,
    AlertTriangle,
    FileText,
    Users,
    Activity,
    Image as ImageIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import { printIncidentDetailReport } from '@/shared/utils/printDispatchReports';

export default function DispatchLogShow({ incident }: any) {
    const { auth } = usePage<any>().props;
    const isAdmin = auth?.user?.role === 'admin';
    const Layout = isAdmin ? AdminLayout : DispatcherLayout;
    const backHref = isAdmin ? '/admin/dispatch-logs' : '/dispatcher/dispatch-logs';

    // Dispatches & crew
    const dispatches = incident.dispatches || [];
    const ambulances = dispatches.map((d: any) => d.ambulance?.plate_number).filter(Boolean).join(', ');
    const responderCount = dispatches.reduce((acc: number, d: any) => acc + (d.crew?.length || 0), 0);

    // Handler / Dispatcher
    const logs = incident.dispatch_logs || [];
    const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
    const verifiedBy = incident.verified_by_user || incident.verified_by || incident.verifiedBy;
    const handlerUser = latestLog?.user || verifiedBy || incident.dispatches?.[0]?.dispatcher;
    const dispatcher = handlerUser ? `${handlerUser.first_name} ${handlerUser.last_name}` : 'MDRRMO Dispatcher';

    // Caller / Reporter
    const resident = incident.resident;
    const callerName = incident.caller_name || (resident ? `${resident.first_name} ${resident.last_name}` : 'Public / Unspecified Caller');
    const callerPhone = incident.caller_phone_number || resident?.phone_number || 'N/A';
    const isPhoneSim = incident.report_source === 'phone_sim' || incident.report_source === 'dispatcher';
    const reportChannel = isPhoneSim ? 'Phone/SIM Call-in' : (incident.report_source === 'resident_app' ? 'Mobile App' : (incident.report_source || 'Citizen Report'));

    // Status & Priority
    const status = incident.incident_status || 'pending';
    const priority = incident.priority || 'Moderate';

    // Synthesized Chronological Timeline (ensures timeline is NEVER empty)
    const timeline = useMemo(() => {
        const events: any[] = [];

        // 1. Initial Report
        events.push({
            id: 'evt-reported',
            time: incident.reported_at || incident.created_at,
            title: isPhoneSim ? 'Phone/SIM Call Intake' : 'Incident Reported',
            actor: callerName + (callerPhone !== 'N/A' ? ` (${callerPhone})` : ''),
            isSystem: false,
            badgeColor: isPhoneSim ? 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800/30' : 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800/30',
            statusChange: { from: null, to: isPhoneSim ? 'verified' : 'pending' },
            remarks: incident.incident_description || incident.chief_complaint || (isPhoneSim ? 'Emergency call received via Phone/SIM hotline and verified upon creation.' : 'Emergency call received at MDRRMO operations.'),
            icon: Phone
        });

        // 2. Verification (for Resident submissions that underwent separate review)
        if (!isPhoneSim && (incident.verified_at || incident.verified_by)) {
            events.push({
                id: 'evt-verified',
                time: incident.verified_at || incident.created_at,
                title: status === 'rejected' ? 'Evaluation & Rejection' : 'Incident Verified & Triaged',
                actor: verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : 'Dispatcher',
                isSystem: false,
                badgeColor: status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-200' : 'bg-blue-500/10 text-blue-600 border-blue-200',
                statusChange: { from: 'pending', to: status === 'rejected' ? 'rejected' : 'verified' },
                remarks: incident.verification_remarks || (status === 'rejected' ? `Rejected: ${incident.rejection_reason || 'N/A'}` : 'Location and validity verified by dispatcher.'),
                icon: status === 'rejected' ? XCircle : CheckCircle2
            });
        }

        // 3. Dispatches
        dispatches.forEach((d: any, index: number) => {
            const ambPlate = d.ambulance?.plate_number ? `Unit ${d.ambulance.plate_number}` : 'Ambulance Unit';
            if (d.assigned_at || d.created_at) {
                events.push({
                    id: `evt-dispatch-${d.id || index}`,
                    time: d.assigned_at || d.created_at,
                    title: `Emergency Unit Dispatched (${ambPlate})`,
                    actor: d.dispatcher ? `${d.dispatcher.first_name} ${d.dispatcher.last_name}` : dispatcher,
                    isSystem: false,
                    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
                    statusChange: { from: 'verified', to: 'assigned' },
                    remarks: `Assigned ${ambPlate} with driver ${d.driver ? `${d.driver.first_name} ${d.driver.last_name}` : 'Assigned Driver'} and ${d.crew?.length || 0} crew members.`,
                    icon: Truck
                });
            }
            if (d.arrived_at) {
                events.push({
                    id: `evt-arrived-${d.id || index}`,
                    time: d.arrived_at,
                    title: `Unit Arrived On Scene (${ambPlate})`,
                    actor: d.driver ? `${d.driver.first_name} ${d.driver.last_name}` : 'Ambulance Crew',
                    isSystem: false,
                    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-200',
                    statusChange: { from: 'assigned', to: 'responding' },
                    remarks: 'Ambulance arrived at the incident site. Responders commenced triage/care.',
                    icon: MapPin
                });
            }
            if (d.completed_at && d.dispatch_status === 'completed') {
                events.push({
                    id: `evt-complete-${d.id || index}`,
                    time: d.completed_at,
                    title: `Dispatch Mission Concluded (${ambPlate})`,
                    actor: dispatcher,
                    isSystem: false,
                    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
                    statusChange: { from: 'responding', to: 'completed' },
                    remarks: 'Patient transported / incident care concluded successfully.',
                    icon: CheckCircle2
                });
            }
        });

        // 4. Audit dispatch_logs records
        logs.forEach((log: any) => {
            events.push({
                id: `evt-audit-${log.id}`,
                time: log.created_at,
                title: log.action?.name || 'Audit Action',
                actor: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System Automated',
                isSystem: log.action?.is_system_action ?? false,
                badgeColor: 'bg-slate-500/10 text-slate-600 border-slate-200',
                statusChange: { from: log.previous_status, to: log.new_status },
                remarks: log.remarks || '',
                icon: Activity
            });
        });

        // 5. Final resolution / rejection if not already explicitly present
        if (status === 'rejected') {
            const hasRejection = events.some(e => e.title.includes('Reject'));
            if (!hasRejection) {
                events.push({
                    id: 'evt-final-rejected',
                    time: incident.resolved_at || incident.updated_at,
                    title: 'Incident Rejected',
                    actor: verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : dispatcher,
                    isSystem: false,
                    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-200',
                    statusChange: { from: null, to: 'rejected' },
                    remarks: `Reason: ${incident.rejection_reason || 'N/A'} (Category: ${incident.rejection_category || 'other'}${incident.is_prank ? ' - Flagged as Prank' : ''})`,
                    icon: XCircle
                });
            }
        } else if (status === 'resolved') {
            const hasResolved = events.some(e => e.title.includes('Resolved') || e.title.includes('Concluded'));
            if (!hasResolved) {
                events.push({
                    id: 'evt-final-resolved',
                    time: incident.resolved_at || incident.updated_at,
                    title: 'Incident Closed & Resolved',
                    actor: dispatcher,
                    isSystem: false,
                    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
                    statusChange: { from: null, to: 'resolved' },
                    remarks: 'All emergency response actions completed and incident closed.',
                    icon: CheckCircle2
                });
            }
        }

        // Sort chronologically
        events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        return events;
    }, [incident, callerName, callerPhone, dispatcher, dispatches, logs, status, verifiedBy]);

    const handlePrint = () => {
        printIncidentDetailReport(incident, {
            preparedBy: auth?.user ? `${auth.user.first_name} ${auth.user.last_name}` : dispatcher
        });
    };

    return (
        <Layout title={`Incident Log #${incident.id}`}>
            <Head title={`Dispatch Log Details - ${incident.reference_number || incident.id}`} />

            {/* Header Toolbar */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={backHref}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 shadow-sm"
                        title="Back to Dispatch Logs"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Incident History: {incident.reference_number || `#${incident.id}`}
                            </h1>
                            <span className={clsx(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset uppercase",
                                status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400' :
                                status === 'verified' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400' :
                                status === 'assigned' || status === 'responding' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400' :
                                status === 'resolved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                status === 'rejected' ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400' :
                                'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400'
                            )}>
                                {status}
                            </span>
                            <span className={clsx(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                                priority === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            )}>
                                {priority} Priority
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Comprehensive timeline, responder dispatch audit, and chronological event ledger.
                        </p>
                    </div>
                </div>

                {/* Print Button */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        Print Official Incident Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Comprehensive Information Cards */}
                <div className="space-y-6">
                    
                    {/* Card 1: Incident Information */}
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 p-5">
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Info className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Incident Information</h2>
                                <p className="text-[11px] text-slate-400">Core details &amp; classification</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Incident Type</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {incident.incident_type?.name || incident.incident_type?.incident_type_name || 'Emergency Incident'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Reported At</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {incident.reported_at ? new Date(incident.reported_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date(incident.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Channel</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {reportChannel}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Narrative / Description</span>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                    {incident.incident_description || incident.chief_complaint || 'No detailed narrative recorded.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Reporter & Location */}
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 p-5">
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Reporter &amp; Location</h2>
                                <p className="text-[11px] text-slate-400">Caller origin and exact coordinates</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Caller / Reporter</span>
                                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span>{callerName}</span>
                                    {resident && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            Resident
                                        </span>
                                    )}
                                </div>
                                {callerPhone !== 'N/A' && (
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1 pl-6">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>{callerPhone}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Incident Location</span>
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    {incident.place_of_incident && (
                                        <div className="font-bold text-slate-900 dark:text-white mb-0.5">
                                            {incident.place_of_incident}
                                        </div>
                                    )}
                                    <div>{incident.incident_address || (typeof incident.location === 'object' ? incident.location?.location_name || incident.location?.name : incident.location)}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                        Barangay: <strong className="text-slate-700 dark:text-slate-300">{(typeof incident.barangay === 'object' ? incident.barangay?.barangay_name || incident.barangay?.name : incident.barangay) || 'Opol'}</strong>
                                    </div>
                                </div>
                            </div>

                            {incident.incident_latitude && incident.incident_longitude && (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Coordinates</span>
                                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                            {Number(incident.incident_latitude).toFixed(6)}, {Number(incident.incident_longitude).toFixed(6)}
                                        </span>
                                    </div>
                                    <a
                                        href={`https://maps.google.com/?q=${incident.incident_latitude},${incident.incident_longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                                        title="View on Google Maps"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 3: Dispatch Details */}
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 p-5">
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                <Truck className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Dispatch Operations</h2>
                                <p className="text-[11px] text-slate-400">Personnel &amp; ambulance assignment</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Handled By</span>
                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                    <UserCircle className="w-4 h-4 text-blue-500" />
                                    <span>{dispatcher}</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Assigned Units ({dispatches.length})
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {responderCount} Responders
                                    </span>
                                </div>

                                {dispatches.length === 0 ? (
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 text-slate-500 italic text-center">
                                        {status === 'rejected' ? 'No units dispatched (Incident was rejected/cancelled).' : 'No ambulance units assigned yet.'}
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {dispatches.map((d: any, idx: number) => {
                                            const amb = d.ambulance;
                                            return (
                                                <div key={d.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                            <Truck className="w-3.5 h-3.5 text-indigo-500" />
                                                            {amb?.plate_number ? `Ambulance ${amb.plate_number}` : 'Medical Unit'}
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 uppercase">
                                                            {d.dispatch_status}
                                                        </span>
                                                    </div>
                                                    {d.driver && (
                                                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                                            Driver: <strong className="text-slate-800 dark:text-slate-200">{d.driver.first_name} {d.driver.last_name}</strong>
                                                        </div>
                                                    )}
                                                    {d.crew && d.crew.length > 0 && (
                                                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                                            Crew: <span className="font-medium text-slate-800 dark:text-slate-200">
                                                                {d.crew.map((c: any) => `${c.first_name} ${c.last_name}`).join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Rejection Details Box if rejected */}
                            {status === 'rejected' && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold mb-1">
                                        <XCircle className="w-4 h-4" />
                                        <span>Rejection Audit Trail</span>
                                    </div>
                                    <div className="text-[11px] text-rose-800 dark:text-rose-300 space-y-0.5">
                                        <div>Category: <strong className="uppercase">{incident.rejection_category || 'Other'}</strong></div>
                                        <div>Prank Flag: <strong>{incident.is_prank ? 'Yes (Prank)' : 'No'}</strong></div>
                                        <div>Reason: <strong>{incident.rejection_reason || 'N/A'}</strong></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Complete Chronological Timeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 dark:text-white text-base">Chronological Dispatch Timeline</h2>
                                    <p className="text-xs text-slate-400">Sequential lifecycle events and official audit ledger</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {timeline.length} Recorded Events
                            </span>
                        </div>

                        {/* Timeline Tree */}
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-5 pl-6 space-y-8 pb-4">
                            {timeline.map((evt: any) => {
                                const IconComponent = evt.icon || Activity;
                                return (
                                    <div key={evt.id} className="relative group">
                                        {/* Node Icon on line */}
                                        <div className={clsx(
                                            "absolute -left-[37px] top-0 w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                                            evt.badgeColor
                                        )}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>

                                        <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5 rounded-xl p-4 transition-all hover:border-slate-300 dark:hover:border-white/10">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                                        {evt.title}
                                                    </h3>
                                                    {evt.isSystem && (
                                                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                                            Automated
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                    {new Date(evt.time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Recorded by: <strong className="text-slate-800 dark:text-slate-200">{evt.actor}</strong></span>
                                            </div>

                                            {/* Status Badge transition if present */}
                                            {evt.statusChange && (evt.statusChange.from || evt.statusChange.to) && (
                                                <div className="flex items-center gap-2 text-xs mb-2">
                                                    {evt.statusChange.from && (
                                                        <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-semibold text-[10px]">
                                                            {evt.statusChange.from}
                                                        </span>
                                                    )}
                                                    {evt.statusChange.from && evt.statusChange.to && (
                                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                                    )}
                                                    {evt.statusChange.to && (
                                                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase">
                                                            {evt.statusChange.to}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Event Remarks */}
                                            {evt.remarks && (
                                                <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                                                    {evt.remarks}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
