// utils/slugify.ts
export function generateSlug(text: string): string {
  if (!text) return 'lot';

  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 
    'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 
    'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '.': '', ',': '', ':': '', '/': '-',
  };

  const slug = text.toLowerCase().split('').map(char => {
    // @ts-ignore
    return ru[char] || (/[a-z0-9\-]/.test(char) ? char : '');
  }).join('');

  return slug.replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}
