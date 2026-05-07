// app/add-ad/AddAdClient.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './add-ad.module.css';

export default function AddAdClient() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<File[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка выбора файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Фильтруем только картинки
      const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
      
      // Добавляем к уже выбранным, но не больше 10
      setImages(prev => {
        const combined = [...prev, ...imageFiles];
        return combined.slice(0, 10);
      });
    }
  };

  // Удаление выбранной картинки
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
      
      // ВАЖНО: используем FormData для отправки файлов
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      
      images.forEach(image => {
        formData.append('images', image);
      });

      const res = await fetch(`${apiUrl}/api/ads`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Обязательно для отправки куки/авторизации
      });

      if (res.status === 401) {
        // Если не авторизован - кидаем на логин
        router.push('/login?returnUrl=/add-ad');
        return;
      }

      if (!res.ok) {
        throw new Error('Не удалось сохранить объявление. Проверьте данные.');
      }

      // Успешно! Редиректим на главную (или можно на страницу "Мои объявления")
      router.push('/?success=ad_created');
      
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при отправке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.heading}>Новое объявление</h1>
        <p className={styles.subtitle}>Заполните форму, чтобы разместить объект недвижимости</p>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.formGroup}>
            <label>Название объекта *</label>
            <input 
              type="text" 
              required 
              maxLength={200}
              placeholder="Например: Помещение свободного назначения 150 м²"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Цена (₽) *</label>
            <input 
              type="number" 
              required 
              min="1"
              placeholder="0"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Описание *</label>
            <textarea 
              required 
              rows={6}
              maxLength={2000}
              placeholder="Опишите характеристики, расположение, состояние..."
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </div>

          {/* БЛОК ЗАГРУЗКИ ФОТО */}
          <div className={styles.formGroup}>
            <label>Фотографии (до 10 шт.)</label>
            <div className={styles.imageUploadArea}>
              <button 
                type="button" 
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                + Выбрать фото
              </button>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className={styles.hiddenInput}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <span className={styles.uploadHint}>JPG, PNG до 5 МБ</span>
            </div>

            {/* ПРЕВЬЮ КАРТИНОК */}
            {images.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {images.map((img, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img src={URL.createObjectURL(img)} alt={`preview ${index}`} />
                    <button 
                      type="button" 
                      className={styles.removeImgBtn}
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? 'Публикация...' : 'Опубликовать объявление'}
          </button>
        </form>
      </div>
    </div>
  );
}