import { User, Radio, HeartPulse, ShieldAlert } from 'lucide-react';

const roles = [
    {
        name: 'Resident',
        description: 'Report emergencies and monitor submitted incidents.',
        icon: User,
        color: 'from-emerald-500/20 to-teal-500/5',
        borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
        badge: 'Community Portal',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    {
        name: 'Dispatcher',
        description: 'Verify incidents, coordinate dispatches, and manage active emergencies.',
        icon: Radio,
        color: 'from-blue-500/20 to-indigo-500/5',
        borderColor: 'border-blue-500/20 hover:border-blue-500/40',
        badge: 'Command Center',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        iconBg: 'bg-blue-500/20 text-blue-400',
    },
    {
        name: 'Responder',
        description: 'Receive missions, navigate to incidents, update response status, and complete patient care records.',
        icon: HeartPulse,
        color: 'from-rose-500/20 to-orange-500/5',
        borderColor: 'border-rose-500/20 hover:border-rose-500/40',
        badge: 'Field Operations',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        iconBg: 'bg-rose-500/20 text-rose-400',
    },
    {
        name: 'Administrator',
        description: 'Manage users, barangays, ambulances, incident types, and system operations.',
        icon: ShieldAlert,
        color: 'from-purple-500/20 to-indigo-500/5',
        borderColor: 'border-purple-500/20 hover:border-purple-500/40',
        badge: 'System Governance',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        iconBg: 'bg-purple-500/20 text-purple-400',
    },
];

export default function SystemRoles() {
    return (
        <section id="roles" className="relative py-16 md:py-24 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
                        Tailored Interfaces
                    </h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        One System. Four Roles.
                    </p>
                    <p className="mt-3 text-sm sm:text-base text-slate-400">
                        Designed with role-specific workspaces to ensure seamless collaboration from the field to the municipal command center.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <div
                                key={role.name}
                                className={`rounded-2xl bg-gradient-to-b ${role.color} bg-[#0a1022]/60 p-6 border ${role.borderColor} backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-11 h-11 rounded-xl ${role.iconBg} flex items-center justify-center border border-white/10`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${role.badgeColor}`}>
                                            {role.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        {role.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {role.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
