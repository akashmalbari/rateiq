import { completedCpi, LATEST_CPI_YEAR } from "@/lib/inflation/cpi-data";

interface BlsObservation {
  year: string;
  period: string;
  periodName: string;
  value: string;
}

interface BlsResponse {
  status?: string;
  Results?: {
    series?: Array<{ data?: BlsObservation[] }>;
  };
}

export interface LatestCpiSnapshot {
  year: number;
  month: string;
  value: number;
  source: "live" | "fallback";
}

const fallbackSnapshot: LatestCpiSnapshot = {
  year: LATEST_CPI_YEAR,
  month: "July",
  value: completedCpi(LATEST_CPI_YEAR) ?? 333.918,
  source: "fallback"
};

export async function getLatestCpiSnapshot(): Promise<LatestCpiSnapshot> {
  try {
    const response = await fetch(
      `https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0?startyear=${LATEST_CPI_YEAR}&endyear=${LATEST_CPI_YEAR}`,
      { next: { revalidate: 86_400 } }
    );
    if (!response.ok) return fallbackSnapshot;

    const payload = (await response.json()) as BlsResponse;
    const observations = payload.Results?.series?.[0]?.data ?? [];
    const latest = observations
      .filter((item) => /^M(0[1-9]|1[0-2])$/.test(item.period) && Number.isFinite(Number(item.value)))
      .sort((a, b) => b.period.localeCompare(a.period))[0];

    if (!latest) return fallbackSnapshot;
    return {
      year: Number(latest.year),
      month: latest.periodName,
      value: Number(latest.value),
      source: "live"
    };
  } catch {
    return fallbackSnapshot;
  }
}
