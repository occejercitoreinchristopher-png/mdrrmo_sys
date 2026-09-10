import Modal from '@/shared/components/Modal';
import PatientCareForm from './PatientCareForm';
import Button from '@/shared/components/Button';

export default function PatientCareModal({ open, onClose, record = null, onSubmit, loading = false, errors = {} }) {
    return (
        <Modal open={open} onClose={onClose} title={record ? 'Edit Care Record' : 'Add Care Record'} size="md">
            <PatientCareForm record={record} onSubmit={onSubmit} onCancel={onClose} loading={loading} errors={errors} />
        </Modal>
    );
}
