# SPTA Simulator
### Social Protection Targeting Accuracy Simulator

SPTA Simulator is a data-driven decision-support application for exploring social protection targeting strategies, comparing simulated targeting performance, and examining model robustness and evidence related to Rwanda's social protection programmes.

The project brings together data preparation, targeting simulations, model evaluation, and an interactive web interface to help users understand the trade-offs involved in identifying households for social protection support.

> **Research note:** Simulation results are analytical estimates based on the available data, modelling choices, and evaluation assumptions. They should not be interpreted as guarantees of real-world programme performance or as a substitute for authorised policy decisions.

## Key capabilities

- **Targeting strategy comparison:** Compare model-based, rule-based, geographic, and random targeting approaches.
- **Scenario analysis:** Explore targeting outcomes at different selection rates.
- **Model robustness:** Examine model performance and sensitivity across repeated data splits.
- **VUP evidence:** Review aggregate evidence on household participation across selected Vision 2020 Umurenge Programme (VUP) components.
- **Interactive dashboard:** Explore results through a Next.js interface connected to a FastAPI backend.
- **Data validation:** Use research scripts to inspect source data, validate household identifiers, and reconcile aggregate results.

## Technology stack

**Frontend**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts

**Backend**
- Python
- FastAPI
- Uvicorn
- Pandas and NumPy
- Scikit-learn

## Project structure

```text
SPTA_Simulator/
├── backend/
│   ├── app/
│   │   ├── api/          # API route modules
│   │   ├── schemas/      # Request and response schemas
│   │   ├── services/     # Application services
│   │   └── main.py       # FastAPI application
│   ├── tests/            # Backend tests
│   └── requirements.txt
├── data/
│   ├── raw/              # Source data; do not commit
│   └── processed/        # Approved aggregate outputs
├── frontend/
│   └── src/app/          # Next.js application routes
├── ml/                   # Machine-learning resources
├── notebooks/            # Research notebooks
├── models/               # Model artifacts
├── scripts/              # Data preparation and experiments
└── README.md
```

## Application modules

| Route | Purpose |
|---|---|
| `/` | Main dashboard |
| `/households` | Household-related interface |
| `/scenarios` | Targeting scenario comparisons |
| `/simulator` | Targeting simulation interface |
| `/robustness` | Model robustness analysis |
| `/vup-evidence` | Aggregate VUP evidence |
| `/login` | Demo login |

## Getting started

### Prerequisites

- Python 3.11 or another Python version verified to work with the project's dependencies.
- Node.js and npm.
- Git.
- Access to the authorised research datasets required to regenerate results.

### 1. Clone the repository

```bash
git clone https://github.com/Micomyiza-Alexis/SPTA_Simulator.git
cd SPTA_Simulator
```

### 2. Set up the Python environment

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

Ensure that the backend requirements include every direct dependency used by the application, including `python-dotenv`.

### 3. Configure the backend

Create or update `backend/.env` with the demo password configuration:

```dotenv
DEMO_PASSWORD=replace-with-a-secure-demo-password
```

Use a private, locally configured value. Never commit real credentials or secrets.

### 4. Start the backend

From the repository root:

```powershell
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The API health endpoint is available at:

`http://127.0.0.1:8000/health`

FastAPI's interactive API documentation is available at:

`http://127.0.0.1:8000/docs`

### 5. Install and start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
```

Create or update `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000` in your browser.

### 6. Verify the frontend build

From the `frontend` directory:

```powershell
npm run build
```

## Testing

Activate the Python virtual environment and run the backend tests from the repository root:

```powershell
python -m pytest backend/tests -v
```

The VUP evidence tests cover aggregate response validation, invalid and missing data, overlap reconciliation, and prevention of household-level fields appearing in the response.

Run the frontend production build with:

```powershell
cd frontend
npm run build
```

## Research methodology and responsible interpretation

The simulator compares targeting strategies using the available research datasets and derived evaluation metrics.

Results should be interpreted in light of:

- The definition of poverty and the outcome being predicted.
- The distinction between training, validation, and evaluation data.
- The selection rate and assumptions used in each simulation.
- Sampling design, survey weights, missing data, and dataset coverage.
- The limitations of applying historical model performance to future programme implementation.

The VUP evidence module reports aggregate household counts and participation overlap across selected programme components. Its reported household distribution is a distribution of the analysed sample, not automatically a nationally representative estimate.

The available VUP and EICV7 household datasets do not have a verified household-level linkage. Shared geographic information alone is not sufficient to establish that records refer to the same household. Cross-dataset conclusions require a valid linkage method and appropriate evidence.

Model comparisons describe measured performance under the specified evaluation procedure. They do not establish causal impacts of social protection programmes.

## Data protection

- Do not commit confidential source microdata or household-level records.
- Keep credentials and environment files out of version control.
- Publish only approved aggregate outputs.
- Validate generated outputs before making them available through the API.
- Treat model outputs as decision-support evidence, not automated eligibility decisions.

## Current verification status

The following checks have been completed in the development environment:

- Backend test suite: **6 tests passed**.
- Next.js production build: **successful**.
- Backend tests and frontend production build passed in the local development environment.
- VUP evidence and robustness routes: included in the production build.

These checks confirm the tested functionality and successful compilation; they do not establish that every endpoint, deployment configuration, or research assumption has been independently validated.

## Repository

GitHub: https://github.com/Micomyiza-Alexis/SPTA_Simulator
