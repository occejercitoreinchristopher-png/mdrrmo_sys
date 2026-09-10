import Drawer from '@/shared/components/Drawer';
import { CheckCircle, Clock, AlertTriangle, Truck, MapPin } from 'lucide-react';
import StatusBadge from '@/shared/components/StatusBadge';

const timelineSteps = [
    { key: 'dispatched_at', label: 'Dispatched', icon: Truck, color: 'text-blue-400' },
    { key: 'arrived_at', label: 'Arrived on Scene', icon: MapPin, color: 'text-amber-400' },
    { key: 'resolved_at', label: 'Resolved', icon: CheckCircle, color: 'text-emerald-400' },
];

export default function DispatchTimeline({ dispatch, open, onClose, inlineMode = false }: { dispatch: any, open?: boolean, onClose?: () => void, inlineMode?: boolean }) {
    if (!dispatch) return null;

    const content = (
        <div className="space-y-6">
            <div className="flex gap-2">
                <StatusBadge status={dispatch.status || dispatch.dispatch_status} />
            </div>

            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Timeline</p>
                <div className="relative pl-4">
                    {timelineSteps.map((step, i) => {
                        const ts = dispatch[step.key];
                        const done = !!ts;
                        return (
                            <div key={step.key} className="flex gap-4 pb-6 relative">
                                {i < timelineSteps.length - 1 && (
                                    <div className="absolute left-3.5 top-5 bottom-0 w-px bg-slate-200 dark:bg-white/10" />
                                )}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${done ? 'bg-primary/10 dark:bg-white/10' : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'}`}>
                                    <step.icon className={`w-3.5 h-3.5 ${done ? step.color : 'text-slate-400 dark:text-slate-600'}`} />
                                </div>
                                <div className="pt-0.5">
                                    <p className={`text-sm font-medium ${done ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600'}`}>
                                        {step.label}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {ts ? new Date(ts).toLocaleString('en-PH') : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ambulance</p>
                    <p className="text-sm text-slate-900 dark:text-white">{dispatch.ambulance?.plate_number ?? '—'}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Responder</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                        {dispatch.responder ? `${dispatch.responder.first_name} ${dispatch.responder.last_name}` : '—'}
                    </p>
                </div>
            </div>
        </div>
    );

    if (inlineMode) return content;

    return (
        <Drawer open={open || false} onClose={onClose || (() => {})} title={`Dispatch #${dispatch.id}`} description="Timeline & Details">
            {content}
        </Drawer>
    );
}
