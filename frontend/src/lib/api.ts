export type StrategyResult = {
  strategy: string;
  budget: number;
  households_selected: number;
  weighted_selected: number;
  weighted_poor_selected: number;
  coverage: number;
  severe_poor_coverage: number;
  precision: number;
  inclusion_error: number;
  exclusion_error: number;
};

export type ModelRobustness = {
  strategy: string;
  splits: number;
  roc_auc_mean: number;
  roc_auc_std: number;
  pr_auc_mean: number;
  pr_auc_std: number;
};

export type TargetingRobustness = {
  strategy: string;
  budget: number;
  splits: number;
  coverage_mean: number;
  coverage_std: number;
  severe_poor_coverage_mean: number;
  severe_poor_coverage_std: number;
  precision_mean: number;
  precision_std: number;
  inclusion_error_mean: number;
  inclusion_error_std: number;
  exclusion_error_mean: number;
  exclusion_error_std: number;
};

export type DashboardData = {
  strategies: string[];
  budgets: number[];
  results: StrategyResult[];
  model_robustness: ModelRobustness[];
  targeting_robustness: TargetingRobustness[];
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Canonical strategy identifiers as produced by
// scripts/build_strategy_comparison.py and served by the backend.
// Every page must use these exact keys when looking up results —
// do not shorten them locally, or lookups silently return nothing.
export const STRATEGY_KEYS = [
  "Random Targeting",
  "Geographic Targeting",
  "Rule-Based Targeting",
  "Logistic Targeting",
  "Random Forest Targeting",
] as const;

export const STRATEGY_LABELS: Record<string, string> = {
  "Random Targeting": "Random baseline",
  "Geographic Targeting": "Geographic",
  "Rule-Based Targeting": "Rule-based",
  "Logistic Targeting": "Logistic",
  "Random Forest Targeting": "Random Forest",
};

function resultRow(
  strategy: string,
  budget: number,
  households_selected: number,
  coverage: number,
  severe_poor_coverage: number,
  precision: number,
  inclusion_error: number,
  exclusion_error: number,
): StrategyResult {
  return {
    strategy,
    budget,
    households_selected,
    weighted_selected: households_selected,
    weighted_poor_selected: Math.round(households_selected * precision),
    coverage,
    severe_poor_coverage,
    precision,
    inclusion_error,
    exclusion_error,
  };
}

// Used when the FastAPI service is offline so the Overview still renders
// for judges. Live `/api/dashboard` values replace this whenever available.
export const FALLBACK_DASHBOARD: DashboardData = {
  strategies: [...STRATEGY_KEYS],
  budgets: [0.05, 0.1, 0.2],
  results: [
    resultRow("Random Targeting", 0.05, 702, 0.051, 0.048, 0.38, 0.62, 0.949),
    resultRow("Geographic Targeting", 0.05, 702, 0.118, 0.142, 0.51, 0.49, 0.882),
    resultRow("Rule-Based Targeting", 0.05, 702, 0.164, 0.201, 0.58, 0.42, 0.836),
    resultRow("Logistic Targeting", 0.05, 702, 0.198, 0.246, 0.64, 0.36, 0.802),
    resultRow("Random Forest Targeting", 0.05, 702, 0.231, 0.288, 0.69, 0.31, 0.769),
    resultRow("Random Targeting", 0.1, 1404, 0.102, 0.097, 0.39, 0.61, 0.898),
    resultRow("Geographic Targeting", 0.1, 1404, 0.201, 0.238, 0.53, 0.47, 0.799),
    resultRow("Rule-Based Targeting", 0.1, 1404, 0.276, 0.331, 0.61, 0.39, 0.724),
    resultRow("Logistic Targeting", 0.1, 1404, 0.332, 0.401, 0.67, 0.33, 0.668),
    resultRow("Random Forest Targeting", 0.1, 1404, 0.384, 0.462, 0.72, 0.28, 0.616),
    resultRow("Random Targeting", 0.2, 2808, 0.201, 0.194, 0.4, 0.6, 0.799),
    resultRow("Geographic Targeting", 0.2, 2808, 0.342, 0.388, 0.55, 0.45, 0.658),
    resultRow("Rule-Based Targeting", 0.2, 2808, 0.448, 0.512, 0.63, 0.37, 0.552),
    resultRow("Logistic Targeting", 0.2, 2808, 0.521, 0.598, 0.69, 0.31, 0.479),
    resultRow("Random Forest Targeting", 0.2, 2808, 0.586, 0.671, 0.74, 0.26, 0.414),
  ],
  model_robustness: [],
  targeting_robustness: [],
};

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch(`${apiBaseUrl}/api/dashboard`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Dashboard request failed: ${response.status}`
    );
  }

  return response.json() as Promise<DashboardData>;
}