import React from 'react';
import { clsx } from 'clsx';
import IncidentCard from './IncidentCard';

export default function IncidentKanbanBoard({ incidents, viewing, setViewing }) {
    // 4 columns: Pending, Verified, Assigned, Responding
    const columns = [
        { id: 'pending', title: 'Pending', statusKey: 'pending', color: 'border-t-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
        { id: 'verified', title: 'Verified', statusKey: 'verified', color: 'border-t-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
        { id: 'assigned', title: 'Assigned', statusKey: 'assigned', color: 'border-t-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
        { id: 'responding', title: 'Responding', statusKey: 'responding', color: 'border-t-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start w-full min-h-[70vh]">
            {columns.map((col) => {
                const columnIncidents = incidents.filter(i => i.incident_status === col.statusKey);

                return (
                    <div key={col.id} className="flex-1 min-w-[280px] max-w-[350px] flex flex-col bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden">
                        {/* Column Header */}
                        <div className={clsx("p-3 flex justify-between items-center border-t-2 border-b border-b-slate-200 dark:border-b-white/5", col.color)}>
                            <h2 className="font-semibold text-sm tracking-wide uppercase">
                                {col.title}
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-black/20 text-slate-700 dark:text-white text-xs font-bold">
                                {columnIncidents.length}
                            </span>
                        </div>
                        
                        {/* Column Body */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                            {columnIncidents.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs italic">
                                    No {col.title.toLowerCase()} incidents
                                </div>
                            ) : (
                                columnIncidents.map((incident) => (
                                    <IncidentCard 
                                        key={incident.id} 
                                        incident={incident} 
                                        selected={viewing?.id === incident.id}
                                        onClick={() => setViewing(incident)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
