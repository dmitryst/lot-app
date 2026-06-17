'use client';

import { useEffect, useState } from 'react';

export interface VehicleFilterOptions {
    brands: string[];
    modelsByBrand: Record<string, string[]>;
}

const emptyOptions: VehicleFilterOptions = {
    brands: [],
    modelsByBrand: {},
};

export function useVehicleFilterOptions(enabled: boolean) {
    const [options, setOptions] = useState<VehicleFilterOptions>(emptyOptions);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setOptions(emptyOptions);
            setError(false);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
        if (!apiUrl) {
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(false);

            try {
                const res = await fetch(`${apiUrl}/api/lots/vehicle-filter-options`);
                if (!res.ok) {
                    throw new Error('Failed to load vehicle filter options');
                }

                const data = await res.json();
                if (cancelled) {
                    return;
                }

                setOptions({
                    brands: data.brands ?? [],
                    modelsByBrand: data.modelsByBrand ?? {},
                });
            } catch {
                if (!cancelled) {
                    setError(true);
                    setOptions(emptyOptions);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return { options, loading, error };
}
