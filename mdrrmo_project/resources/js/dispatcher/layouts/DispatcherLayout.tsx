import DispatcherAppLayout from './DispatcherAppLayout';
import DispatcherSidebar from './DispatcherSidebar';
import DispatcherNavbar from './DispatcherNavbar';
import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import FlashMessageListener from '@/shared/components/FlashMessageListener';
import { AlarmProvider } from '../contexts/AlarmContext';
import AlarmManager from '../components/AlarmManager';

export default function DispatcherLayout({ children, title }) {
    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.Echo) {
            // @ts-ignore
            const channel = window.Echo.private('dispatcher');

            const handleEvent = (message: string) => {
                toast.success(message);
                router.reload();
            };

            const events = [
                { name: 'IncidentVerified', msg: 'Incident has been verified.' },
                { name: 'DispatchCreated', msg: 'New dispatch created successfully.' },
                { name: 'DispatchAccepted', msg: 'A responder has accepted the dispatch.' },
                { name: 'DispatchStatusUpdated', msg: 'Dispatch status updated.' },
                { name: 'ResponderStatusUpdated', msg: 'A responder updated their status.' },
                { name: 'LeaveRequestSubmitted', msg: 'New leave request submitted.' },
                { name: 'LeaveApproved', msg: 'Leave request approved.' },
                { name: 'PatientCareRecordSubmitted', msg: 'New Patient Care Record submitted.' },
                { name: 'DispatchCompleted', msg: 'A dispatch has been completed.' },
            ];

            events.forEach(({ name, msg }) => {
                channel.listen(name, () => handleEvent(msg));
                channel.listen(`.${name}`, () => handleEvent(msg));
            });

            const handleResidentCallResponder = (e: any) => handleEvent(`Resident ${e?.resident_name || ''} is calling the responder for Incident #${e?.incident_id || 'Unknown'}! Location updated.`);
            channel.listen('ResidentCalledResponder', handleResidentCallResponder);
            channel.listen('.ResidentCalledResponder', handleResidentCallResponder);

            const handleResidentCallHotline = (e: any) => handleEvent(`Resident ${e?.resident_name || ''} is calling the MDRRMO Hotline! Location: [${e?.latitude}, ${e?.longitude}]`);
            channel.listen('ResidentCalledHotline', handleResidentCallHotline);
            channel.listen('.ResidentCalledHotline', handleResidentCallHotline);

            return () => {
                events.forEach(({ name }) => {
                    channel.stopListening(name);
                    channel.stopListening(`.${name}`);
                });
                channel.stopListening('AmbulanceLocationUpdated');
                channel.stopListening('.AmbulanceLocationUpdated');
                channel.stopListening('ResidentCalledResponder');
                channel.stopListening('.ResidentCalledResponder');
                channel.stopListening('ResidentCalledHotline');
                channel.stopListening('.ResidentCalledHotline');
            };
        }
    }, []);

    return (
        <AlarmProvider>
            <AlarmManager />
            <FlashMessageListener />
            <DispatcherAppLayout title={title} Sidebar={DispatcherSidebar} Navbar={DispatcherNavbar}>
                {children}
            </DispatcherAppLayout>
        </AlarmProvider>
    );
}
