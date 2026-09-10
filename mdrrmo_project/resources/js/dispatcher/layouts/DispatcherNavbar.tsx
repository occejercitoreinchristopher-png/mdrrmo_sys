import { Menu, X, Bell, Radio, LogOut, Activity, PhoneCall } from 'lucide-react';
import { usePage, router, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function DispatcherNavbar({ collapsed, onToggle }) {
    const { auth } = usePage().props;
    const [notifOpen, setNotifOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    const user = auth?.user;
    const initials = user
        ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
        : 'D';

    return (
        <header className="h-16 bg-white/80 dark:bg-black/30 backdrop-blur-md border-b border-slate-200 dark:border-rose-500/15 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20">
            {/* Left */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggle}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                >
                    {collapsed ? (
                        <Menu className="w-5 h-5" />
                    ) : (
                        <X className="w-5 h-5" />
                    )}
                </button>

                {/* Live status pill */}
                <div className="hidden sm:flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full px-3 py-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-300 tracking-wide">DISPATCH LIVE</span>
                </div>

                {/* Quick Phone Call Button */}
                <button
                    onClick={() => router.get('/dispatcher/incidents?create_call=1')}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
                    title="Record an incoming phone/SIM emergency call"
                >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">+ Phone/SIM Call</span>
                </button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
                {/* Alert bell */}
                <button
                    className="relative p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 transition-colors"
                    onClick={() => setNotifOpen(!notifOpen)}
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#0a0f1e] animate-pulse" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

                {/* User info */}
                <Link
                    href="/profile"
                    className="flex items-center gap-2.5 group cursor-pointer"
                    title="View My Profile"
                >
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-rose-400 transition-colors leading-tight">
                            {user ? `${user.first_name} ${user.last_name}` : 'Dispatcher'}
                        </p>
                        <p className="text-xs text-rose-600 dark:text-rose-400/80 leading-tight capitalize font-semibold tracking-wide">
                            {String(user?.role ?? 'Dispatcher')}
                        </p>
                    </div>
                    {/* Avatar with rose ring */}
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-rose-500/30 group-hover:scale-105 transition-transform">
                            {initials}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0a0f1e]" />
                    </div>
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors ml-1"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
