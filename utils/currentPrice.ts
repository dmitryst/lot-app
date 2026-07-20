import { FINAL_TRADE_STATUSES } from '@/app/data/constants';
import type { PriceSchedule } from '@/types';

const PUBLIC_OFFER_TYPE = 'Публичное предложение';

export type CurrentScheduleStage = {
  price: number;
  startDate: string;
  endDate: string;
  number?: number;
};

export function isLotTradeActive(tradeStatus?: string | null): boolean {
  if (!tradeStatus) return true;
  return !FINAL_TRADE_STATUSES.includes(tradeStatus);
}

export function isCurrentPriceScheduleStage(
  startDate: string,
  endDate: string,
  now: Date = new Date()
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now < end;
}

type LotForCurrentPrice = {
  bidding?: { type?: string | null } | null;
  tradeStatus?: string | null;
  finalPrice?: number | null;
  priceSchedules?: PriceSchedule[] | null;
};

/**
 * Текущий этап публичного предложения по графику снижения.
 * Возвращается только для активных торгов с заполненным графиком
 * (МЭТС, ЦДТ, Альфалот — для остальных площадок график не парсится).
 */
export function getCurrentScheduleStage(
  lot: LotForCurrentPrice
): CurrentScheduleStage | null {
  if (lot.finalPrice) return null;
  if (lot.bidding?.type !== PUBLIC_OFFER_TYPE) return null;
  if (!isLotTradeActive(lot.tradeStatus)) return null;

  const schedules = lot.priceSchedules;
  if (!schedules?.length) return null;

  const now = new Date();
  const current = schedules.find(
    (s) =>
      s.price != null &&
      isCurrentPriceScheduleStage(s.startDate, s.endDate, now)
  );

  if (!current || current.price == null) return null;

  return {
    price: current.price,
    startDate: current.startDate,
    endDate: current.endDate,
    number: current.number,
  };
}

export function getCurrentSchedulePrice(lot: LotForCurrentPrice): number | null {
  return getCurrentScheduleStage(lot)?.price ?? null;
}

/** Период действия этапа: «18.07.2026 — 25.07.2026» */
export function formatSchedulePeriod(
  startDate: string,
  endDate: string,
  withTime = false
): string {
  const options: Intl.DateTimeFormatOptions = withTime
    ? {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    : {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      };

  const format = (value: string) =>
    withTime
      ? new Date(value).toLocaleString('ru-RU', options)
      : new Date(value).toLocaleDateString('ru-RU', options);

  return `${format(startDate)} — ${format(endDate)}`;
}
