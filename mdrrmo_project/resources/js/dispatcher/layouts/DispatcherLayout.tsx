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

            channel.listen('IncidentVerified', () => handleEvent('Incident has been verified.'));
            channel.listen('DispatchCreated', () => handleEvent('New dispatch created successfully.'));
            channel.listen('DispatchAccepted', () => handleEvent('A responder has accepted the dispatch.'));
            channel.listen('DispatchStatusUpdated', () => handleEvent('Dispatch status updated.'));
            // AmbulanceLocationUpdated is handled specifically by LiveMonitoringMap without page reload
            channel.listen('ResponderStatusUpdated', () => handleEvent('A responder updated their status.'));
            channel.listen('LeaveRequestSubmitted', () => handleEvent('New leave request submitted.'));
            channel.listen('LeaveApproved', () => handleEvent('Leave request approved.'));
            channel.listen('PatientCareRecordSubmitted', () => handleEvent('New Patient Care Record submitted.'));
            channel.listen('DispatchCompleted', () => handleEvent('A dispatch has been completed.'));
            channel.listen('ResidentCalledResponder', (e: any) => handleEvent(`Resident ${e?.resident_name || ''} is calling the responder for Incident #${e?.incident_id || 'Unknown'}! Location updated.`));
            channel.listen('ResidentCalledHotline', (e: any) => handleEvent(`Resident ${e?.resident_name || ''} is calling the MDRRMO Hotline! Location: [${e?.latitude}, ${e?.longitude}]`));

            return () => {
                channel.stopListening('IncidentVerified');
                channel.stopListening('DispatchCreated');
                channel.stopListening('DispatchAccepted');
                channel.stopListening('DispatchStatusUpdated');
                channel.stopListening('AmbulanceLocationUpdated');
                channel.stopListening('.AmbulanceLocationUpdated');
                channel.stopListening('ResponderStatusUpdated');
                channel.stopListening('LeaveRequestSubmitted');
                channel.stopListening('LeaveApproved');
                channel.stopListening('PatientCareRecordSubmitted');
                channel.stopListening('DispatchCompleted');
                channel.stopListening('ResidentCalledResponder');
                channel.stopListening('ResidentCalledHotline');
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
