import { ChevronRight, Home } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';

const routeLabels = {
    'admin/dashboard': 'Dashboard',
    'admin/users': 'Users',
    'admin/residents': 'Residents',
    'admin/dispatchers': 'Dispatchers',
    'admin/responders': 'Responders',
    'admin/incidents': 'Incidents',
    'admin/dispatches': 'Dispatches',
    'admin/ambulances': 'Ambulances',
    'admin/patients': 'Patients',
    'admin/patient-care-records': 'Patient Care Records',
    'admin/barangays': 'Barangays',
    'admin/reports': 'Reports',
};

export default function Breadcrumb({ items }) {
    const { url } = usePage();

    // Auto-generate from URL if no items provided
    const crumbs = items || (() => {
        const parts = url.replace(/^\//, '').split('/').filter(Boolean);
        const result = [{ label: 'Home', href: '/' }];
        let cumulative = '';
        for (const part of parts) {
            cumulative += `/${part}`;
            result.push({
                label:
                    routeLabels[cumulative.replace(/^\//, '')] ||
                    part.charAt(0).toUpperCase() + part.slice(1),
                href: cumulative,
            });
        }
        return result;
    })();

    return (
        <nav className="flex items-center gap-1.5 text-xs">
            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                    <span key={i} className="flex items-center gap-1.5">
                        {i === 0 && (
                            <Home className="w-3 h-3 text-slate-500" />
                        )}
                        {isLast ? (
                            <span className="text-slate-300 font-medium">
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        )}
                        {!isLast && (
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
