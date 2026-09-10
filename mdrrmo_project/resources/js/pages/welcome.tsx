import { Head } from '@inertiajs/react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import EmergencyServices from '@/components/landing/EmergencyServices';
import HowItWorks from '@/components/landing/HowItWorks';
import SystemRoles from '@/components/landing/SystemRoles';
import MobileAppSection from '@/components/landing/MobileAppSection';
import CommunitySection from '@/components/landing/CommunitySection';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';

export default function Welcome() {
    return (
        <>
            <Head>
                <title>MDRRMO Opol - Emergency Medical Services Management System</title>
                <meta
                    name="description"
                    content="Centralized emergency operations, ambulance dispatch, responder coordination, and emergency medical records management for the Municipality of Opol."
                />
            </Head>

            <div className="min-h-screen bg-[#080d1a] text-slate-100 font-sans selection:bg-rose-500 selection:text-white antialiased overflow-x-hidden scroll-smooth">
                {/* Fixed Subtle Grid Pattern */}
                <div
                    className="fixed inset-0 pointer-events-none opacity-[0.025] -z-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Navbar */}
                <Navbar />

                {/* Main Content Sections */}
                <main>
                    <HeroSection />
                    <EmergencyServices />
                    <HowItWorks />
                    <SystemRoles />
                    <MobileAppSection />
                    <CommunitySection />
                    <CallToAction />
                </main>

                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}
