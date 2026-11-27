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

            const dispatchNotification = (title: string, message: string, type = 'info') => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('dispatcher-notification', {
                            detail: { title, message, type },
                        })
                    );
                }
            };

            const handleEvent = (message: string, title?: string, type = 'info') => {
                toast.success(message);
                dispatchNotification(title || 'System Notification', message, type);
                router.reload();
            };

            const events = [
                { name: 'IncidentCreated', title: 'New Incident', msg: 'A new emergency incident was reported.', type: 'created' },
                { name: 'IncidentVerified', title: 'Incident Verified', msg: 'Incident has been verified.', type: 'verified' },
                { name: 'IncidentCancelled', title: 'Report Cancelled', msg: 'An emergency report was cancelled by the resident.', type: 'cancelled' },
                { name: 'IncidentRejected', title: 'Report Closed', msg: 'An incident report was rejected or cancelled.', type: 'rejected' },
                { name: 'DispatchCreated', title: 'New Dispatch', msg: 'New dispatch created successfully.', type: 'dispatch' },
                { name: 'DispatchAccepted', title: 'Dispatch Accepted', msg: 'A responder has accepted the dispatch.', type: 'dispatch' },
                { name: 'DispatchStatusUpdated', title: 'Dispatch Updated', msg: 'Dispatch status updated.', type: 'dispatch' },
                { name: 'ResponderStatusUpdated', title: 'Responder Update', msg: 'A responder updated their status.', type: 'responder' },
                { name: 'LeaveRequestSubmitted', title: 'Leave Request', msg: 'New leave request submitted.', type: 'leave' },
                { name: 'LeaveApproved', title: 'Leave Approved', msg: 'Leave request approved.', type: 'leave' },
                { name: 'PatientCareRecordSubmitted', title: 'PCR Submitted', msg: 'New Patient Care Record submitted.', type: 'pcr' },
                { name: 'DispatchCompleted', title: 'Dispatch Complete', msg: 'A dispatch has been completed.', type: 'dispatch' },
            ];

            events.forEach(({ name, title, msg, type }) => {
                channel.listen(name, () => handleEvent(msg, title, type));
                channel.listen(`.${name}`, () => handleEvent(msg, title, type));
            });

            const handleResidentCallResponder = (e: any) =>
                handleEvent(
                    `Resident ${e?.resident_name || ''} is calling the responder for Incident #${e?.incident_id || 'Unknown'}! Location updated.`,
                    'Resident Call',
                    'call'
                );
            channel.listen('ResidentCalledResponder', handleResidentCallResponder);
            channel.listen('.ResidentCalledResponder', handleResidentCallResponder);

            const handleResidentCallHotline = (e: any) => {
                if (e && e.latitude && e.longitude) {
                    try {
                        const callData = {
                            resident_id: e.resident_id,
                            resident_name: e.resident_name,
                            phone_number: e.phone_number,
                            latitude: Number(e.latitude),
                            longitude: Number(e.longitude),
                            timestamp: Date.now(),
                        };
                        sessionStorage.setItem('active_hotline_call', JSON.stringify(callData));
                        window.dispatchEvent(new CustomEvent('active-hotline-call-updated', { detail: callData }));
                    } catch {}
                }
                handleEvent(
                    `Resident ${e?.resident_name || ''} is calling the MDRRMO Hotline! Location: [${e?.latitude}, ${e?.longitude}]`,
                    '📞 Hotline Call',
                    'hotline'
                );
            };
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
