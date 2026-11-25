import UserManagement from '@/admin/components/Users/UserManagement';
import UserTable from '@/admin/components/Users/UserTable';
import UserModal from '@/admin/components/Users/UserModal';
import UserCard from '@/admin/components/Users/UserCard';

export { UserTable as ResidentTable, UserModal as ResidentModal, UserCard as ResidentCard };

export default function ResidentManagement({ users = [], pagination = undefined }: { users?: any[]; pagination?: any }) {
    return (
        <div className="space-y-6">
            <UserManagement
                users={users}
                pagination={pagination || undefined}
                roleFilter="resident"
                title="Resident Management"
                subtitle="Manage all registered residents who can report incidents."
                canCreate={false}
            />
        </div>
    );
}
