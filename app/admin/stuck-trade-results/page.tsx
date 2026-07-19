import StuckTradeResultsClient from './StuckTradeResultsClient';

export const metadata = {
    title: 'Зависшие результаты торгов | s-lot.ru',
    description: 'Панель администратора',
};

export default function StuckTradeResultsPage() {
    return <StuckTradeResultsClient />;
}
