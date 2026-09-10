import { Siren, Ambulance, Navigation, ClipboardList } from 'lucide-react';

const services = [
    {
        title: 'Emergency Reporting',
        description: 'Report an emergency and provide responders with the information they need.',
        icon: Siren,
        color: 'from-rose-500/20 to-rose-600/10',
        borderColor: 'border-rose-500/20 hover:border-rose-500/40',
        iconColor: 'text-rose-400',
        iconBg: 'bg-rose-500/15',
    },
    {
        title: 'Rapid Dispatch',
        description: 'Coordinate responders and ambulances for faster emergency response.',
        icon: Ambulance,
        color: 'from-blue-500/20 to-blue-600/10',
        borderColor: 'border-blue-500/20 hover:border-blue-500/40',
        iconColor: 'text-blue-400',
        iconBg: 'bg-blue-500/15',
    },
    {
        title: 'Live Response Monitoring',
        description: 'Monitor emergency response operations and responder locations.',
        icon: Navigation,
        color: 'from-indigo-500/20 to-indigo-600/10',
        borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
        iconColor: 'text-indigo-400',
        iconBg: 'bg-indigo-500/15',
    },
    {
        title: 'Medical Records',
        description: 'Maintain organized patient care and emergency medical records.',
        icon: ClipboardList,
        color: 'from-emerald-500/20 to-emerald-600/10',
        borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/15',
    },
];

export default function EmergencyServices() {
    return (
        <section id="services" className="relative py-16 md:py-24 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
                        Comprehensive Capabilities
                    </h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Emergency Services
                    </p>
                    <p className="mt-3 text-sm sm:text-base text-slate-400">
                        Centralized tools engineered to streamline life-saving medical responses across the Municipality of Opol.
                    </p>
                </div>

                {/* 4 Glass Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service) => {
                        const Icon = service.icon;
                        return (
                            <div
                                key={service.title}
                                className={`group relative rounded-2xl bg-gradient-to-b ${service.color} bg-[#0a1022]/60 p-6 border ${service.borderColor} backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${service.iconBg} ${service.iconColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-white/10`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
