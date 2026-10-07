import type { StrategyResult } from "./api";

export type PolicyTradeoffInsight = {
  selectedStrategy: string;
  comparisonStrategy: string;
  selectionRate: number;

  selectedCoverage: number;
  comparisonCoverage: number;
  coverageDifference: number;

  selectedSeverePoorCoverage: number;
  comparisonSeverePoorCoverage: number;
  severePoorCoverageDifference: number;

  selectedPrecision: number;
  comparisonPrecision: number;
  precisionDifference: number;

  coverageWinner: string;
  severePoorWinner: string;
  precisionWinner: string;

  priority: "coverage" | "precision" | "balanced";

  headline: string;
  interpretation: string;
};

export function buildPolicyTradeoffInsight(
  selected: StrategyResult,
  comparison: StrategyResult,
): PolicyTradeoffInsight {
  const coverageDifference =
    selected.coverage - comparison.coverage;

  const severePoorCoverageDifference =
    selected.severe_poor_coverage -
    comparison.severe_poor_coverage;

  const precisionDifference =
    selected.precision - comparison.precision;

  const coverageWinner =
    coverageDifference > 0
      ? selected.strategy
      : coverageDifference < 0
        ? comparison.strategy
        : "Tie";

  const severePoorWinner =
    severePoorCoverageDifference > 0
      ? selected.strategy
      : severePoorCoverageDifference < 0
        ? comparison.strategy
        : "Tie";

  const precisionWinner =
    precisionDifference > 0
      ? selected.strategy
      : precisionDifference < 0
        ? comparison.strategy
        : "Tie";

  const selectedWinsCoverage = coverageDifference > 0;
  const selectedWinsSeverePoor =
    severePoorCoverageDifference > 0;
  const selectedWinsPrecision = precisionDifference > 0;

  let priority: PolicyTradeoffInsight["priority"];

  if (
    selectedWinsCoverage &&
    selectedWinsSeverePoor &&
    !selectedWinsPrecision
  ) {
    priority = "coverage";
  } else if (
    !selectedWinsCoverage &&
    !selectedWinsSeverePoor &&
    selectedWinsPrecision
  ) {
    priority = "precision";
  } else {
    priority = "balanced";
  }

  let headline: string;

  if (priority === "coverage") {
    headline = `${selected.strategy} favors broader poor-household reach`;
  } else if (priority === "precision") {
    headline = `${selected.strategy} favors higher precision`;
  } else {
    headline = `The policy choice involves a mixed targeting trade-off`;
  }

  const selectionRate = selected.budget;

  const interpretation =
    priority === "coverage"
      ? `${selected.strategy} reaches more poor households than ${comparison.strategy} at the same ${Math.round(
          selectionRate * 100,
        )}% household selection rate. It also provides stronger severe-poor coverage, while ${comparison.strategy} has higher precision.`
      : priority === "precision"
        ? `${selected.strategy} has higher precision than ${comparison.strategy} at the same ${Math.round(
            selectionRate * 100,
          )}% household selection rate. The comparison strategy provides broader poor-household coverage.`
        : `${selected.strategy} and ${comparison.strategy} trade off different targeting outcomes at the same ${Math.round(
            selectionRate * 100,
          )}% household selection rate. The preferred option therefore depends on whether broader coverage, severe-poor reach, or precision is the stronger policy priority.`;

  return {
    selectedStrategy: selected.strategy,
    comparisonStrategy: comparison.strategy,
    selectionRate,

    selectedCoverage: selected.coverage,
    comparisonCoverage: comparison.coverage,
    coverageDifference,

    selectedSeverePoorCoverage:
      selected.severe_poor_coverage,
    comparisonSeverePoorCoverage:
      comparison.severe_poor_coverage,
    severePoorCoverageDifference,

    selectedPrecision: selected.precision,
    comparisonPrecision: comparison.precision,
    precisionDifference,

    coverageWinner,
    severePoorWinner,
    precisionWinner,

    priority,
    headline,
    interpretation,
  };
}