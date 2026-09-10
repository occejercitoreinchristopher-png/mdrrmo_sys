import { Menu, X, Bell, Search, LogOut } from 'lucide-react';
import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Breadcrumb from './Breadcrumb';

export default function AdminNavbar({ collapsed, onToggle }) {
    const { auth } = usePage().props;
    const [searchOpen, setSearchOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    const user = auth?.user;
    const initials = user
        ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
        : 'A';

    return (
        <header className="h-16 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20">
            {/* Left */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggle}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    {collapsed ? (
                        <Menu className="w-5 h-5" />
                    ) : (
                        <X className="w-5 h-5" />
                    )}
                </button>
                <div className="hidden sm:block">
                    <Breadcrumb />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
                {/* Bell */}
                <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-900" />
                </button>

                {/* User */}
                <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-white/10">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-white leading-tight">
                            {user
                                ? `${user.first_name} ${user.last_name}`
                                : 'Admin'}
                        </p>
                        <p className="text-xs text-slate-500 leading-tight capitalize">
                            {user?.role ?? 'Administrator'}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {initials}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
