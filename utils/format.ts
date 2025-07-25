export function formatMoney(value: string | number | null): string {
  if (value === null || value === undefined) {
    return '-';
  }

  // Преобразуем значение в число, если оно является строкой
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Проверяем, что после преобразования получилось валидное число
  if (isNaN(numericValue)) {
    return 'Некорректная цена';
  }

  const [rubleStr, kopeckStr] = numericValue.toFixed(2).split('.');
  const formattedRubles = parseInt(rubleStr, 10).toLocaleString('ru-RU');

  return kopeckStr !== '00'
    ? `${formattedRubles}.${kopeckStr} ₽`
    : `${formattedRubles} ₽`;
}
