export default function EmergencyServices() {
    const services = [
        {
            title: 'Emergency Medical Response',
            description: 'Life-saving care on scene.',
            image: '/images/services/trauma-care.jpg',
            lineColor: 'bg-rose-500',
        },
        {
            title: '24/7 Ambulance Dispatch',
            description: '24/7 patient transport.',
            image: '/images/services/ambulance-dispatch.jpg',
            lineColor: 'bg-blue-500',
        },
        {
            title: 'Disaster Risk Reduction',
            description: 'Flood and landslide alerts.',
            image: '/images/services/disaster-risk.jpg',
            lineColor: 'bg-amber-500',
        },
        {
            title: 'Technical Rescue & Extrication',
            description: 'Road, water and building rescue.',
            image: '/images/services/technical-rescue.jpg',
            lineColor: 'bg-teal-500',
        },
        {
            title: 'Community Emergency Assistance',
            description: 'Help for all 14 barangays.',
            image: '/images/services/community-assistance.jpg',
            lineColor: 'bg-sky-500',
        },
        {
            title: 'Patient Care Records',
            description: 'Accurate patient records.',
            image: '/images/services/patient-records.jpg',
            lineColor: 'bg-purple-500',
        },
    ];

    return (
        <section id="services" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#070B14]">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/[0.04] rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        Our Services
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-slate-400 font-normal">
                        Ready to help, day and night.
                    </p>
                </div>

                {/* 6 Services Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div
                            key={service.title}
                            className="group relative rounded-2xl sm:rounded-3xl bg-[#0B101D] border border-slate-800/90 hover:border-slate-700/90 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between"
                        >
                            {/* Card Top: Real Photo */}
                            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                    loading="lazy"
                                />

                                {/* Subtle photo dark vignette overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B101D] via-transparent to-black/25 pointer-events-none" />

                                {/* Bottom Accent Line */}
                                <div className={`absolute bottom-0 inset-x-0 h-[2px] ${service.lineColor}`} />
                            </div>

                            {/* Card Bottom: Content */}
                            <div className="p-6 flex flex-col justify-start flex-grow">
                                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-300 transition-colors">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-slate-400 font-normal leading-relaxed m-0">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
