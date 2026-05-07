'use client';

import { useState, useEffect, useRef } from 'react';
import { Map, Placemark } from '@pbe/react-yandex-maps';
import styles from './add-ad.module.css';

interface MapPickerProps {
    address: string;
    setAddress: (val: string) => void;
    coordinates: [number, number] | null;
    setCoordinates: (val: [number, number] | null) => void;
}

export default function MapPicker({ address, setAddress, coordinates, setCoordinates }: MapPickerProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const mapRef = useRef<any>(null);

    // Центр карты по умолчанию (Москва)
    const defaultCenter = [55.751574, 37.573856];
    const DADATA_API_KEY = process.env.NEXT_PUBLIC_DADATA_API_KEY || '';

    // Поиск подсказок по мере ввода через DaData
    useEffect(() => {
        if (!address || !showSuggestions || !DADATA_API_KEY) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Token ${DADATA_API_KEY}`
                    },
                    body: JSON.stringify({ query: address, count: 5 })
                });
                const data = await res.json();
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            } catch (e) {
                console.error('Ошибка DaData suggest', e);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [address, showSuggestions, DADATA_API_KEY]);

    // Обработка выбора подсказки
    const handleSelectSuggestion = (suggestion: any) => {
        setAddress(suggestion.value);
        setShowSuggestions(false);
        setSuggestions([]);

        const lat = suggestion.data?.geo_lat;
        const lon = suggestion.data?.geo_lon;

        if (lat && lon) {
            const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
            setCoordinates(coords);
            mapRef.current?.setCenter(coords, 15, { duration: 300 });
        }
    };

    // Обработка клика по карте (обратное геокодирование через DaData)
    const handleMapClick = async (e: any) => {
        const coords = e.get('coords');
        setCoordinates(coords);

        if (!DADATA_API_KEY) return;

        try {
            const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Token ${DADATA_API_KEY}`
                },
                body: JSON.stringify({ lat: coords[0], lon: coords[1], count: 1 })
            });
            const data = await res.json();
            if (data.suggestions && data.suggestions.length > 0) {
                setAddress(data.suggestions[0].value);
                setShowSuggestions(false);
            }
        } catch (err) {
            console.error('Ошибка DaData geolocate', err);
        }
    };

    return (
        <div className={styles.mapPickerContainer}>
            {!DADATA_API_KEY && (
                <div style={{ color: 'orange', fontSize: '0.85rem', marginBottom: '8px' }}>
                    Внимание: Для работы подсказок адресов необходимо добавить NEXT_PUBLIC_DADATA_API_KEY в .env.local
                </div>
            )}
            <div className={styles.addressInputWrapper}>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                        setAddress(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Введите адрес объекта..."
                    className={styles.addressInput}
                    style={{ width: '100%' }}
                />
                {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                        {suggestions.map((item, index) => (
                            <li 
                                key={index} 
                                onClick={() => handleSelectSuggestion(item)}
                                className={styles.suggestionItem}
                            >
                                {item.value}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className={styles.mapWrapper}>
                <Map
                    instanceRef={mapRef}
                    defaultState={{ center: coordinates || defaultCenter, zoom: coordinates ? 15 : 9 }}
                    onClick={handleMapClick}
                    width="100%"
                    height="300px"
                >
                    {coordinates && (
                        <Placemark 
                            geometry={coordinates} 
                            options={{ preset: 'islands#blueDotIcon' }}
                        />
                    )}
                </Map>
                <div className={styles.mapHint}>
                    Нажмите на карту, чтобы указать точное местоположение объекта
                </div>
            </div>
        </div>
    );
}
