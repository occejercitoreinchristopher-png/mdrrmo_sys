export default function DashboardHeader() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const dateStr = now.toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const hour = now.getHours();
    const greeting =
        hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="mb-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {greeting},{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Admin
                        </span>
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Here's what's happening in MDRRMO today.
                    </p>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                    <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                        {timeStr}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
                </div>
            </div>
        </div>
    );
}
