// Файл: app/login/page.tsx

import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    // Оборачиваем клиентский компонент в Suspense.
    // fallback - это то, что увидит пользователь во время загрузки.
    <Suspense fallback={<div>Загрузка...</div>}>
      <LoginForm />
    </Suspense>
  );
}
