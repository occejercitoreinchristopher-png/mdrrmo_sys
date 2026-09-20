import AdminAppLayout from './AdminAppLayout';
import AdminSidebar from '@/shared/components/AdminSidebar';
import AdminNavbar from '@/shared/components/AdminNavbar';

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
    return (
        <AdminAppLayout title={title} Sidebar={AdminSidebar} Navbar={AdminNavbar}>
            {children}
        </AdminAppLayout>
    );
}
