import { CheckCircle, Clock } from 'lucide-react';

export default function TreatmentTimeline({ steps = [] }) {
    return (
        <div className="space-y-0">
            {steps.map((step, i) => (
                <div key={i} className="flex gap-4 pb-5 relative">
                    {i < steps.length - 1 && (
                        <div className="absolute left-3.5 top-5 bottom-0 w-px bg-white/10" />
                    )}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${step.done ? 'bg-emerald-500/20' : 'bg-white/5 border border-white/10'}`}>
                        {step.done
                            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            : <Clock className="w-3.5 h-3.5 text-slate-600" />
                        }
                    </div>
                    <div className="pt-0.5">
                        <p className={`text-sm font-medium ${step.done ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
                        {step.timestamp && <p className="text-xs text-slate-500 mt-0.5">{new Date(step.timestamp).toLocaleString('en-PH')}</p>}
                        {step.note && <p className="text-xs text-slate-400 mt-1">{step.note}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}
