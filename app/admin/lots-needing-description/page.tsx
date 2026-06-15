import AdminLotsClient from './AdminLotsClient';

export const metadata = {
    title: 'Лоты без описания имущества | s-lot.ru',
    description: 'Панель администратора',
};

export default function AdminLotsPage() {
    return <AdminLotsClient />;
}
