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
    PhoneCall,
    Phone,
    AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
    {
        group: 'Overview',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
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
            { label: 'Dispatch Logs', icon: PhoneCall, href: '/admin/dispatch-logs' },
            { label: 'Ambulance Fleet', icon: Ambulance, href: '/admin/ambulances' },
            { label: 'Barangays & Locations', icon: MapPin, href: '/admin/barangays' },
            { label: 'Emergency Hotlines', icon: Phone, href: '/admin/hotlines' },
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
            onMouseEnter={() => {
                try {
                    // @ts-ignore
                    if (typeof router.prefetch === 'function') {
                        // @ts-ignore
                        router.prefetch(href);
                    }
                } catch {}
            }}
            onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                    window.open(href, '_blank');
                } else {
                    router.visit(href);
                }
            }}
            title={collapsed ? label : undefined}
            className={clsx(
                'flex items-center rounded-xl text-xs sm:text-sm transition-all duration-150 group relative text-left cursor-pointer select-none',
                collapsed
                    ? 'w-10 h-10 mx-auto justify-center'
                    : 'w-full gap-3 px-3.5 py-2.5',
                active
                    ? 'bg-[#F61509] text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white font-medium',
            )}
        >
            <Icon
                className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    active
                        ? 'text-white'
                        : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white',
                )}
            />

            {!collapsed && (
                <span className={clsx('truncate text-[14px]', active ? 'font-semibold text-white' : 'font-medium')}>
                    {label}
                </span>
            )}

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
        <div className={clsx(collapsed ? 'mb-2' : 'mb-4')}>
            {collapsed ? (
                index > 0 && <div className="w-8 h-px bg-slate-200/80 dark:border-white/10 mx-auto my-2" />
            ) : (
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.14em] px-3 mb-1.5">
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
                'h-full flex flex-col bg-white/95 dark:bg-[#080d19]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 transition-all duration-300 ease-in-out relative flex-shrink-0 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)] dark:shadow-none z-30',
                collapsed ? 'w-[72px]' : 'w-64',
            )}
        >
            {/* Header: Brand Seal & Collapse Button */}
            <div
                className={clsx(
                    'h-16 flex items-center border-b border-slate-200/80 dark:border-white/10 flex-shrink-0',
                    collapsed ? 'justify-center px-2' : 'justify-between px-3.5',
                )}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <img src="/images/opol-logo.png" alt="MDRRMO Opol" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                                    MDRRMO
                                </h1>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#F61509] text-white uppercase tracking-wider shadow-xs">
                                    HQ
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase truncate">
                                    Executive Admin
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Minimize Button INSIDE Sidebar Panel when Expanded */}
                {!collapsed && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
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

