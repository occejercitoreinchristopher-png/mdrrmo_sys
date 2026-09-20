import { Smartphone } from 'lucide-react';
import UserManagement from '@/admin/components/Users/UserManagement';
import UserTable from '@/admin/components/Users/UserTable';
import UserModal from '@/admin/components/Users/UserModal';
import UserCard from '@/admin/components/Users/UserCard';

export { UserTable as ResidentTable, UserModal as ResidentModal, UserCard as ResidentCard };

export default function ResidentManagement({ users = [], pagination = null }) {
    return (
        <div className="space-y-6">
            <div className="bg-slate-900/[0.03] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Resident Self-Registration Notice</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Resident accounts are registered by community members directly via the MDRRMO Mobile App. Administrator accounts cannot create resident accounts manually to preserve mobile device authentication and verification integrity.
                    </p>
                </div>
            </div>
            <UserManagement
                users={users}
                pagination={pagination}
                roleFilter="resident"
                title="Resident Management"
                subtitle="Manage all registered residents who can report incidents."
                canCreate={false}
            />
        </div>
    );
}
