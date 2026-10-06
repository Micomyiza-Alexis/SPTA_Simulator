import type { StrategyResult } from "./api";

export type TargetingInsight = {
  budget: number;
  coverageRecommendedStrategy: string;
  coverageLeader: string;
  precisionLeader: string;
  severePoorLeader: string;
  highestCoverage: number;
  highestSeverePoorCoverage: number;
  highestPrecision: number;
  randomCoverage: number;
  coverageMultiplierVsRandom: number | null;
  coverageGapVsRandom: number;
  coverageLeaderPrecisionGap: number;
};

export type CrossScenarioInsight = {
  coverageLeader: string;
  severePoorLeader: string;
  precisionLeader: string;
  coverageLeadershipCount: number;
  severePoorLeadershipCount: number;
  precisionLeadershipCount: number;
  lowestBudget: number;
  highestBudget: number;
  coverageAtLowestBudget: number;
  coverageAtHighestBudget: number;
  coverageChange: number;
  precisionAtLowestBudget: number;
  precisionAtHighestBudget: number;
  precisionChange: number;
};

export function buildTargetingInsight(
  results: StrategyResult[],
): TargetingInsight | null {
  if (results.length === 0) {
    return null;
  }

  const coverageLeader = [...results].sort(
    (a, b) => b.coverage - a.coverage,
  )[0];

  const precisionLeader = [...results].sort(
    (a, b) => b.precision - a.precision,
  )[0];

  const severePoorLeader = [...results].sort(
    (a, b) => b.severe_poor_coverage - a.severe_poor_coverage,
  )[0];

  const randomResult = results.find(
    (result) => result.strategy === "Random Targeting",
  );

  const randomCoverage = randomResult?.coverage ?? 0;

  const coverageMultiplierVsRandom =
    randomCoverage > 0
      ? coverageLeader.coverage / randomCoverage
      : null;

  return {
    budget: coverageLeader.budget,
    coverageRecommendedStrategy: coverageLeader.strategy,
    coverageLeader: coverageLeader.strategy,
    precisionLeader: precisionLeader.strategy,
    severePoorLeader: severePoorLeader.strategy,
    highestCoverage: coverageLeader.coverage,
    highestSeverePoorCoverage: severePoorLeader.severe_poor_coverage,
    highestPrecision: precisionLeader.precision,
    randomCoverage,
    coverageMultiplierVsRandom,
    coverageGapVsRandom:
      coverageLeader.coverage - randomCoverage,
    coverageLeaderPrecisionGap:
      precisionLeader.precision - coverageLeader.precision,
  };
}

export function buildCrossScenarioInsight(
  results: StrategyResult[],
): CrossScenarioInsight | null {
  if (results.length === 0) {
    return null;
  }

  const budgets = [...new Set(results.map((result) => result.budget))].sort(
    (a, b) => a - b,
  );

  if (budgets.length < 2) {
    return null;
  }

  const coverageLeaders = budgets.map((budget) => {
    const scenario = results.filter(
      (result) => result.budget === budget,
    );

    return [...scenario].sort(
      (a, b) => b.coverage - a.coverage,
    )[0].strategy;
  });

  const severePoorLeaders = budgets.map((budget) => {
    const scenario = results.filter(
      (result) => result.budget === budget,
    );

    return [...scenario].sort(
      (a, b) =>
        b.severe_poor_coverage - a.severe_poor_coverage,
    )[0].strategy;
  });

  const precisionLeaders = budgets.map((budget) => {
    const scenario = results.filter(
      (result) => result.budget === budget,
    );

    return [...scenario].sort(
      (a, b) => b.precision - a.precision,
    )[0].strategy;
  });

  const countOccurrences = (
    values: string[],
    strategy: string,
  ) => values.filter((value) => value === strategy).length;

  const coverageLeadershipCount = Math.max(
    ...coverageLeaders.map(
      (strategy) => countOccurrences(coverageLeaders, strategy),
    ),
  );

  const severePoorLeadershipCount = Math.max(
    ...severePoorLeaders.map(
      (strategy) => countOccurrences(severePoorLeaders, strategy),
    ),
  );

  const precisionLeadershipCount = Math.max(
    ...precisionLeaders.map(
      (strategy) => countOccurrences(precisionLeaders, strategy),
    ),
  );

  const coverageLeader =
    coverageLeaders.find(
      (strategy) =>
        countOccurrences(coverageLeaders, strategy) ===
        coverageLeadershipCount,
    ) ?? coverageLeaders[0];

  const severePoorLeader =
    severePoorLeaders.find(
      (strategy) =>
        countOccurrences(severePoorLeaders, strategy) ===
        severePoorLeadershipCount,
    ) ?? severePoorLeaders[0];

  const precisionLeader =
    precisionLeaders.find(
      (strategy) =>
        countOccurrences(precisionLeaders, strategy) ===
        precisionLeadershipCount,
    ) ?? precisionLeaders[0];

  const lowestBudget = budgets[0];
  const highestBudget = budgets[budgets.length - 1];

  const coverageStrategyResults = results.filter(
    (result) => result.strategy === coverageLeader,
  );

  const lowestCoverageResult = coverageStrategyResults.find(
    (result) => result.budget === lowestBudget,
  );

  const highestCoverageResult = coverageStrategyResults.find(
    (result) => result.budget === highestBudget,
  );

  if (!lowestCoverageResult || !highestCoverageResult) {
    return null;
  }

  return {
    coverageLeader,
    severePoorLeader,
    precisionLeader,
    coverageLeadershipCount,
    severePoorLeadershipCount,
    precisionLeadershipCount,
    lowestBudget,
    highestBudget,
    coverageAtLowestBudget: lowestCoverageResult.coverage,
    coverageAtHighestBudget: highestCoverageResult.coverage,
    coverageChange:
      highestCoverageResult.coverage -
      lowestCoverageResult.coverage,
    precisionAtLowestBudget: lowestCoverageResult.precision,
    precisionAtHighestBudget: highestCoverageResult.precision,
    precisionChange:
      highestCoverageResult.precision -
      lowestCoverageResult.precision,
  };
}
