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
export async function getModelRobustness(): Promise<ModelRobustness[]> {
  const response = await fetch(
    `${apiBaseUrl}/api/robustness/models`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(
      `Model robustness request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    results: ModelRobustness[];
  };

  return data.results;
}

export async function getTargetingRobustness(): Promise<TargetingRobustness[]> {
  const response = await fetch(
    `${apiBaseUrl}/api/robustness/targeting`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(
      `Targeting robustness request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    results: TargetingRobustness[];
  };

  return data.results;
}

export type VUPCategoryCount = {
  category: string;
  count: number;
  percent: number | null;
};

export type VUPComponent = {
  key: string;
  label: string;
  unique_households: number;
  duplicate_rows_removed: number;
  poverty_composition: VUPCategoryCount[];
};

export type VUPOverlapBand = {
  components_per_household: number;
  households: number;
};

export type VUPEvidence = {
  metadata: {
    title: string;
    source: string;
    master_households: number;
    component_files: number;
    weighting: string;
    generated_at_utc: string;
    privacy_note: string;
  };
  overall_poverty_composition: VUPCategoryCount[];
  programme_components: VUPComponent[];
  overlap: {
    households_in_any_component: number;
    households_in_no_component: number;
    households_in_multiple_components: number;
    distribution_by_component_count: VUPOverlapBand[];
  };
  validation: {
    master_ids_unique: boolean;
    all_component_ids_matched_to_master: boolean;
    component_ids_deduplicated_for_overlap: boolean;
    component_duplicate_rows: Record<string, number>;
  };
};

export async function getVUPEvidence(): Promise<VUPEvidence> {
  const response = await fetch(`${apiBaseUrl}/api/vup/evidence`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`VUP evidence request failed: ${response.status}`);
  }

  return response.json() as Promise<VUPEvidence>;
}
