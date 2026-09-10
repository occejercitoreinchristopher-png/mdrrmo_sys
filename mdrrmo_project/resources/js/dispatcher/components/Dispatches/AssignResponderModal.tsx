import Modal from '@/shared/components/Modal';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import { useState } from 'react';

export default function AssignResponderModal({ open, onClose, onAssign, responders = [], loading = false }) {
    const [responderId, setResponderId] = useState('');

    return (
        <Modal open={open} onClose={onClose} title="Assign Responder" size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button loading={loading} onClick={() => onAssign(responderId)} disabled={!responderId}>Assign</Button>
                </>
            }
        >
            <Select
                label="Select Responder"
                value={responderId}
                onChange={setResponderId}
                options={responders.map((r) => ({ value: r.id, label: `${r.first_name} ${r.last_name}` }))}
                placeholder="Choose a responder..."
            />
        </Modal>
    );
}
