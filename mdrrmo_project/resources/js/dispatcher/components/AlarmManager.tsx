import React, { useContext, useEffect } from 'react';
import { AlarmContext } from '../contexts/AlarmContext';
import { AlertTriangle, MapPin, Clock, X } from 'lucide-react';
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
                router.reload({ preserveScroll: true, preserveState: true });
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

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 pointer-events-none">
            {/* Background overlay that is clickable to acknowledge */}
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={acknowledgeAlarm}></div>
            
            {/* Alarm Modal */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden pointer-events-auto transform transition-all animate-in slide-in-from-top-10 fade-in duration-300">
                {/* Header (Pulsing Red) */}
                <div className="bg-red-500 text-white p-4 flex items-center justify-center gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <AlertTriangle className="w-8 h-8 relative z-10" />
                    <h2 className="text-xl font-black uppercase tracking-widest relative z-10">New Emergency Incident</h2>
                </div>
                
                <div className="p-6">
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
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg uppercase tracking-wide transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                    >
                        Acknowledge Incident
                    </button>
                </div>
            </div>
        </div>
    );
}
