import Drawer from '@/shared/components/Drawer';
import Modal from '@/shared/components/Modal';
import UserForm from './UserForm';
import type { User } from './UserManagement';

interface UserModalProps {
    open: boolean;
    onClose: () => void;
    user?: User | null;
    onSubmit: (form: any) => void;
    loading?: boolean;
    errors?: any;
    allowedRoles?: string[];
    mode?: 'modal' | 'drawer';
}

export default function UserModal({
    open,
    onClose,
    user = null,
    onSubmit,
    loading = false,
    errors = {},
    allowedRoles = ['dispatcher', 'responder'],
    mode = 'drawer', // 'modal' | 'drawer'
}: UserModalProps) {
    const title = user ? 'Edit User' : 'Add New User';
    const description = user
        ? `Update details for ${user.first_name} ${user.last_name}`
        : 'Fill in the form to create a new user.';

    const form = (
        <UserForm
            user={user}
            onSubmit={onSubmit}
            onCancel={onClose}
            loading={loading}
            errors={errors}
            allowedRoles={allowedRoles}
        />
    );

    if (mode === 'drawer') {
        return (
            <Drawer open={open} onClose={onClose} title={title} description={description}>
                {form}
            </Drawer>
        );
    }

    return (
        <Modal open={open} onClose={onClose} title={title} description={description} size="lg">
            {form}
        </Modal>
    );
}
