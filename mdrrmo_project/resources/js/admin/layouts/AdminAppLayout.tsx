import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import FlashMessageListener from '@/shared/components/FlashMessageListener';

export default function AdminAppLayout({ children, title = 'Admin Portal', Sidebar, Navbar }) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('admin_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const toggleSidebar = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('admin_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    // Real-time Reverb WebSocket listener for Admin portal
    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.Echo) {
            // @ts-ignore
            const channel = window.Echo.private('dispatcher');

            const handleEvent = (message: string, eventTitle?: string) => {
                toast.info(message, {
                    description: eventTitle,
                    duration: 4000,
                });
                router.reload({ preserveScroll: true, preserveState: true });
            };

            const events = [
                { name: 'IncidentCreated', title: 'New Incident', msg: 'A new emergency report was received.' },
                { name: 'IncidentVerified', title: 'Incident Verified', msg: 'An incident has been verified.' },
                { name: 'IncidentCancelled', title: 'Report Cancelled', msg: 'An emergency report was cancelled.' },
                { name: 'IncidentRejected', title: 'Report Closed', msg: 'An emergency report was rejected or closed.' },
                { name: 'DispatchCreated', title: 'New Dispatch', msg: 'New emergency dispatch created.' },
                { name: 'DispatchAccepted', title: 'Dispatch Accepted', msg: 'A responder accepted the dispatch.' },
                { name: 'DispatchStatusUpdated', title: 'Dispatch Updated', msg: 'Dispatch status was updated.' },
                { name: 'ResponderStatusUpdated', title: 'Responder Update', msg: 'A responder updated their availability status.' },
                { name: 'PatientCareRecordSubmitted', title: 'PCR Submitted', msg: 'New Patient Care Record submitted.' },
                { name: 'DispatchCompleted', title: 'Dispatch Complete', msg: 'An emergency dispatch was completed.' },
                { name: 'LeaveRequestSubmitted', title: 'Leave Request', msg: 'New responder leave request submitted.' },
                { name: 'LeaveApproved', title: 'Leave Approved', msg: 'Leave request approved.' },
            ];

            events.forEach(({ name, title, msg }) => {
                channel.listen(name, () => handleEvent(msg, title));
                channel.listen(`.${name}`, () => handleEvent(msg, title));
            });

            return () => {
                events.forEach(({ name }) => {
                    channel.stopListening(name);
                    channel.stopListening(`.${name}`);
                });
            };
        }
    }, []);

    return (
        <ThemeProvider>
            <Head title={title} />
            <FlashMessageListener />
            <div className="flex h-screen print:h-auto print:block bg-[#fafbfc] dark:bg-[#070b14] print:bg-white text-slate-900 dark:text-slate-100 overflow-hidden print:overflow-visible font-sans transition-colors duration-300">
                {/* Expensive White Architectural Background Grid & Diffused Lighting */}
                <div className="print:hidden absolute inset-0 pointer-events-none overflow-hidden select-none">
                    {/* Soft luxury ambient highlights */}
                    <div className="absolute -top-48 -right-48 w-[34rem] h-[34rem] bg-blue-500/[0.03] dark:bg-blue-600/[0.07] rounded-full blur-3xl" />
                    <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-500/[0.02] dark:bg-indigo-600/[0.05] rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-slate-400/[0.02] dark:bg-slate-500/[0.03] rounded-full blur-3xl" />

                    {/* Subtle architectural luxury micro-dot pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.025]"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                </div>

                {/* Sidebar */}
                {Sidebar && <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative print:block print:w-full">
                    {Navbar && <Navbar collapsed={collapsed} onToggle={toggleSidebar} />}

                    <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 print:p-0 print:overflow-visible relative scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                        <div className="max-w-7xl mx-auto space-y-6 print:space-y-0 print:max-w-none print:w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
