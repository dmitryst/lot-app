import React, { useState } from 'react';
import styles from './ContractModal.module.css';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotId: string;
}

export default function ContractModal({ isOpen, onClose, lotId }: ContractModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    passportSeriesNumber: '',
    passportIssuedBy: '',
    passportIssueDate: '',
    departmentCode: '',
    address: '',
    phone: '',
    email: '',
    maxPrice: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/contracts/generate/${lotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка при формировании договора. Проверьте введенные данные.');
      }

      // Получаем файл и скачиваем
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Договор_${lotId}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      onClose(); // Закрываем модалку после успеха
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h2>Данные для договора</h2>
        <p className={styles.description}>Пожалуйста, заполните ваши паспортные данные для автоматического формирования агентского договора.</p>
        
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>ФИО полностью</label>
            <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Иванов Иван Иванович" />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Серия и номер паспорта</label>
              <input required type="text" name="passportSeriesNumber" value={formData.passportSeriesNumber} onChange={handleChange} placeholder="1234 567890" />
            </div>
            <div className={styles.formGroup}>
              <label>Дата выдачи</label>
              <input required type="text" name="passportIssueDate" value={formData.passportIssueDate} onChange={handleChange} placeholder="01.01.2020" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Кем выдан</label>
              <input required type="text" name="passportIssuedBy" value={formData.passportIssuedBy} onChange={handleChange} placeholder="ГУ МВД России по г. Москве" />
            </div>
            <div className={styles.formGroup}>
              <label>Код подразделения</label>
              <input required type="text" name="departmentCode" value={formData.departmentCode} onChange={handleChange} placeholder="123-456" />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Адрес регистрации</label>
            <input required type="text" name="address" value={formData.address} onChange={handleChange} placeholder="г. Москва, ул. Пушкина, д. 1, кв. 1" />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Телефон</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+7 (999) 123-45-67" />
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ivanov@example.com" />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Лимит цены (руб.) - опционально</label>
            <input type="number" name="maxPrice" value={formData.maxPrice} onChange={handleChange} placeholder="Например: 1500000" />
          </div>

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Формирование...' : 'Сформировать и скачать'}
          </button>
        </form>
      </div>
    </div>
  );
}