import { User } from 'lucide-react';
import Card from '@/shared/components/Card';
import StatusBadge from '@/shared/components/StatusBadge';

export default function UserCard({ user, onEdit, onDelete }) {
    const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();

    return (
        <Card hover padding={false}>
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {initials || <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                            {user.first_name} {user.middle_name ? `${user.middle_name[0]}.` : ''} {user.last_name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <StatusBadge status={user.role} />
                        <StatusBadge status={user.status} />
                    </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                    <button
                        onClick={() => onEdit?.(user)}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete?.(user)}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Card>
    );
}
