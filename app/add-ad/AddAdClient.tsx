// app/add-ad/AddAdClient.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './add-ad.module.css';
import MapPicker from './MapPicker';
import { REGIONS_TREE, CATEGORIES_TREE } from '../data/constants';

export default function AddAdClient() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
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

  // Форматирование цены (разделение тысяч)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Удаляем все нецифровые символы
    const rawValue = e.target.value.replace(/\D/g, '');
    setPrice(rawValue);
  };

  const formatPrice = (val: string) => {
    if (!val) return '';
    return val.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
      formData.append('region', region);
      formData.append('category', category);
      
      if (coordinates) {
        formData.append('latitude', coordinates[0].toString());
        formData.append('longitude', coordinates[1].toString());
      }
      
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
        const errorData = await res.json().catch(() => null);
        console.error('Ошибка сервера:', errorData);
        
        let errorMessage = 'Не удалось сохранить объявление. Проверьте данные.';
        if (errorData && errorData.errors) {
            const messages = Object.values(errorData.errors).flat();
            errorMessage = messages.join(' ');
        } else if (errorData && errorData.title) {
            errorMessage = errorData.title;
        } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }

      // Успешно! Редиректим на страницу "Мои объявления" (или каталог)
      router.push('/ads?success=ad_created');
      
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
            <label>Категория *</label>
            <select 
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={styles.selectInput}
            >
              <option value="" disabled>Выберите категорию</option>
              {CATEGORIES_TREE.find(c => c.name === 'Недвижимость')?.children?.map(sub => (
                <option key={sub.name} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Регион *</label>
            <select 
              required
              value={region}
              onChange={e => setRegion(e.target.value)}
              className={styles.selectInput}
            >
              <option value="" disabled>Выберите регион</option>
              {REGIONS_TREE.map(district => (
                <optgroup key={district.name} label={district.name}>
                  {district.children?.map(reg => (
                    <option key={reg.name} value={reg.name}>
                      {reg.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Цена (₽) *</label>
            <input 
              type="text" 
              required 
              placeholder="0"
              value={formatPrice(price)} 
              onChange={handlePriceChange} 
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

          <div className={styles.formGroup}>
            <label>Адрес объекта и расположение на карте</label>
            <MapPicker 
              address={address}
              setAddress={setAddress}
              coordinates={coordinates}
              setCoordinates={setCoordinates}
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