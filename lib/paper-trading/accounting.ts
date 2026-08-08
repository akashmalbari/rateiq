import { PAPER_RULES } from "@/lib/paper-trading/config";
import type { OptionContract } from "@/lib/trading/types";
import type { PaperAccount, PaperPortfolioValues, PaperPosition } from "@/lib/paper-trading/types";

export function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return Number(value.toFixed(2));
}

export function sellOptionFill(bid: number, ask: number) {
  const spread = Math.max(ask - bid, 0);
  return Number(((bid + ask) / 2 - spread * PAPER_RULES.optionSpreadSlippagePct).toFixed(4));
}

export function buyOptionFill(bid: number, ask: number) {
  const spread = Math.max(ask - bid, 0);
  return Number(((bid + ask) / 2 + spread * PAPER_RULES.optionSpreadSlippagePct).toFixed(4));
}

export function buyUnderlyingFill(price: number) {
  return Number((price * (1 + PAPER_RULES.underlyingSlippageBps / 10_000)).toFixed(4));
}

export function sellUnderlyingFill(price: number) {
  return Number((price * (1 - PAPER_RULES.underlyingSlippageBps / 10_000)).toFixed(4));
}

export function findPositionContract(position: PaperPosition, contracts: OptionContract[]) {
  return contracts.find(
    (contract) =>
      contract.type === position.option_type &&
      contract.expirationDate === position.expiration_date &&
      Math.abs(contract.strike - numberValue(position.strike)) < 0.001
  );
}

export function positionUnrealizedPnl(
  position: PaperPosition,
  optionPrice = numberValue(position.current_option_price),
  underlyingPrice = numberValue(position.current_underlying_price)
) {
  const optionPnl = (numberValue(position.entry_option_price) - optionPrice) * 100;
  const stockPnl =
    (underlyingPrice - numberValue(position.entry_underlying_price)) * position.underlying_quantity;
  return money(optionPnl + stockPnl);
}

export function portfolioValues(
  account: PaperAccount,
  openPositions: PaperPosition[]
): PaperPortfolioValues {
  const cashBalance = numberValue(account.cash_balance);
  const reservedCollateral = openPositions.reduce(
    (sum, position) => sum + numberValue(position.collateral_reserved),
    0
  );
  const stockMarketValue = openPositions.reduce(
    (sum, position) =>
      sum + numberValue(position.current_underlying_price) * position.underlying_quantity,
    0
  );
  const optionLiability = openPositions.reduce(
    (sum, position) => sum + numberValue(position.current_option_price) * 100,
    0
  );
  const deployedCapital = openPositions.reduce(
    (sum, position) => sum + numberValue(position.capital_deployed),
    0
  );
  const unrealizedPnl = openPositions.reduce(
    (sum, position) => sum + positionUnrealizedPnl(position),
    0
  );

  return {
    cashBalance: money(cashBalance),
    availableCash: money(cashBalance - reservedCollateral),
    reservedCollateral: money(reservedCollateral),
    stockMarketValue: money(stockMarketValue),
    optionLiability: money(optionLiability),
    equity: money(cashBalance + stockMarketValue - optionLiability),
    deployedCapital: money(deployedCapital),
    unrealizedPnl: money(unrealizedPnl)
  };
}

export function daysToExpiration(expirationDate: string, now = new Date()) {
  const expiration = new Date(`${expirationDate}T20:00:00Z`);
  return Math.ceil((expiration.getTime() - now.getTime()) / 86_400_000);
}
