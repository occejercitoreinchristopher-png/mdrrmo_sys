import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Shield,
    AlertTriangle,
    Truck,
    Heart,
    ClipboardList,
    Siren,
    ChevronRight,
    Users,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, MapPin } from 'lucide-react';
import ThemeToggle from '@/shared/components/ThemeToggle';

function NavItem({ icon: Icon, label, href, active, badge, subItems, currentUrl }) {
    const isSubActive = subItems?.some(sub => currentUrl === sub.href || (sub.href.includes('?') && currentUrl.includes(sub.href.split('?')[1])));
    const [isOpen, setIsOpen] = useState(isSubActive || false);

    const content = (
        <>
            {/* Active left bar */}
            {(active || isSubActive) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-rose-400 rounded-r-full" />
            )}
            <Icon
                className={clsx(
                    'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                    (active || isSubActive) ? 'text-rose-200 scale-110' : 'group-hover:scale-110 group-hover:text-rose-300',
                )}
            />
            <span className="truncate flex-1 text-left">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className={clsx(
                    'px-2 py-0.5 text-[10px] font-bold rounded-full ml-auto',
                    (active || isSubActive) ? 'bg-white text-rose-600 shadow-sm' : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                )}>
                    {badge}
                </span>
            )}
            {subItems && (
                <ChevronDown className={clsx("w-3 h-3 ml-auto text-rose-300/60 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
            )}
        </>
    );

    const btnClass = clsx(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden outline-none',
        (active || (!subItems && isSubActive))
            ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-500/25 font-medium border border-rose-500/30'
            : 'text-slate-600 hover:bg-rose-50/60 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200 border border-transparent',
    );

    return (
        <div className="flex flex-col w-full">
            {subItems ? (
                <button type="button" onClick={() => setIsOpen(!isOpen)} className={btnClass}>
                    {content}
                </button>
            ) : (
                <Link href={href} className={btnClass}>
                    {content}
                </Link>
            )}

            {/* SubItems */}
            {subItems && (
                <div className={clsx(
                    "flex flex-col space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out pl-4 pr-1 mt-0.5",
                    isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                )}>
                    <div className="border-l border-rose-500/20 ml-2.5 pl-2 space-y-0.5 mt-1">
                        {subItems.map((subItem) => {
                            const subActive = currentUrl === subItem.href || (subItem.href.includes('?') && currentUrl.includes(subItem.href.split('?')[1]));
                            return (
                                <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    className={clsx(
                                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-200',
                                        subActive
                                            ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-500/10 dark:text-rose-300'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300'
                                    )}
                                >
                                    <subItem.icon className={clsx("w-3.5 h-3.5", subActive ? "text-rose-400" : "text-slate-500")} />
                                    <span>{subItem.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function NavGroup({ group, items, currentUrl }) {
    return (
        <div className="mb-5">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-700/80 uppercase tracking-widest mb-1.5 px-3">
                {group}
            </p>
            <div className="space-y-0.5">
                {items.map((item) => (
                    <NavItem
                        key={item.label}
                        {...item}
                        active={!item.subItems && (
                            currentUrl === item.href || 
                            (item.href !== '/dispatcher/dashboard' && currentUrl.startsWith(item.href + '/')) ||
                            (item.href && item.href.includes('?') && currentUrl.includes(item.href.split('?')[1]))
                        )}
                        currentUrl={currentUrl}
                    />
                ))}
            </div>
        </div>
    );
}

export default function DispatcherSidebar({ collapsed, onToggle }) {
    const { url, props } = usePage();
    const incidentCounts = (props.incident_counts as any) || { active: 0, history: 0 };

    const navigation = [
        {
            group: 'Command Center',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, href: '/dispatcher/dashboard' },
            ],
        },
        {
            group: 'Emergency Ops',
            items: [
                { label: 'Incoming Incidents', icon: AlertTriangle, href: '/dispatcher/incidents?status=active', badge: incidentCounts.active },
                { label: 'Dispatch Center', icon: Truck, href: '/dispatcher/dispatches' },
                { 
                    label: 'Incident History', 
                    icon: ClipboardList, 
                    badge: incidentCounts.history,
                    subItems: [
                        { label: 'History Map', icon: MapPin, href: '/dispatcher/incidents/map' },
                        { label: 'Incident Records', icon: ClipboardList, href: '/dispatcher/incidents?status=history' },
                    ]
                },
                { label: 'Responders', icon: Shield, href: '/dispatcher/responders' },
            ],
        },
        {
            group: 'Community & Medical',
            items: [
                { label: 'Residents', icon: Users, href: '/dispatcher/residents' },
                { label: 'Patients', icon: Heart, href: '/dispatcher/patients' },
            ],
        },
        {
            group: 'Account',
            items: [
                { label: 'Profile', icon: User, href: '/profile' },
            ],
        },
    ];

    return (
        <aside
            className={clsx(
                'h-full flex flex-col border-r border-slate-200 dark:border-rose-500/10 transition-all duration-500 ease-in-out relative flex-shrink-0 overflow-hidden shadow-sm dark:shadow-none',
                collapsed ? 'w-0' : 'w-64',
                'bg-white dark:bg-[#080d1a]',
            )}
        >
            {/* Sidebar background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-40 bg-rose-500/5 dark:bg-rose-900/15 blur-2xl" />
            </div>

            {/* Logo / Header */}
            <div className="h-16 flex items-center px-5 border-b border-slate-200 dark:border-rose-500/10 flex-shrink-0 relative z-10">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                        <Siren className="w-5 h-5 text-white" />
                    </div>
                    {/* Pulsing ring */}
                    <span className="absolute -inset-1 rounded-xl border border-rose-500/40 animate-ping opacity-30" />
                </div>

                <div className="ml-3 overflow-hidden">
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate tracking-wide">
                        MDRRMO
                    </h1>
                    <p className="text-[10px] text-rose-600 dark:text-rose-400/70 truncate font-semibold tracking-widest uppercase">
                        Dispatcher Panel
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-5 space-y-0 relative z-10 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-rose-900/40">
                {navigation.map((section) => (
                    <NavGroup
                        key={section.group}
                        {...section}
                        currentUrl={url}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-rose-500/10 relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-600 font-medium">System Online</p>
                </div>
                <ThemeToggle />
            </div>
        </aside>
    );
}
