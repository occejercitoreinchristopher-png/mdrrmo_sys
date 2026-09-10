import AppLayout from '@/shared/layouts/AppLayout';
import AdminSidebar from '@/shared/components/AdminSidebar';
import AdminNavbar from '@/shared/components/AdminNavbar';

export default function AdminLayout({ children, title }) {
    return (
        <AppLayout title={title} Sidebar={AdminSidebar} Navbar={AdminNavbar}>
            {children}
        </AppLayout>
    );
}
