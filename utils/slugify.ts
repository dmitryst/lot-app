// utils/slugify.ts

const translitMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  ' ': '-', '.': '-', ',': '-', ':': '-', '/': '-',
  '№': 'n', '×': 'x'
};

export function generateSlug(text: string): string {
  if (!text) return 'lot';

  let slug = '';
  const lowerText = text.toLowerCase();

  for (let i = 0; i < lowerText.length; i++) {
    const char = lowerText[i];

    if (translitMap[char] !== undefined) {
      slug += translitMap[char];
    } else if (/[a-z0-9\-]/.test(char)) {
      slug += char;
    }
    // Остальные символы игнорируются
  }

  // Заменяем множественные дефисы на один
  slug = slug.replace(/-+/g, '-');

  // Убираем дефисы по краям перед проверкой длины
  slug = slug.replace(/^-|-$/g, '');

  // Увеличиваем лимит для большей информативности (как на бэкенде)
  const maxLength = 85;

  if (slug.length > maxLength) {
    // Ищем последний дефис в пределах лимита, чтобы не резать слово пополам
    const lastDashIndex = slug.lastIndexOf('-', maxLength);

    if (lastDashIndex > 0) {
      slug = slug.substring(0, lastDashIndex);
    } else {
      // Если дефисов нет (одно гигантское слово), режем жестко
      slug = slug.substring(0, maxLength);
    }
  }

  // Еще раз убираем дефисы с конца (если обрезка пришлась на дефис)
  slug = slug.replace(/-+$/, '');

  // убираем висячие предлоги на конце (i, v, s, k, o, u, na, po, za, do)
  slug = slug.replace(/-(i|v|s|k|o|u|na|po|za|do)$/, '');

  return slug || 'lot'; // Защита от пустой строки, если остались только спецсимволы
}