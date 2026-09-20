import { router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    Ambulance,
    MapPin,
    BarChart3,
    User,
    Shield,
    CheckCircle2,
    PanelLeft,
    PanelLeftClose,
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
    {
        group: 'Overview',
        items: [
            { label: 'Executive Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
        ],
    },
    {
        group: 'Identity & Access',
        items: [
            { label: 'System Users', icon: Users, href: '/admin/users' },
            { label: 'Verified Residents', icon: UserCheck, href: '/admin/residents' },
        ],
    },
    {
        group: 'Operations Fleet',
        items: [
            { label: 'Ambulance Fleet', icon: Ambulance, href: '/admin/ambulances' },
            { label: 'Barangays & Locations', icon: MapPin, href: '/admin/barangays' },
        ],
    },
    {
        group: 'Analytics & Governance',
        items: [
            { label: 'Reports & Analytics', icon: BarChart3, href: '/admin/reports' },
            { label: 'Account Profile', icon: User, href: '/profile' },
        ],
    },
];

function NavItem({
    icon: Icon,
    label,
    href,
    active,
    collapsed,
}: {
    icon: any;
    label: string;
    href: string;
    active: boolean;
    collapsed: boolean;
}) {
    return (
        <button
            type="button"
            onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                    window.open(href, '_blank');
                } else {
                    router.visit(href);
                }
            }}
            title={collapsed ? label : undefined}
            className={clsx(
                'flex items-center rounded-xl text-xs sm:text-sm transition-all duration-200 group relative text-left cursor-pointer select-none',
                collapsed
                    ? 'w-10 h-10 mx-auto justify-center'
                    : 'w-full gap-3 px-3 py-2.5',
                active
                    ? 'bg-[#F61509] text-white shadow-md shadow-[#F61509]/25 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white font-medium',
            )}
        >
            {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/80 rounded-r-full" />
            )}
            <Icon
                className={clsx(
                    'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                    active ? 'scale-110 text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-105',
                )}
            />
            {!collapsed && <span className="truncate">{label}</span>}

            {/* Tooltip on hover when collapsed */}
            {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-slate-700/50">
                    {label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
            )}
        </button>
    );
}

function NavGroup({
    group,
    items,
    currentUrl,
    collapsed,
    index,
}: {
    group: string;
    items: any[];
    currentUrl: string;
    collapsed: boolean;
    index: number;
}) {
    return (
        <div className={clsx(collapsed ? 'mb-2' : 'mb-5')}>
            {collapsed ? (
                index > 0 && <div className="w-8 h-px bg-slate-200/80 dark:border-white/10 mx-auto my-2" />
            ) : (
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest px-3 mb-2">
                    {group}
                </p>
            )}
            <div className={clsx(collapsed ? 'space-y-1.5' : 'space-y-1')}>
                {items.map((item) => (
                    <NavItem
                        key={item.href}
                        {...item}
                        active={currentUrl === item.href || (item.href !== '/admin/dashboard' && currentUrl.startsWith(item.href))}
                        collapsed={collapsed}
                    />
                ))}
            </div>
        </div>
    );
}

export default function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const { url } = usePage();

    return (
        <aside
            className={clsx(
                'h-full flex flex-col bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 transition-all duration-300 ease-in-out relative flex-shrink-0 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)] dark:shadow-none z-30',
                collapsed ? 'w-[72px]' : 'w-64',
            )}
        >
            {/* Header: Brand Seal & Collapse Button */}
            <div
                className={clsx(
                    'h-16 flex items-center border-b border-slate-200/80 dark:border-white/10 flex-shrink-0',
                    collapsed ? 'justify-center px-2' : 'justify-between px-4',
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-slate-900/10 flex-shrink-0 ring-1 ring-slate-900/10 dark:ring-white/20 overflow-hidden">
                        <img src="/images/opol-logo.png" alt="Municipality of Opol" className="w-full h-full object-contain" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                                    MDRRMO
                                </h1>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F61509]/10 text-[#F61509] uppercase tracking-wider">
                                    HQ
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase truncate">
                                Executive Admin
                            </p>
                        </div>
                    )}
                </div>

                {/* Minimize Button INSIDE Sidebar Panel when Expanded */}
                {!collapsed && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Minimize / Expand Toggle Button INSIDE Sidebar Panel when Collapsed */}
            {collapsed && (
                <div className="py-2.5 px-3 border-b border-slate-100 dark:border-white/5 flex justify-center">
                    <button
                        type="button"
                        onClick={onToggle}
                        className="w-10 h-10 rounded-xl text-slate-600 hover:text-[#F61509] hover:bg-[#F61509]/10 dark:text-slate-300 dark:hover:text-[#F61509] dark:hover:bg-[#F61509]/15 flex items-center justify-center transition-all cursor-pointer group shadow-sm border border-slate-200/60 dark:border-white/10 relative"
                        title="Expand sidebar"
                    >
                        <PanelLeft className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-slate-700/50">
                            Expand sidebar
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                        </div>
                    </button>
                </div>
            )}

            {/* Navigation items */}
            <div
                className={clsx(
                    'flex-1 overflow-y-auto space-y-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10',
                    collapsed ? 'px-2 py-4' : 'px-3 py-5',
                )}
            >
                {navigation.map((section, idx) => (
                    <NavGroup
                        key={section.group}
                        {...section}
                        currentUrl={url}
                        collapsed={collapsed}
                        index={idx}
                    />
                ))}
            </div>
        </aside>
    );
}

