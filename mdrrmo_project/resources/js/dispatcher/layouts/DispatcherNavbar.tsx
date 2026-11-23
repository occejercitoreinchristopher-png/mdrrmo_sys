import {
    Menu,
    X,
    Bell,
    LogOut,
    PhoneCall,
    Clock,
    AlertTriangle,
    Ambulance,
    UserCheck,
    CheckCircle2,
    Trash2,
    Info,
} from 'lucide-react';
import { usePage, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/shared/components/ThemeToggle';

interface DispatcherNotification {
    id: string;
    title: string;
    message: string;
    time: string;
    timestamp: number;
    read: boolean;
    type?: string;
}

const STORAGE_KEY = 'mdrrmo_dispatcher_notifications_v1';

export default function DispatcherNavbar({ collapsed, onToggle }) {
    const { auth } = usePage().props;
    const [notifOpen, setNotifOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const [notifications, setNotifications] = useState<DispatcherNotification[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {}
        return [];
    });

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Listen for real-time notifications dispatched across components
    useEffect(() => {
        const handleNewNotif = (e: any) => {
            const detail = e?.detail;
            if (!detail || !detail.title) return;

            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });

            const newItem: DispatcherNotification = {
                id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
                title: detail.title,
                message: detail.message || '',
                time: timeStr,
                timestamp: Date.now(),
                read: false,
                type: detail.type || 'info',
            };

            setNotifications((prev) => {
                const updated = [newItem, ...prev.filter((n) => n.id !== newItem.id)].slice(0, 40);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch {}
                return updated;
            });
        };

        window.addEventListener('dispatcher-notification', handleNewNotif);
        return () => {
            window.removeEventListener('dispatcher-notification', handleNewNotif);
        };
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleToggleNotif = () => {
        const nextState = !notifOpen;
        setNotifOpen(nextState);

        // When opened, automatically mark all notifications as read so the red bell light turns OFF!
        if (nextState && unreadCount > 0) {
            setNotifications((prev) => {
                const updated = prev.map((n) => ({ ...n, read: true }));
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch {}
                return updated;
            });
        }
    };

    const handleClearAll = () => {
        setNotifications([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {}
    };

    const timeStr = currentTime.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    const dateStr = currentTime.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
    });

    const handleLogout = () => {
        router.post('/logout');
    };

    const user = auth?.user;
    const initials = user
        ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
        : 'DP';

    return (
        <header className="h-16 bg-white/90 dark:bg-[#090e1a]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between px-4 md:px-6 lg:px-8 flex-shrink-0 z-20 transition-colors duration-300">
            {/* Left Section */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggle}
                    className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <Menu className="w-5 h-5" />
                    ) : (
                        <X className="w-5 h-5" />
                    )}
                </button>

                {/* Live status indicator */}
                <div className="hidden sm:flex items-center gap-2 bg-[#F61509]/10 border border-[#F61509]/20 rounded-full px-3 py-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F61509] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F61509]" />
                    </span>
                    <span className="text-[11px] font-bold text-[#F61509] tracking-wider uppercase">DISPATCH LIVE</span>
                </div>

                {/* Live Accurate Real-Time Clock */}
                <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-1 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm tabular-nums" title="Real-time synchronized local clock">
                    <Clock className="w-3.5 h-3.5 text-[#F61509]" />
                    <span suppressHydrationWarning>{mounted ? `${dateStr} • ${timeStr}` : '—'}</span>
                </div>

                {/* Quick Phone Call Button */}
                <button
                    onClick={() => router.get('/dispatcher/incidents?create_call=1')}
                    className="flex items-center gap-1.5 bg-[#F61509] hover:bg-[#d91207] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md shadow-[#F61509]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Record an incoming phone/SIM emergency call"
                >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">+ Phone/SIM Call</span>
                </button>
            </div>

            {/* Right Section: Alerts, Theme Toggle, Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Alert bell */}
                <div className="relative">
                    <button
                        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={handleToggleNotif}
                        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
                    >
                        <Bell className="w-4 h-4" />
                        {/* Only light up with pulsing indicator if there are unread notifications! */}
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F61509] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F61509] ring-2 ring-white dark:ring-[#090e1a]" />
                            </span>
                        )}
                    </button>
                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-300/50 dark:shadow-black/70 border border-slate-200/80 dark:border-white/10 z-50 overflow-hidden backdrop-blur-xl">
                                <div className="p-3 border-b border-slate-200/80 dark:border-white/10 flex justify-between items-center bg-slate-50/90 dark:bg-slate-800/90">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-3.5 h-3.5 text-[#F61509]" />
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                            Notifications
                                        </h4>
                                        {unreadCount > 0 ? (
                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#F61509] text-white rounded-full">
                                                {unreadCount} new
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                                                All Read
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={handleClearAll}
                                                className="text-[10px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                                                title="Clear notification history"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>Clear</span>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setNotifOpen(false)}
                                            className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 px-4 text-center">
                                            <CheckCircle2 className="w-7 h-7 text-emerald-500/70 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No active notifications</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                Incoming emergency calls and responder status changes will appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const isEmergency = n.type === 'emergency';
                                            const isDispatch = n.type === 'dispatch';
                                            const isResponder = n.type === 'responder';
                                            const isHotline = n.type === 'hotline' || n.type === 'call';

                                            const IconComponent = isEmergency
                                                ? AlertTriangle
                                                : isDispatch
                                                ? Ambulance
                                                : isResponder
                                                ? UserCheck
                                                : isHotline
                                                ? PhoneCall
                                                : Info;

                                            const iconColor = isEmergency
                                                ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                                                : isDispatch
                                                ? 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                                                : isResponder
                                                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                                : isHotline
                                                ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                                : 'text-slate-400 bg-slate-500/10 border-slate-500/20';

                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`p-2.5 rounded-xl border transition-all ${
                                                        !n.read
                                                            ? 'bg-red-50/60 dark:bg-red-950/25 border-red-200 dark:border-red-900/40 shadow-xs'
                                                            : 'bg-white dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <div className={`p-1.5 rounded-lg border flex-shrink-0 mt-0.5 ${iconColor}`}>
                                                            <IconComponent className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                                    {n.title}
                                                                </p>
                                                                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                                                                    {n.time}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                                                                {n.message}
                                                            </p>
                                                        </div>
                                                        {!n.read && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#F61509] flex-shrink-0 mt-1.5" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>


                {/* Theme Mode Toggle (Light / Dark) */}
                <ThemeToggle />

                {/* User Profile Pill */}
                <Link
                    href="/profile"
                    className="flex items-center gap-2.5 pl-3 border-l border-slate-200/80 dark:border-white/10 group cursor-pointer"
                    title="View My Profile"
                >
                    <div className="hidden md:block text-right">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#F61509] transition-colors leading-tight">
                            {user ? `${user.first_name} ${user.last_name}` : 'Dispatcher'}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight capitalize font-medium mt-0.5">
                            {String(user?.role ?? 'Dispatcher')}
                        </p>
                    </div>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform ring-1 ring-slate-900/10 dark:ring-white/20 overflow-hidden">
                        {user?.profile_photo_url ? (
                            <img src={user.profile_photo_url as string} alt="" className="w-full h-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
