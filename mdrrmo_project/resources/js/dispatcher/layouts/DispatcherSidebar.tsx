import { router, usePage } from '@inertiajs/react';
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
    ChevronDown,
    MapPin,
    PanelLeft,
    PanelLeftClose,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

function NavItem({ icon: Icon, label, href, active, badge, subItems, currentUrl, collapsed }) {
    const isSubActive = subItems?.some(sub => currentUrl === sub.href || (sub.href.includes('?') && currentUrl.includes(sub.href.split('?')[1])));
    const [isOpen, setIsOpen] = useState(isSubActive || false);

    const isCurrentActive = active || (!subItems && isSubActive);

    const content = (
        <>
            {/* Active left bar */}
            {(isCurrentActive || isSubActive) && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/80 rounded-r-full" />
            )}
            <Icon
                className={clsx(
                    'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                    isCurrentActive
                        ? 'scale-110 text-white'
                        : isSubActive
                            ? 'text-[#F61509]'
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-105',
                )}
            />
            {!collapsed && (
                <>
                    <span className="truncate flex-1 text-left">{label}</span>
                    {badge !== undefined && badge > 0 && (
                        <span className={clsx(
                            'px-2 py-0.5 text-[10px] font-bold rounded-full ml-auto',
                            isCurrentActive ? 'bg-white text-[#F61509] shadow-sm' : 'bg-[#F61509]/10 text-[#F61509] border border-[#F61509]/20'
                        )}>
                            {badge}
                        </span>
                    )}
                    {subItems && (
                        <ChevronDown className={clsx("w-3.5 h-3.5 ml-auto text-slate-400 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
                    )}
                </>
            )}

            {/* Collapsed Tooltip */}
            {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-slate-700/50">
                    {label}
                    {badge !== undefined && badge > 0 && ` (${badge})`}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
            )}
        </>
    );

    const btnClass = clsx(
        'flex items-center rounded-xl text-xs sm:text-sm transition-all duration-200 group relative outline-none cursor-pointer select-none text-left',
        collapsed
            ? 'w-10 h-10 mx-auto justify-center'
            : 'w-full gap-3 px-3 py-2.5 overflow-hidden',
        isCurrentActive
            ? 'bg-[#F61509] text-white shadow-md shadow-[#F61509]/25 font-semibold'
            : isSubActive
                ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white font-medium',
    );

    return (
        <div className="flex flex-col w-full">
            {subItems && !collapsed ? (
                <button type="button" onClick={() => setIsOpen(!isOpen)} className={btnClass}>
                    {content}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                            window.open(href, '_blank');
                        } else {
                            router.visit(href);
                        }
                    }}
                    className={btnClass}
                    title={collapsed ? label : undefined}
                >
                    {content}
                </button>
            )}

            {/* SubItems (only shown when expanded) */}
            {subItems && !collapsed && (
                <div className={clsx(
                    "flex flex-col space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out pl-4 pr-1 mt-0.5",
                    isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                )}>
                    <div className="border-l border-slate-200 dark:border-white/10 ml-2.5 pl-2.5 space-y-0.5 mt-1">
                        {subItems.map((subItem) => {
                            const subActive = currentUrl === subItem.href || (subItem.href.includes('?') && currentUrl.includes(subItem.href.split('?')[1]));
                            return (
                                <button
                                    type="button"
                                    key={subItem.href}
                                    onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey) {
                                            window.open(subItem.href, '_blank');
                                        } else {
                                            router.visit(subItem.href);
                                        }
                                    }}
                                    className={clsx(
                                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer text-left',
                                        subActive
                                            ? 'bg-[#F61509]/10 text-[#F61509] font-semibold dark:bg-[#F61509]/20'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white font-medium'
                                    )}
                                >
                                    <subItem.icon className={clsx("w-3.5 h-3.5", subActive ? "text-[#F61509]" : "text-slate-400")} />
                                    <span>{subItem.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function NavGroup({ group, items, currentUrl, collapsed, index }) {
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
                        key={item.label}
                        {...item}
                        active={!item.subItems && (
                            currentUrl === item.href || 
                            (item.href !== '/dispatcher/dashboard' && currentUrl.startsWith(item.href + '/')) ||
                            (item.href && item.href.includes('?') && currentUrl.includes(item.href.split('?')[1]))
                        )}
                        currentUrl={currentUrl}
                        collapsed={collapsed}
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
            group: 'Main',
            items: [
                { label: 'Live Overview', icon: LayoutDashboard, href: '/dispatcher/dashboard' },
            ],
        },
        {
            group: 'Incident Response',
            items: [
                { 
                    label: 'Emergency Queue', 
                    icon: AlertTriangle, 
                    href: '/dispatcher/incidents',
                    badge: incidentCounts.active,
                    subItems: [
                        { label: 'Active Incidents', icon: Siren, href: '/dispatcher/incidents?status=active' },
                        { label: 'Incident Archive', icon: ClipboardList, href: '/dispatcher/incidents?status=history' },
                    ]
                },
                { label: 'Dispatch Center', icon: Truck, href: '/dispatcher/dispatches' },
                { label: 'Responders', icon: Shield, href: '/dispatcher/responders' },
            ],
        },
        {
            group: 'Registry',
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
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                        <img src="/images/opol-logo.png" alt="MDRRMO Opol" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>

                    {!collapsed && (
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                                    MDRRMO
                                </h1>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F61509]/10 text-[#F61509] uppercase tracking-wider">
                                    DISPATCH
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase truncate">
                                Dispatcher Panel
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

            {/* Navigation */}
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
