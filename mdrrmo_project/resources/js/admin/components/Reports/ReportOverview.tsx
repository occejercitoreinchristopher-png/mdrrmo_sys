import { useMemo } from 'react';
import ReportStatCard from './ReportStatCard';

export interface ReportOverviewProps {
    stats?: any;
    incidents?: any[];
}

export default function ReportOverview({ stats = {}, incidents = [] }: ReportOverviewProps) {
    // 1. Ilang accident ang nangyari (Total Incidents / Accidents)
    const totalIncidents = stats.total_incidents ?? incidents.length;

    // 2. Anong barangay yung may pinaka mataas na accident (Highest Incident Barangay)
    const { topBarangayName, topBarangayCount, topBarangayPct } = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach((inc: any) => {
            let bName = 'Unassigned';
            if (typeof inc.barangay === 'string' && inc.barangay.trim()) {
                bName = inc.barangay.trim();
            } else if (inc.barangay && typeof inc.barangay === 'object') {
                bName = inc.barangay.barangay_name || inc.barangay.name || 'Unassigned';
            } else if (inc.resident?.residentProfile?.barangay?.barangay_name) {
                bName = inc.resident.residentProfile.barangay.barangay_name;
            } else if (inc.locationCode?.barangay?.barangay_name) {
                bName = inc.locationCode.barangay.barangay_name;
            }
            counts[bName] = (counts[bName] || 0) + 1;
        });

        let topName = 'None';
        let maxCount = 0;
        Object.entries(counts).forEach(([name, count]) => {
            if (count > maxCount) {
                topName = name;
                maxCount = count;
            }
        });

        const pct = totalIncidents > 0 ? Math.round((maxCount / totalIncidents) * 100) : 0;
        return {
            topBarangayName: topName,
            topBarangayCount: maxCount,
            topBarangayPct: pct,
        };
    }, [incidents, totalIncidents]);

    // 3. Yung dispatch (Total Dispatches)
    const totalDispatches = stats.total_dispatches ?? incidents.reduce((sum: number, inc: any) => {
        if (Array.isArray(inc.dispatches)) return sum + inc.dispatches.length;
        if (typeof inc.dispatches_count === 'number') return sum + inc.dispatches_count;
        return sum;
    }, 0);

    // 4. Ilang yung na resolved (Resolved Cases)
    const resolvedCount = stats.resolved_count ?? incidents.filter((i: any) => i.incident_status === 'resolved').length;
    const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0;

    // 5. Yung nag report na incident (Reported Incidents)
    const reportedCount = stats.verified_count ?? incidents.filter((i: any) => i.incident_status !== 'rejected').length;
    const verificationRate = totalIncidents > 0 ? Math.round((reportedCount / totalIncidents) * 100) : 0;

    // 6. Avg na response time (Average Response Time)
    const formatDuration = (sec: number) => {
        if (!sec || isNaN(sec) || sec <= 0) return '0 min';
        const totalMinutes = Math.round(sec / 60);
        if (totalMinutes < 60) {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}m ${s.toString().padStart(2, '0')}s`;
        }
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours}h ${mins}m`;
    };

    const avgResponseTimeStr = formatDuration(stats.avg_response_time ?? 0);
    const avgDispatchTimeStr = formatDuration(stats.avg_dispatch_time ?? 0);

    return (
        <div className="space-y-4 print:hidden">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-5 bg-red-600 rounded-full" />
                    <div>
                        <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
                            Operational Overview &amp; Executive Metrics
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Key emergency incidents, hotspot barangay, dispatches, and resolution velocity
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-time Live Sync</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
                {/* 1. Ilang accident ang nangyari */}
                <ReportStatCard
                    title="Total Incidents"
                    value={totalIncidents}
                    badgeText="All Cases"
                    subtitle="Recorded municipal emergency cases"
                    progress={100}
                    delayMs={0}
                />

                {/* 2. Anong barangay yung may pinaka mataas na accident */}
                <ReportStatCard
                    title="Top Hotspot Barangay"
                    value={topBarangayName}
                    badgeText={`${topBarangayCount} cases`}
                    subtitle={`${topBarangayPct}% of total incidents`}
                    progress={topBarangayPct}
                    delayMs={60}
                />

                {/* 3. Yung dispatch */}
                <ReportStatCard
                    title="Total Dispatches"
                    value={totalDispatches}
                    badgeText="Deployments"
                    subtitle="Ambulance & rescue units"
                    progress={totalIncidents > 0 ? Math.min(100, Math.round((totalDispatches / totalIncidents) * 100)) : 0}
                    delayMs={120}
                />

                {/* 4. Ilang yung na resolved */}
                <ReportStatCard
                    title="Resolved Cases"
                    value={resolvedCount}
                    badgeText={`${resolutionRate}% Cleared`}
                    subtitle="Successfully closed operations"
                    progress={resolutionRate}
                    delayMs={180}
                />

                {/* 5. Yung nag report na incident */}
                <ReportStatCard
                    title="Reported Incidents"
                    value={reportedCount}
                    badgeText={`${verificationRate}% Valid`}
                    subtitle="Verified citizen distress calls"
                    progress={verificationRate}
                    delayMs={240}
                />

                {/* 6. Avg na response time */}
                <ReportStatCard
                    title="Avg Response Time"
                    value={avgResponseTimeStr}
                    badgeText="Target < 8m"
                    subtitle={`Dispatch ack: ${avgDispatchTimeStr}`}
                    delayMs={300}
                />
            </div>
        </div>
    );
}
