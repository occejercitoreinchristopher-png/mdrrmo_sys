import AdminLayout from '@/admin/layouts/AdminLayout';
import UserManagement from '@/admin/components/Users/UserManagement';

export default function UsersPage({ users, pagination }) {
    return (
        <AdminLayout title="User Management">
            <UserManagement users={users ?? []} pagination={pagination} />
        </AdminLayout>
    );
}
