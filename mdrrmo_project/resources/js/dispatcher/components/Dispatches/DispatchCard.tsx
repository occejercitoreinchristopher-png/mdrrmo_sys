import Card from '@/shared/components/Card';
import StatusBadge from '@/shared/components/StatusBadge';

export default function DispatchCard({ dispatch, onClick }) {
    return (
        <Card hover padding={false} onClick={onClick}>
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs text-slate-500">#{dispatch.id}</span>
                    <StatusBadge status={dispatch.status} />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {dispatch.ambulance?.plate_number ?? 'N/A'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Responder:{' '}
                    {dispatch.responder
                        ? `${dispatch.responder.first_name} ${dispatch.responder.last_name}`
                        : '—'}
                </p>
            </div>
        </Card>
    );
}
