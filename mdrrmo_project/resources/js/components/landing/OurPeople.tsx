import React from 'react';

export default function OurPeople() {
    const photoMaskStyle: React.CSSProperties = {
        WebkitMaskImage:
            'radial-gradient(ellipse 78% 72% at 50% 50%, black 44%, transparent 88%), linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
        maskImage:
            'radial-gradient(ellipse 78% 72% at 50% 50%, black 44%, transparent 88%), linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
        WebkitMaskComposite: 'source-in' as any,
        maskComposite: 'intersect' as any,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
    };

    return (
        <section
            id="our-people"
            className="relative w-full bg-[#070b14] overflow-hidden py-12 min-[900px]:py-0 min-[900px]:h-[600px] min-[900px]:min-h-[600px] flex items-center font-['Inter',sans-serif]"
        >
            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col min-[900px]:flex-row items-center justify-between min-[900px]:h-full gap-8 min-[900px]:gap-0">
                {/* LEFT (about 65% width): Team photo feathered into #070b14 with increased fade and zero visible corners */}
                <div className="w-full min-[900px]:w-[65%] min-[900px]:flex-[0_0_65%] flex items-center justify-center p-0 relative">
                    <div className="relative w-full max-w-[840px] flex items-center justify-center">
                        <img
                            src="/images/landing/opol-rescue-team.jpg"
                            alt="MDRRMO Opol Rescue and Emergency Medical Response Team"
                            className="w-full h-auto max-h-[520px] object-contain block select-none pointer-events-none"
                            style={photoMaskStyle}
                            loading="lazy"
                        />

                        {/* Corner & edge soft-fade guards into #070b14 ensuring absolutely no corner lines */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(ellipse 76% 70% at 50% 50%, transparent 46%, #070b14 90%)',
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT (about 30% width): Heading and paragraph, left-aligned and vertically centered */}
                <div className="w-full min-[900px]:w-[30%] min-[900px]:flex-[0_0_30%] flex flex-col items-start justify-center text-left gap-5">
                    {/* Heading: "Our People" */}
                    <h2
                        className="text-4xl sm:text-5xl min-[900px]:text-[52px] font-extrabold text-white leading-tight tracking-tight m-0 p-0"
                        style={{ color: '#ffffff' }}
                    >
                        Our People
                    </h2>

                    {/* Paragraph */}
                    <p
                        className="m-0 p-0"
                        style={{
                            color: '#cad5e2',
                            fontSize: '15px',
                            lineHeight: 1.75,
                        }}
                    >
                        Behind every emergency call, rapid ambulance dispatch, and lifesaving response is the unwavering dedication of the men and women of MDRRMO Opol. Composed of certified Emergency Medical Technicians (EMTs), disaster search and rescue specialists, professional drivers, and municipal dispatchers, our team remains on 24/7 rotational standby across all 14 barangays—standing ready in all weather conditions to protect the lives, safety, and well-being of every Opolanon.
                    </p>
                </div>
            </div>
        </section>
    );
}
