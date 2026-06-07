// Файл: /components/VersionDisplay.tsx
'use client';

import { useEffect, useState } from 'react';

export default function VersionDisplay() {
  const [webApiVersion, setWebApiVersion] = useState('...');
  const [scraperVersion, setScraperVersion] = useState('...');

  useEffect(() => {
    async function fetchVersion() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/health/version`);
        if (res.ok) {
          const data = await res.json();
          setWebApiVersion(data.webApiVersion || data.version || 'unknown');
          setScraperVersion(data.scraperVersion || 'unknown');
        } else {
          setWebApiVersion('error');
          setScraperVersion('error');
        }
      } catch (error) {
        setWebApiVersion('n/a');
        setScraperVersion('n/a');
      }
    }

    fetchVersion();
  }, []);

  // Версия фронтенда (запекается при сборке Docker-образа)
  const frontendVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'local';

  return (
    <div style={{ fontSize: '0.8rem', color: '#718096' }}>
      <span>Frontend: {frontendVersion}</span> | <span>Backend: {webApiVersion}</span> | <span>{scraperVersion}</span>
    </div>
  );
}
