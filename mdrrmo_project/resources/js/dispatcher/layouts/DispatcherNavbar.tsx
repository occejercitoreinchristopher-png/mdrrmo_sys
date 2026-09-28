import { Menu, X, Bell, LogOut, PhoneCall, Clock, Volume2 } from 'lucide-react';
import { usePage, router, Link } from '@inertiajs/react';
import { useState, useEffect, useContext } from 'react';
import ThemeToggle from '@/shared/components/ThemeToggle';
import { AlarmContext } from '../contexts/AlarmContext';

export default function DispatcherNavbar({ collapsed, onToggle }) {
    const { auth } = usePage().props;
    const { isPlaying, testAlarm } = useContext(AlarmContext);
    const [notifOpen, setNotifOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
                        onClick={() => setNotifOpen(!notifOpen)}
                        title="Notifications"
                    >
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F61509] rounded-full ring-2 ring-white dark:ring-[#090e1a] animate-pulse" />
                    </button>
                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/80 dark:border-white/10 z-50 overflow-hidden backdrop-blur-xl">
                                <div className="p-3 border-b border-slate-200/80 dark:border-white/10 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <Bell className="w-3.5 h-3.5 text-[#F61509]" /> Notifications
                                    </h4>
                                    <button 
                                        onClick={() => setNotifOpen(false)}
                                        className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto p-2">
                                    {/* Placeholder Notification */}
                                    <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer mb-1">
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">System Connected</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Live dispatch active. All systems are fully operational.</p>
                                    </div>
                                    <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                                        No more notifications
                                    </div>
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
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight capitalize font-medium mt-0.5">
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
