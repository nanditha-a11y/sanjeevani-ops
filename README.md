# 🏥 Sanjeevani Ops AI Command Center

### AI-Powered Hospital Operations Intelligence & Bed Turnover System

## 📌 About the Project

Sanjeevani Ops AI Command Center is an AI-powered hospital operations management system designed to identify hospital bottlenecks, reduce discharge delays, improve bed availability, and coordinate activities between hospital departments in real time.

Sometimes, a hospital bed remains occupied even when a patient is ready for discharge because of pending lab reports, insurance approvals, or billing delays. This creates a chain reaction that affects emergency admissions and patient transfers.

Our system helps hospital administrators identify the root cause of these delays and take faster action.

## 🎯 Problem Statement

Hospitals face operational bottlenecks due to:

- Delays in laboratory reports.
- Slow discharge and billing processes.
- Pending insurance approvals.
- Limited visibility into bed availability.
- Poor coordination between hospital departments.
- Delays in emergency patient admissions.

Traditional hospital information systems mainly store information, but they may not provide the operational intelligence needed to resolve these bottlenecks quickly.

## 💡 Our Solution

Sanjeevani Ops provides a centralized command center that monitors hospital operations, identifies bottlenecks, visualizes their effects, and helps administrators take corrective action.

### Key Features

- **AI-Powered Command Center:** Provides an executive overview of hospital operations and important alerts.
- **Causal Bottleneck Analysis:** Identifies the root cause of delays and visualizes their downstream effects.
- **Human-in-the-Loop Action Center:** Allows administrators to review and approve suggested actions.
- **Ward & Bed Management:** Monitors bed capacity and doctor workloads.
- **Discharge Management:** Tracks discharge milestones and itemized billing.
- **Insurance Coordination:** Monitors insurance pre-authorization and emergency overrides.
- **Isolation Monitoring:** Tracks negative-pressure environments, HEPA filter health, and monitoring timers.
- **Blood Bank Coordination:** Tracks emergency blood bank reserves and donor SMS broadcasts.
- **AI Operations Assistant:** Helps administrators query operational information and initiate supported actions.
- **Record Recovery:** Supports soft deletion and restoration of archived records.

## 🔄 How It Works

1. The system monitors hospital operational data.
2. It identifies a bottleneck, such as an overdue laboratory report.
3. It analyzes how the delay affects bed clearance and emergency intake.
4. It displays alerts and the related operational impact.
5. The administrator reviews the recommended action.
6. The administrator approves and dispatches the action to help resolve the bottleneck.

### Example Scenario

An overdue lab test delays the discharge clearance of a patient in Bed B12. As a result, the bed remains unavailable, potentially delaying an emergency admission.

Sanjeevani Ops identifies the root cause, displays the chain of effects, and helps the administrator initiate a fast-track response.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend user interface |
| TypeScript | Type-safe application development |
| Vite | Development server and build tool |
| Zustand | Centralized state management |
| Tailwind CSS | Styling and responsive UI |
| PostCSS | CSS processing |
| Framer Motion | UI animations and transitions |
| Lucide React | Icons |
| Vercel | Deployment configuration |

## 📂 Project Structure

```text
src/
├── components/
│   ├── CommandCenter/
│   ├── IsolationPage/
│   ├── WardsPage/
│   ├── CampaignsPage/
│   ├── DischargePage/
│   ├── InsurancePage/
│   ├── TrashPage/
│   ├── AgentPage/
│   ├── CausalFlow/
│   ├── ActionCenter/
│   └── PatientRecord/
├── store/
│   └── useOpsStore.ts
├── data/
│   └── mockData.ts
└── types/
    └── index.ts
```

- `components/` — Contains the hospital operations portals and UI modules.
- `store/useOpsStore.ts` — Manages shared application state and clinical actions.
- `data/mockData.ts` — Contains demonstration data for patients, beds, laboratories, and insurance claims.
- `types/index.ts` — Defines TypeScript interfaces for clinical data models.

## 🚀 Getting Started

### Prerequisites

Install the following software:

- Node.js and npm
- Visual Studio Code
- Git (optional, for version control)

### Installation

**1. Clone the repository**

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

**2. Open the project folder**

```bash
cd <YOUR_PROJECT_FOLDER>
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the application**

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

*Note: These commands assume the repository contains a valid Vite project with the corresponding npm scripts.*

## 🌟 Expected Impact

- Reduce avoidable discharge delays.
- Improve hospital bed turnover.
- Support faster emergency admissions.
- Improve coordination across hospital departments.
- Help administrators identify operational bottlenecks.
- Support faster, data-informed operational decisions.

## 🔮 Future Enhancements

- Integration with real hospital information systems.
- Live sensor and hospital data integration.
- More advanced AI-based bottleneck prediction.
- Real-time notifications for critical operational events.
- Secure authentication and role-based permissions.
- Mobile application support for hospital staff.

## 👥 Target Users

- Hospital administrators.
- Ward managers.
- Nursing and clinical coordination teams.
- Laboratory teams.
- Billing and insurance departments.
- Hospital operations managers.

## 🏆 Hackathon Project

**Project Name:** Sanjeevani Ops AI Command Center

**Domain:** Healthcare Technology / AI-Powered Hospital Operations

**Objective:** To improve hospital operational efficiency by identifying bottlenecks, coordinating departments, and supporting faster bed turnover.

## ⚠️ Disclaimer

This project is intended for demonstration and hackathon purposes. Demonstration data and proposed AI-assisted workflows should not be treated as validated clinical decision-making tools. Real-world deployment requires appropriate security, privacy protections, clinical validation, and integration testing.

## 📄 License

Add a suitable open-source license if you intend to distribute this project publicly.
