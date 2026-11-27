import { router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Shield,
    AlertTriangle,
    Truck,
    Heart,
    ClipboardList,
    Siren,
    Users,
    User,
    ChevronDown,
    MapPinned,
    PanelLeft,
    PanelLeftClose,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

// Scoped load of Inter font for enterprise sidebar typography
if (typeof document !== 'undefined' && !document.getElementById('inter-font-sidebar')) {
    const link = document.createElement('link');
    link.id = 'inter-font-sidebar';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
}

interface SubItem {
    label: string;
    icon: any;
    href: string;
}

interface NavItemProps {
    icon: any;
    label: string;
    href: string;
    active: boolean;
    badge?: number;
    subItems?: SubItem[];
    currentUrl: string;
    collapsed: boolean;
}

function NavItem({ icon: Icon, label, href, active, badge, subItems, currentUrl, collapsed }: NavItemProps) {
    const checkSubActive = (subHref: string) => {
        if (!currentUrl) return false;
        if (currentUrl === subHref) return true;
        if (subHref.includes('?')) {
            const [, query] = subHref.split('?');
            if (currentUrl.includes(query)) return true;
            if (subHref === '/dispatcher/incidents?status=active' && (currentUrl === '/dispatcher/incidents' || currentUrl === '/dispatcher/incidents/')) {
                return true;
            }
        }
        return false;
    };

    const isSubActive = subItems?.some(sub => checkSubActive(sub.href)) ?? false;
    const [isOpen, setIsOpen] = useState(isSubActive);

    useEffect(() => {
        if (isSubActive) {
            setIsOpen(true);
        }
    }, [isSubActive]);

    const isDirectActive = active;

    const content = (
        <>
            <Icon
                className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    isDirectActive
                        ? 'text-white'
                        : isSubActive
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                )}
            />
            {!collapsed && (
                <>
                    <span
                        className={clsx(
                            'truncate flex-1 text-left text-[14px] leading-none transition-all',
                            isDirectActive ? 'font-semibold' : 'font-medium'
                        )}
                    >
                        {label}
                    </span>
                    {badge !== undefined && badge > 0 && (
                        <span
                            className={clsx(
                                'px-1.5 py-0.5 text-[11px] font-semibold rounded-full transition-colors leading-none',
                                isDirectActive
                                    ? 'bg-white text-red-600 shadow-xs'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            )}
                        >
                            {badge}
                        </span>
                    )}
                    {subItems && (
                        <ChevronDown
                            className={clsx(
                                'w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ml-1',
                                isOpen ? 'rotate-180 text-slate-600 dark:text-slate-300' : ''
                            )}
                        />
                    )}
                </>
            )}

            {/* Collapsed Tooltip */}
            {collapsed && (
                <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs font-medium rounded-md shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-slate-800 whitespace-nowrap">
                    {label}
                    {badge !== undefined && badge > 0 && ` (${badge})`}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
            )}
        </>
    );

    const btnClass = clsx(
        'flex items-center transition-colors duration-150 group relative outline-none cursor-pointer select-none text-left',
        collapsed
            ? 'w-9 h-9 mx-auto justify-center rounded-lg'
            : 'w-full gap-2.5 px-2.5 py-2 rounded-lg',
        isDirectActive
            ? 'bg-red-600 text-white font-semibold shadow-xs'
            : isSubActive
                ? 'bg-slate-200/70 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
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
                    className={btnClass}
                    title={collapsed ? label : undefined}
                >
                    {content}
                </button>
            )}

            {/* SubItems (Submenu tree when expanded) */}
            {subItems && !collapsed && (
                <div
                    className={clsx(
                        'flex flex-col overflow-hidden transition-all duration-200 ease-in-out pl-3.5 pr-1',
                        isOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
                    )}
                >
                    <div className="border-l border-slate-200 dark:border-slate-800 ml-2 pl-2.5 space-y-1 py-0.5">
                        {subItems.map((subItem) => {
                            const subActive = checkSubActive(subItem.href);
                            const SubIcon = subItem.icon;
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
                                        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-150 cursor-pointer text-left',
                                        subActive
                                            ? 'bg-red-600 text-white font-semibold shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 font-normal'
                                    )}
                                >
                                    <SubIcon
                                        className={clsx(
                                            'w-3.5 h-3.5 shrink-0 transition-colors',
                                            subActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                                        )}
                                    />
                                    <span className="truncate leading-none">{subItem.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function NavGroup({ group, items, currentUrl, collapsed, index }: any) {
    return (
        <div className={clsx(collapsed ? 'mb-2' : 'mb-4', index === 0 ? 'mt-0.5' : '')}>
            {collapsed ? (
                index > 0 && <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-2" />
            ) : (
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1.5 select-none">
                    {group}
                </p>
            )}
            <div className={clsx(collapsed ? 'space-y-1' : 'space-y-0.5')}>
                {items.map((item: any) => (
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

export default function DispatcherSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const { url, props } = usePage();
    const incidentCounts = (props.incident_counts as any) || { active: 0, history: 0 };

    const navigation = [
        {
            group: 'Main',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, href: '/dispatcher/dashboard' },
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
                        { label: 'Incident Heatmap', icon: MapPinned, href: '/dispatcher/accident-heatmap' },
                        { label: 'Incident Records', icon: ClipboardList, href: '/dispatcher/incidents?status=history' },
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
                "h-full flex flex-col bg-white dark:bg-[#080d1a] border-r border-slate-200 dark:border-slate-800/80 transition-all duration-200 ease-in-out relative shrink-0 z-30 select-none font-['Inter',-apple-system,BlinkMacSystemFont,sans-serif] antialiased",
                collapsed ? 'w-[68px]' : 'w-[260px]'
            )}
        >
            {/* Header: Brand Seal & Collapse Button */}
            <div
                className={clsx(
                    'h-15 flex items-center border-b border-slate-200/80 dark:border-slate-800/80 shrink-0',
                    collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                )}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <img
                            src="/images/opol-logo.png"
                            alt="MDRRMO Opol"
                            className="w-full h-full object-contain drop-shadow-xs"
                        />
                    </div>

                    {!collapsed && (
                        <div className="overflow-hidden min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[16px] font-semibold text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                                    MDRRMO
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-mono uppercase tracking-wider">
                                    CAD
                                </span>
                            </div>
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-normal tracking-normal truncate leading-none mt-1">
                                Dispatcher Panel
                            </p>
                        </div>
                    )}
                </div>

                {/* Collapse Button INSIDE Sidebar Panel when Expanded */}
                {!collapsed && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Expand Toggle Button INSIDE Sidebar Panel when Collapsed */}
            {collapsed && (
                <div className="py-2 px-2 border-b border-slate-100 dark:border-slate-800/50 flex justify-center">
                    <button
                        type="button"
                        onClick={onToggle}
                        className="w-9 h-9 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer group relative"
                        title="Expand sidebar"
                    >
                        <PanelLeft className="w-4 h-4" />
                        <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs font-medium rounded-md shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-slate-800 whitespace-nowrap">
                            Expand sidebar
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                        </div>
                    </button>
                </div>
            )}

            {/* Navigation Scrollable Body */}
            <div
                className={clsx(
                    'flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800',
                    collapsed ? 'px-2 py-3' : 'px-2.5 py-3.5'
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
