// Файл: /components/VersionDisplay.tsx
'use client';

import { useEffect, useState } from 'react';

export default function VersionDisplay() {
  const [backendVersion, setBackendVersion] = useState('...');

  useEffect(() => {
    async function fetchVersion() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/health/version`);
        if (res.ok) {
          const data = await res.json();
          setBackendVersion(data.Version);
        } else {
          setBackendVersion('error');
        }
      } catch (error) {
        setBackendVersion('n/a');
      }
    }

    fetchVersion();
  }, []);

  // Версия самого фронтенда (будет установлена при сборке)
  const frontendVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'local';

  return (
    <div style={{ fontSize: '0.8rem', color: '#718096' }}>
      <span>Frontend: {frontendVersion}</span> | <span>Backend: {backendVersion}</span>
    </div>
  );
}
