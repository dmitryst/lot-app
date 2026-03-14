'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './alerts.module.css';

// Импортируем компоненты UI
import CategorySelect from '@/components/CategorySelect';
import RegionSelect from '@/components/RegionSelect';
import ClearableInput from '@/components/ui/ClearableInput';

// Импортируем дерево с кодами
import { REGIONS_TREE, CATEGORIES_TREE, BIDDING_TYPES } from '@/app/data/constants';
import Link from 'next/link';

interface LotAlert {
    id: string;
    regionCodes: string[];
    categories: string[];
    minPrice: number | null;
    maxPrice: number | null;
    biddingType: string | null;
    isSharedOwnership: boolean | null;
    deliveryTimeStr?: string;
    isActive: boolean;
}

// === Вспомогательные функции для кодов регионов ===
const mapRegionNamesToCodes = (regionNames: string[]) => {
    const codes: string[] = [];
    REGIONS_TREE.forEach(district => {
        district.children?.forEach(region => {
            if (regionNames.includes(region.name) && region.code) {
                codes.push(region.code);
            }
        });
    });
    return codes;
};

const mapCodesToRegionNames = (regionCodes: string[]) => {
    const names: string[] = [];
    REGIONS_TREE.forEach(district => {
        district.children?.forEach(region => {
            if (region.code && regionCodes.includes(region.code)) {
                names.push(region.name);
            }
        });
    });
    return names;
};

const formatNumber = (value: string | number | null) => {
    if (value === null || value === undefined || value === '') return '';
    const cleanValue = String(value).replace(/\D/g, '');
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export default function AlertsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [alerts, setAlerts] = useState<LotAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProError, setIsProError] = useState(false);

    // Состояние формы
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

    // Поля формы (названия регионов, а не коды, чтобы Select их правильно понял)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [biddingType, setBiddingType] = useState<string>('Все');
    const [isSharedOwnership, setIsSharedOwnership] = useState<string | null>(null);
    const [deliveryTime, setDeliveryTime] = useState<string>('09:00');

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lotalerts`, {
                credentials: 'include'
            });

            if (res.status === 403) {
                setIsProError(true);
            } else if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login?returnUrl=/alerts');
            return;
        }
        fetchAlerts();
    }, [user, authLoading, router]);

    const handleOpenCreateForm = () => {
        setEditingAlertId(null);
        setSelectedCategories([]);
        setSelectedRegions([]);
        setMinPrice('');
        setMaxPrice('');
        setBiddingType('Все');
        setIsSharedOwnership(null);
        setDeliveryTime('09:00');
        setIsFormOpen(true);
    };

    const handleOpenEditForm = (alert: LotAlert) => {
        setEditingAlertId(alert.id);
        setSelectedCategories(alert.categories || []);
        // Конвертируем коды из БД обратно в названия для RegionSelect
        setSelectedRegions(mapCodesToRegionNames(alert.regionCodes || []));
        setMinPrice(alert.minPrice ? formatNumber(alert.minPrice) : '');
        setMaxPrice(alert.maxPrice ? formatNumber(alert.maxPrice) : '');
        setBiddingType(alert.biddingType || 'Все');
        setIsSharedOwnership(alert.isSharedOwnership === true ? 'true' : (alert.isSharedOwnership === false ? 'false' : null));
        setDeliveryTime(alert.deliveryTimeStr || '09:00');
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (selectedCategories.length === 0 && selectedRegions.length === 0) {
            alert("Подписка слишком широкая. Укажите хотя бы один регион или категорию!");
            return;
        }

        // Конвертируем названия регионов из селекта в коды для БД
        const regionCodes = mapRegionNamesToCodes(selectedRegions);

        // Конвертация строкового стейта в bool для бекенда
        const sharedOwnershipBool = isSharedOwnership === 'true' ? true : (isSharedOwnership === 'false' ? false : null as boolean | null);

        const payload = {
            categories: selectedCategories.length > 0 ? selectedCategories : null,
            regionCodes: regionCodes.length > 0 ? regionCodes : null,
            minPrice: minPrice ? parseFloat(minPrice.replace(/\D/g, '')) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice.replace(/\D/g, '')) : null,
            biddingType: biddingType === 'Все' ? null : biddingType,
            isSharedOwnership: sharedOwnershipBool,
            deliveryTimeStr: deliveryTime,
            isActive: true
        };

        const method = editingAlertId ? 'PUT' : 'POST';
        const url = editingAlertId
            ? `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lotalerts/${editingAlertId}`
            : `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lotalerts`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsFormOpen(false);
                fetchAlerts();
            } else {
                const err = await res.json();
                alert(err.message || 'Ошибка сохранения');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Удалить эту подписку?")) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lotalerts/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleActive = async (alert: LotAlert) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lotalerts/${alert.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    categories: alert.categories,
                    regionCodes: alert.regionCodes,
                    minPrice: alert.minPrice,
                    maxPrice: alert.maxPrice,
                    biddingType: alert.biddingType,
                    isSharedOwnership: alert.isSharedOwnership,
                    deliveryTime: alert.deliveryTimeStr,
                    isActive: !alert.isActive
                })
            });
            fetchAlerts();
        } catch (e) {
            console.error(e);
        }
    };

    // Обработчики цен
    const handlePriceFromChange = (e: React.ChangeEvent<HTMLInputElement>) => setMinPrice(formatNumber(e.target.value));
    const handlePriceToChange = (e: React.ChangeEvent<HTMLInputElement>) => setMaxPrice(formatNumber(e.target.value));
    const handleClearPriceFrom = () => setMinPrice('');
    const handleClearPriceTo = () => setMaxPrice('');

    if (authLoading || loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Загрузка...</div>;

    if (isProError) {
        return (
            <main className={styles.container}>
                <div className={styles.proBanner}>
                    <h2>Доступно только в Pro</h2>
                    <p>Настройка email-уведомлений о новых лотах доступна только пользователям с активной подпиской Pro.</p>
                    <Link href="/subscribe" className={styles.subscribeButton}>
                        Оформить подписку
                    </Link>
                </div>
            </main>
        );
    }


    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Мои подписки на лоты</h1>
                {!isFormOpen && (
                    <button className={styles.createButton} onClick={handleOpenCreateForm}>
                        + Создать подписку
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className={styles.formModal}>
                    <div className={styles.modalHeader}>
                        <h2>{editingAlertId ? 'Редактировать подписку' : 'Новая подписка'}</h2>
                        <button className={styles.actionBtn} onClick={() => setIsFormOpen(false)}>✕ Закрыть</button>
                    </div>

                    <div className={styles.formGrid}>

                        {/* Регионы */}
                        <div className={styles.regionsArea}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Местонахождение имущества</label>
                                <RegionSelect
                                    regions={REGIONS_TREE}
                                    selectedRegions={selectedRegions}
                                    onChange={setSelectedRegions}
                                />
                            </div>
                        </div>

                        {/* Категории */}
                        <div className={styles.categoriesArea}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Категории</label>
                                <CategorySelect
                                    categories={CATEGORIES_TREE}
                                    selectedCategories={selectedCategories}
                                    onChange={setSelectedCategories}
                                />
                            </div>
                        </div>

                        {/* Вид торгов */}
                        <div className={styles.typeArea}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabelInline}>Вид торгов</label>
                                <div className={styles.filterOptions}>
                                    <button
                                        onClick={() => setBiddingType('Все')}
                                        className={biddingType === 'Все' ? styles.activeFilter : styles.filterButton}
                                    >
                                        Все
                                    </button>
                                    {BIDDING_TYPES.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setBiddingType(type)}
                                            className={biddingType === type ? styles.activeFilter : styles.filterButton}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Собственность */}
                        <div className={styles.ownershipArea}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabelInline}>Собственность</label>
                                <div className={styles.filterOptions}>
                                    <button
                                        onClick={() => setIsSharedOwnership(null)}
                                        className={!isSharedOwnership ? styles.activeFilter : styles.filterButton}
                                    >
                                        Все
                                    </button>
                                    <button
                                        onClick={() => setIsSharedOwnership('false')}
                                        className={isSharedOwnership === 'false' ? styles.activeFilter : styles.filterButton}
                                    >
                                        Целиком
                                    </button>
                                    <button
                                        onClick={() => setIsSharedOwnership('true')}
                                        className={isSharedOwnership === 'true' ? styles.activeFilter : styles.filterButton}
                                    >
                                        Только доли
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Цена */}
                        <div className={styles.priceArea}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Начальная цена, ₽</label>
                                <div className={styles.priceFilterInputs}>
                                    <ClearableInput
                                        value={minPrice}
                                        onChange={handlePriceFromChange}
                                        onClear={handleClearPriceFrom}
                                        placeholder="От"
                                    />
                                    <span className={styles.priceSeparator}>—</span>
                                    <ClearableInput
                                        value={maxPrice}
                                        onChange={handlePriceToChange}
                                        onClear={handleClearPriceTo}
                                        placeholder="До"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Время отправки */}
                        <div className={styles.timeArea} style={{ gridArea: 'time', width: '100%' }}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Время получения письма (МСК)</label>
                                <select
                                    className={styles.input}
                                    style={{ height: '42px', padding: '0 16px', borderRadius: '8px', border: '1px solid #cbd5e0', background: '#fff' }}
                                    value={deliveryTime}
                                    onChange={(e) => setDeliveryTime(e.target.value)}
                                >
                                    <option value="08:00">08:00</option>
                                    <option value="09:00">09:00</option>
                                    <option value="10:00">10:00</option>
                                    <option value="12:00">12:00</option>
                                    <option value="15:00">15:00</option>
                                    <option value="18:00">18:00</option>
                                    <option value="20:00">20:00</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className={styles.formActions}>
                        <button className={styles.cancelBtn} onClick={() => setIsFormOpen(false)}>Отмена</button>
                        <button className={styles.createButton} onClick={handleSave}>Сохранить</button>
                    </div>
                </div>
            )}

            {!isFormOpen && alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#f7fafc', borderRadius: '12px' }}>
                    <p style={{ color: '#718096', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        У вас пока нет настроенных подписок.
                    </p>
                    <p style={{ color: '#a0aec0', fontSize: '0.95rem' }}>
                        Настройте фильтры (например, "Квартиры в Москве до 10 млн"), и мы будем присылать уведомления, когда появится подходящий лот.
                    </p>
                </div>
            ) : (
                <div className={styles.alertsGrid}>
                    {alerts.map(alert => (
                        <div key={alert.id} className={`${styles.alertCard} ${!alert.isActive ? styles.inactive : ''}`}>
                            <h3>Подписка {alert.isActive ? '✅' : '⏸️'}</h3>

                            <p className={styles.alertDetail}>
                                <span>Категории:</span> {alert.categories?.length ? alert.categories.join(', ') : 'Все'}
                            </p>
                            <p className={styles.alertDetail}>
                                {/* При отображении карточки показываем названия вместо кодов */}
                                <span>Регионы:</span> {alert.regionCodes?.length ? mapCodesToRegionNames(alert.regionCodes).join(', ') : 'Все РФ'}
                            </p>
                            <p className={styles.alertDetail}>
                                <span>Вид торгов:</span> {alert.biddingType || 'Все'}
                            </p>
                            <p className={styles.alertDetail}>
                                <span>Собственность:</span> {alert.isSharedOwnership === true ? 'Только доли' : alert.isSharedOwnership === false ? 'Целиком' : 'Все'}
                            </p>
                            <p className={styles.alertDetail}>
                                <span>Цена:</span> {alert.minPrice ? `от ${alert.minPrice.toLocaleString('ru-RU')}` : ''} {alert.maxPrice ? `до ${alert.maxPrice.toLocaleString('ru-RU')}` : ''}
                                {!alert.minPrice && !alert.maxPrice && 'Любая'}
                            </p>
                            <p className={styles.alertDetail}>
                                <span>Время рассылки:</span> {alert.deliveryTimeStr || '09:00'} (МСК)
                            </p>

                            <div className={styles.cardActions}>
                                <button className={styles.actionBtn} onClick={() => handleToggleActive(alert)}>
                                    {alert.isActive ? 'Приостановить' : 'Включить'}
                                </button>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className={styles.actionBtn} onClick={() => handleOpenEditForm(alert)}>Изменить</button>
                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(alert.id)}>Удалить</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
