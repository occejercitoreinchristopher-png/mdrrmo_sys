import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    Radio,
    Shield,
    AlertTriangle,
    Truck,
    Ambulance,
    Heart,
    ClipboardList,
    MapPin,
    BarChart3,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
    {
        group: 'Main',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, href: '/dispatcher/dashboard' },
        ],
    },
    {
        group: 'Operations',
        items: [
            { label: 'Incoming Incidents', icon: AlertTriangle, href: '/dispatcher/incidents' },
            { label: 'Dispatch Center', icon: Truck, href: '/dispatcher/dispatches' },
            { label: 'Responders', icon: Shield, href: '/dispatcher/responders' },
        ],
    },
    {
        group: 'Medical',
        items: [
            { label: 'Patients', icon: Heart, href: '/dispatcher/patients' },
            { label: 'Care Records', icon: ClipboardList, href: '/dispatcher/patient-care-records' },
        ],
    },
];

function NavItem({ icon: Icon, label, href, active }) {
    return (
        <Link
            href={href}
            className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group',
                active
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 font-medium'
                    : 'text-slate-400 hover:bg-white/8 hover:text-white',
            )}
        >
            <Icon
                className={clsx(
                    'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                    active ? 'scale-110' : 'group-hover:scale-110',
                )}
            />
            <span className="truncate">{label}</span>
        </Link>
    );
}

function NavGroup({ group, items, currentUrl }) {
    return (
        <div className="mb-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 px-3">
                {group}
            </p>
            <div className="space-y-0.5">
                {items.map((item) => (
                    <NavItem
                        key={item.href}
                        {...item}
                        active={currentUrl.startsWith(item.href)}
                    />
                ))}
            </div>
        </div>
    );
}

export default function DispatcherSidebar({ collapsed, onToggle }) {
    const { url } = usePage();

    return (
        <aside
            className={clsx(
                'h-full flex flex-col bg-white/5 backdrop-blur-xl border-r border-white/10 transition-all duration-500 ease-in-out relative flex-shrink-0',
                collapsed ? 'w-0 overflow-hidden' : 'w-64',
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div className="ml-3 overflow-hidden">
                    <h1 className="text-sm font-bold text-white leading-tight truncate">
                        MDRRMO
                    </h1>
                    <p className="text-xs text-slate-500 truncate">
                        Dispatcher Panel
                    </p>
                </div>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {navigation.map((section) => (
                    <NavGroup
                        key={section.group}
                        {...section}
                        currentUrl={url}
                    />
                ))}
            </div>

            {/* Version */}
            <div className="px-5 py-3 border-t border-white/10">
                <p className="text-xs text-slate-600">MDRRMO v1.0</p>
            </div>
        </aside>
    );
}
