import { Head } from '@inertiajs/react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import EmergencyServices from '@/components/landing/EmergencyServices';
import HowItWorks from '@/components/landing/HowItWorks';
import LiveOperationsPreview from '@/components/landing/LiveOperationsPreview';
import MobileAppSection from '@/components/landing/MobileAppSection';
import SystemRoles from '@/components/landing/SystemRoles';
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
                    content="Centralized emergency operations, 24/7 hotline triage, rapid ambulance dispatch, real-time GPS tracking, and digital pre-hospital patient care records for the Municipality of Opol, Misamis Oriental."
                />
            </Head>

            <div className="min-h-screen bg-[#080D19] text-slate-100 font-sans selection:bg-blue-600 selection:text-white antialiased overflow-x-hidden scroll-smooth">
                {/* Subtle Geometric Background Grid */}
                <div
                    className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, #38BDF8 1px, transparent 0)',
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
                    <LiveOperationsPreview />
                    <MobileAppSection />
                    <SystemRoles />
                    <CommunitySection />
                    <CallToAction />
                </main>

                {/* Government-Grade Footer */}
                <Footer />
            </div>
        </>
    );
}
