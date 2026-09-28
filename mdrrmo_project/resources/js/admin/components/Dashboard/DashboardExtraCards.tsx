import Card from '@/shared/components/Card';

export default function DashboardExtraCards({ extraData = {} }: { extraData?: any }) {
    const statusOverview = extraData.status_overview ?? {};
    const incidentsByBarangay = extraData.incidents_by_barangay ?? [];
    const ambulanceStatus = extraData.ambulance_status ?? {};

    // Helper to render empty states
    const renderEmpty = () => (
        <div className="flex items-center justify-center py-8">
            <span className="text-slate-400 dark:text-slate-500 text-sm">No incident data available</span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Incident Status Overview */}
            <Card padding={false} className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Incident Status Overview
                    </h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    {Object.keys(statusOverview).length === 0 ? renderEmpty() : (
                        <div className="space-y-3">
                            {Object.entries(statusOverview).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                                        {status.replace('_', ' ')}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full">
                                        {String(count)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Incidents by Barangay */}
            <Card padding={false} className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Incidents by Barangay
                    </h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto max-h-64">
                    {incidentsByBarangay.length === 0 ? renderEmpty() : (
                        <div className="space-y-3">
                            {incidentsByBarangay.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate pr-2">
                                        {item.name}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full flex-shrink-0">
                                        {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Ambulance Status */}
            <Card padding={false} className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Ambulance Status
                    </h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    {Object.keys(ambulanceStatus).length === 0 ? renderEmpty() : (
                        <div className="space-y-3">
                            {Object.entries(ambulanceStatus).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                                        {status.replace('_', ' ')}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full">
                                        {String(count)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
