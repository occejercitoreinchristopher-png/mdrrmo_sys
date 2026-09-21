import React, { useContext, useEffect } from 'react';
import { AlarmContext } from '../contexts/AlarmContext';
import { AlertTriangle, MapPin, Clock, Volume2 } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function AlarmManager() {
    const { activeAlarm, triggerAlarm, acknowledgeAlarm } = useContext(AlarmContext);

    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.Echo) {
            // @ts-ignore
            const channel = window.Echo.private('dispatcher');
            
            const handleIncidentCreated = (e: any) => {
                const incident = e.incident || e;
                triggerAlarm(incident);
                
                // Still reload the router so the new incident appears in the lists
                router.reload();
            };

            channel.listen('IncidentCreated', handleIncidentCreated);

            return () => {
                channel.stopListening('IncidentCreated');
            };
        }
    }, [triggerAlarm]);

    if (!activeAlarm) return null;

    // Formatting date and priority
    const priorityColor = activeAlarm.priority?.toLowerCase() === 'high' ? 'text-red-500' : 'text-orange-500';
    const reportedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Fallback if no created_at
    const prankHistory = activeAlarm.reporter_prank_history;
    const hasPrankHistory = Boolean(prankHistory?.has_prank_history && (prankHistory?.prank_count ?? 0) > 0);

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 pointer-events-none">
            {/* Background overlay that is clickable to acknowledge */}
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={acknowledgeAlarm}></div>
            
            {/* Alarm Modal */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden pointer-events-auto transform transition-all animate-in slide-in-from-top-10 fade-in duration-300">
                {/* Header (Pulsing Red) */}
                <div className="bg-red-500 text-white p-4 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <AlertTriangle className="w-8 h-8 shrink-0 animate-bounce" />
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest leading-tight">New Emergency Incident</h2>
                            <p className="text-xs text-red-100 font-semibold tracking-wide flex items-center gap-1.5 mt-0.5">
                                <Volume2 className="w-3.5 h-3.5 animate-pulse text-yellow-300" /> High-Priority Siren Active
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6">
                    {/* Prank History Reference Alert */}
                    {hasPrankHistory && (
                        <div className="mb-5 p-3.5 bg-amber-50/95 dark:bg-amber-950/40 border-2 border-amber-500/80 rounded-xl text-xs space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Reference Flag: Reporter Has {prankHistory.prank_count} Prior Prank Report{prankHistory.prank_count === 1 ? '' : 's'}</span>
                            </div>
                            {prankHistory.latest_prank && (
                                <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90">
                                    <strong>Latest ({prankHistory.latest_prank.formatted_date}):</strong> "{prankHistory.latest_prank.rejection_reason}"
                                </p>
                            )}
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                Note: Evaluate this incident independently. Verify caller responsiveness before dispatch.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4 mb-8">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Incident Type</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {activeAlarm.incident_type?.name || activeAlarm.type || 'Emergency Request'}
                            </span>
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Priority</span>
                            <span className={`text-lg font-bold uppercase ${priorityColor}`}>
                                {activeAlarm.priority || 'HIGH'} PRIORITY
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Location</span>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="text-base font-medium text-slate-800 dark:text-slate-200">
                                    {activeAlarm.barangay || activeAlarm.location_address || 'Location provided in details'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Reported At</span>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {activeAlarm.created_at ? new Date(activeAlarm.created_at).toLocaleTimeString() : reportedAt}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={acknowledgeAlarm}
                        className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold py-4 rounded-xl text-lg uppercase tracking-wide transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Acknowledge & Silence Alarm
                    </button>
                </div>
            </div>
        </div>
    );
}
