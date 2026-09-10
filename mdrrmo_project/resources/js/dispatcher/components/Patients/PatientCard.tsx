import Card from '@/shared/components/Card';
import { Heart } from 'lucide-react';

export default function PatientCard({ patient, onClick }) {
    return (
        <Card hover padding={false} onClick={onClick}>
            <div className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                    <p className="font-medium text-white truncate">{patient.first_name} {patient.last_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {patient.age ? `${patient.age} yrs` : ''}
                        {patient.gender ? ` • ${patient.gender}` : ''}
                    </p>
                </div>
            </div>
        </Card>
    );
}
