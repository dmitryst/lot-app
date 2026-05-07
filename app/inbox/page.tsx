import InboxClient from './InboxClient';

export const metadata = {
    title: 'Мои сообщения | s-lot.ru',
    description: 'Список ваших диалогов',
};

export default function InboxPage() {
    return <InboxClient />;
}
