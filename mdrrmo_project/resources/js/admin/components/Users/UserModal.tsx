import Drawer from '@/shared/components/Drawer';
import Modal from '@/shared/components/Modal';
import UserForm from './UserForm';
import type { User } from './UserManagement';
import { toPascalCase } from '@/shared/utils/utils';

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
    const formattedName = user ? toPascalCase(`${user.first_name} ${user.last_name}`) : '';
    const title = user ? `Edit Staff • ${formattedName}` : 'Add New System User';
    const description = user
        ? 'Update operational role, team assignment, and credentials.'
        : 'Fill in the operational profile to provision a new staff account.';

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
            <Drawer
                open={open}
                onClose={onClose}
                title={title}
                description={description}
                width="w-full max-w-lg sm:max-w-xl"
            >
                {form}
            </Drawer>
        );
    }

    return (
        <Modal open={open} onClose={onClose} title={title} description={description} size="xl">
            {form}
        </Modal>
    );
}
