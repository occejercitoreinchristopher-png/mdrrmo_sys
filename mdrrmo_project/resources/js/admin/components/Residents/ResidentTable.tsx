import UserTable from '@/admin/components/Users/UserTable';
export { default as ResidentTable } from '@/admin/components/Users/UserTable';
export default function ResidentTable(props) {
    return <UserTable {...props} roleFilter="resident" />;
}
