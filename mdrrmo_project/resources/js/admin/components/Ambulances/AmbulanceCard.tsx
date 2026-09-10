import Card from '@/shared/components/Card';
import AmbulanceStatusBadge from './AmbulanceStatusBadge';
import { Ambulance } from 'lucide-react';

export default function AmbulanceCard({ ambulance, onEdit }: { ambulance: any; onEdit?: (ambulance: any) => void }) {
    return (
        <Card hover padding={false} onClick={() => onEdit?.(ambulance)}>
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Ambulance className="w-5 h-5 text-blue-400" />
                    </div>
                    <AmbulanceStatusBadge status={ambulance.status} />
                </div>
                <p className="font-mono font-semibold text-slate-900 dark:text-white">{ambulance.plate_number}</p>
                <p className="text-xs text-slate-400 mt-0.5">{ambulance.model} {ambulance.year ? `(${ambulance.year})` : ''}</p>
            </div>
        </Card>
    );
}
