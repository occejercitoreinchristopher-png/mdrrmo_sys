import { Menu, X, Bell, LogOut } from 'lucide-react';
import { Link, usePage, router } from '@inertiajs/react';
import ThemeToggle from './ThemeToggle';

export default function AdminNavbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const { auth } = usePage().props as any;

    const handleLogout = () => {
        router.post('/logout');
    };

    const user = auth?.user;
    const initials = user
        ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
        : 'AD';

    return (
        <header className="h-16 bg-white/90 dark:bg-[#090e1a]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between px-4 md:px-6 lg:px-8 flex-shrink-0 z-20 transition-colors duration-300">
            {/* Left Section: Mobile Sidebar Toggle */}
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
            </div>

            {/* Right Section: Theme Toggle & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Theme Mode Toggle (Light / Dark) */}
                <ThemeToggle />

                {/* User Profile Pill */}
                <Link
                    href="/profile"
                    className="flex items-center gap-2.5 pl-3 border-l border-slate-200/80 dark:border-white/10 group cursor-pointer"
                    title="View My Profile"
                >
                    <div className="hidden md:block text-right">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                            {user
                                ? `${user.first_name} ${user.last_name}`
                                : 'Administrator'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight capitalize font-medium mt-0.5">
                            {String(user?.role ?? 'Administrator')}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform ring-1 ring-slate-900/10 dark:ring-white/20">
                        {initials}
                    </div>
                </Link>

                {/* Logout Button */}
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
