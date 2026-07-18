import { FINAL_TRADE_STATUSES } from '@/app/data/constants';
import type { PriceSchedule } from '@/types';

const PUBLIC_OFFER_TYPE = 'Публичное предложение';

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
 * Текущая цена публичного предложения по графику снижения.
 * Возвращается только для активных торгов с заполненным графиком
 * (МЭТС, ЦДТ, Альфалот — для остальных площадок график не парсится).
 */
export function getCurrentSchedulePrice(lot: LotForCurrentPrice): number | null {
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

  return current?.price ?? null;
}
