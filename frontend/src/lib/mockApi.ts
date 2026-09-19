// Temporary Phase 1 data boundary. Replace this module when the summary endpoint is ready.
export type Summary = {
  totalHouseholds: number;
  highRiskHouseholds: number;
  estimatedCoverage: number;
  exclusionError: number;
  inclusionError: number;
  modelVersion: string;
  lastUpdated: string;
};

export const mockSummary: Summary = {
  totalHouseholds: 184260,
  highRiskHouseholds: 47218,
  estimatedCoverage: 68.4,
  exclusionError: 12.7,
  inclusionError: 8.9,
  modelVersion: "SPTA v0.1.0",
  lastUpdated: "2026-09-12",
};

export async function getMockSummary(): Promise<Summary> {
  return mockSummary;
}

export type SimulationResult = {
  threshold: number;
  coverage: number;
  exclusionError: number;
  inclusionError: number;
  distribution: Array<{ score: number; households: number }>;
  tradeoff: Array<{ threshold: number; coverage: number; exclusionError: number; inclusionError: number }>;
};

export type Household = {
  id: string;
  riskScore: number;
  category: "High" | "Medium" | "Low";
  district: string;
  predictedEligible: boolean;
};

export type Scenario = {
  name: string;
  threshold: number;
  coverage: number;
  exclusionError: number;
  inclusionError: number;
};

const distribution = [
  { score: 5, households: 18300 },
  { score: 15, households: 26700 },
  { score: 25, households: 30900 },
  { score: 35, households: 28400 },
  { score: 45, households: 24100 },
  { score: 55, households: 21100 },
  { score: 65, households: 16700 },
  { score: 75, households: 10600 },
  { score: 85, households: 5100 },
  { score: 95, households: 2360 },
];

export const mockHouseholds: Household[] = [
  { id: "HH-000184", riskScore: 92.4, category: "High", district: "Gasabo", predictedEligible: true },
  { id: "HH-000271", riskScore: 88.1, category: "High", district: "Nyarugenge", predictedEligible: true },
  { id: "HH-000392", riskScore: 81.7, category: "High", district: "Musanze", predictedEligible: true },
  { id: "HH-000448", riskScore: 74.6, category: "High", district: "Kicukiro", predictedEligible: true },
  { id: "HH-000517", riskScore: 67.8, category: "Medium", district: "Huye", predictedEligible: false },
  { id: "HH-000633", riskScore: 58.3, category: "Medium", district: "Rubavu", predictedEligible: true },
  { id: "HH-000704", riskScore: 44.9, category: "Medium", district: "Rwamagana", predictedEligible: false },
  { id: "HH-000812", riskScore: 31.2, category: "Low", district: "Nyagatare", predictedEligible: false },
  { id: "HH-000934", riskScore: 18.6, category: "Low", district: "Muhanga", predictedEligible: false },
  { id: "HH-001026", riskScore: 7.4, category: "Low", district: "Gicumbi", predictedEligible: false },
];

export async function getMockSimulation(threshold = 50): Promise<SimulationResult> {
  const normalized = Math.max(0, Math.min(100, threshold));
  const calculateMetrics = (value: number) => ({
    coverage: Number((93.4 - value * 0.5).toFixed(1)),
    exclusionError: Number((value * 0.31 - 2.8).toFixed(1)),
    inclusionError: Number((22 - value * 0.25).toFixed(1)),
  });
  const current = calculateMetrics(normalized);

  return {
    threshold: normalized,
    ...current,
    distribution,
    tradeoff: Array.from({ length: 11 }, (_, index) => {
      const pointThreshold = index * 10;
      return { threshold: pointThreshold, ...calculateMetrics(pointThreshold) };
    }),
  };
}

export async function getMockHouseholds(): Promise<Household[]> {
  return mockHouseholds;
}

export async function compareMockScenarios(scenarios: Array<Pick<Scenario, "name" | "threshold">>): Promise<Scenario[]> {
  return Promise.all(scenarios.map(async ({ name, threshold }) => {
    const result = await getMockSimulation(threshold);
    return { name, threshold: result.threshold, coverage: result.coverage, exclusionError: result.exclusionError, inclusionError: result.inclusionError };
  }));
}