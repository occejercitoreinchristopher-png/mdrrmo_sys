import Modal from '@/shared/components/Modal';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import { useState } from 'react';

interface ResponderItem {
    id: string | number;
    first_name: string;
    last_name: string;
    [key: string]: any;
}

interface AssignResponderModalProps {
    open: boolean;
    onClose: () => void;
    onAssign: (id: string) => void;
    responders?: ResponderItem[];
    loading?: boolean;
}

export default function AssignResponderModal({
    open,
    onClose,
    onAssign,
    responders = [],
    loading = false,
}: AssignResponderModalProps) {
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
                id="assign_responder_select"
                label="Select Responder"
                value={responderId}
                onChange={setResponderId}
                options={responders.map((r) => ({ value: r.id, label: `${r.first_name} ${r.last_name}` }))}
                placeholder="Choose a responder..."
            />
        </Modal>
    );
}
