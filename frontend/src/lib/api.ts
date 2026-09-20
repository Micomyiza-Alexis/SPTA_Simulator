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