import {
  compareMockScenarios,
  getMockHouseholds,
  getMockSimulation,
  getMockSummary,
  type Household,
  type Scenario,
  type SimulationResult,
  type Summary,
} from "./mockApi";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export async function getSummary(): Promise<Summary> {
  if (!apiBaseUrl) return getMockSummary();

  const response = await fetch(`${apiBaseUrl}/api/summary`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Summary request failed: ${response.status}`);
  return response.json() as Promise<Summary>;
}

export async function simulate(threshold: number): Promise<SimulationResult> {
  if (!apiBaseUrl) return getMockSimulation(threshold);
  const response = await fetch(`${apiBaseUrl}/api/simulate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threshold }) });
  if (!response.ok) throw new Error(`Simulation request failed: ${response.status}`);
  return response.json() as Promise<SimulationResult>;
}

export async function getHouseholds(): Promise<Household[]> {
  if (!apiBaseUrl) return getMockHouseholds();
  const response = await fetch(`${apiBaseUrl}/api/households`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Households request failed: ${response.status}`);
  return response.json() as Promise<Household[]>;
}

export async function compareScenarios(scenarios: Array<Pick<Scenario, "name" | "threshold">>): Promise<Scenario[]> {
  if (!apiBaseUrl) return compareMockScenarios(scenarios);
  const response = await fetch(`${apiBaseUrl}/api/scenarios/compare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scenarios) });
  if (!response.ok) throw new Error(`Scenario comparison failed: ${response.status}`);
  return response.json() as Promise<Scenario[]>;
}