import Modal from '@/shared/components/Modal';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import { useState } from 'react';

export default function AssignAmbulanceModal({ open, onClose, onAssign, ambulances = [], loading = false }) {
    const [ambulanceId, setAmbulanceId] = useState('');

    return (
        <Modal open={open} onClose={onClose} title="Assign Ambulance" size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button loading={loading} onClick={() => onAssign(ambulanceId)} disabled={!ambulanceId}>Assign</Button>
                </>
            }
        >
            <Select
                label="Select Ambulance"
                value={ambulanceId}
                onChange={setAmbulanceId}
                options={ambulances.map((a) => ({ value: a.id, label: a.plate_number }))}
                placeholder="Choose an ambulance..."
            />
        </Modal>
    );
}
