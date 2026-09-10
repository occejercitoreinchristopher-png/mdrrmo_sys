import UserManagement from '@/admin/components/Users/UserManagement';
import UserTable from '@/admin/components/Users/UserTable';
import UserModal from '@/admin/components/Users/UserModal';
import UserCard from '@/admin/components/Users/UserCard';

export { UserTable as ResidentTable, UserModal as ResidentModal, UserCard as ResidentCard };

export default function ResidentManagement({ users = [], pagination = null }) {
    return (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    <strong className="font-semibold text-blue-800 dark:text-blue-300">Note:</strong> Resident accounts cannot be created manually. Residents must self-register using the mobile application.
                </p>
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
