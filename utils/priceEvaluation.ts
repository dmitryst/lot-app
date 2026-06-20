type LotPriceFields = {
  marketValueMin?: number | null;
  marketValueMax?: number | null;
  marketValue?: number | null;
  priceConfidence?: string | null;
};

const NON_EVALUABLE_CATEGORIES = new Set([
  'Доли в уставном капитале',
  'Ценные бумаги',
  'Готовый бизнес',
  'Имущественный комплекс',
  'Дебиторская задолженность',
]);

export function isPriceEvaluable(priceConfidence?: string | null): boolean {
  return priceConfidence?.toLowerCase() !== 'not_evaluable';
}

export function isCategoryPriceEvaluable(categories?: { name: string }[] | null): boolean {
  if (!categories?.length) {
    return true;
  }

  return !categories.some((category) => NON_EVALUABLE_CATEGORIES.has(category.name));
}

export function shouldShowPriceEstimate(
  lot: LotPriceFields & { categories?: { name: string }[] | null }
): boolean {
  return isPriceEvaluable(lot.priceConfidence) && isCategoryPriceEvaluable(lot.categories);
}

export function getWeightedMarketPrice(lot: LotPriceFields & { categories?: { name: string }[] | null }): number | null {
  if (!shouldShowPriceEstimate(lot)) {
    return null;
  }

  if (lot.marketValueMin != null && lot.marketValueMax != null) {
    return lot.marketValueMin * 0.7 + lot.marketValueMax * 0.3;
  }

  if (lot.marketValueMin != null) {
    return lot.marketValueMin;
  }

  if (lot.marketValue != null) {
    return lot.marketValue;
  }

  return null;
}

export function getConfidenceClass(conf?: string | null): string {
  switch (conf?.toLowerCase()) {
    case 'high':
      return 'confidenceHigh';
    case 'medium':
      return 'confidenceMedium';
    case 'low':
      return 'confidenceLow';
    case 'not_evaluable':
      return 'confidenceNotEvaluable';
    default:
      return 'confidenceMedium';
  }
}

export function getConfidenceLabel(conf?: string | null): string {
  switch (conf?.toLowerCase()) {
    case 'high':
      return 'Высокая точность оценки';
    case 'medium':
      return 'Средняя точность';
    case 'low':
      return 'Низкая точность (мало данных)';
    case 'not_evaluable':
      return 'Автооценка недоступна для этого типа лота';
    default:
      return 'Точность оценки';
  }
}
