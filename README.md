# PlanetOS

A comprehensive environmental and agricultural monitoring platform designed to address climate and farming challenges. PlanetOS enables users to report environmental issues like flooding and trash pollution, while providing farmers with advanced crop health monitoring through satellite imagery and environmental data analysis.

## 📋 Features

### General Features
- **Multi-language Support**: Localization for global accessibility
- **User Authentication**: Secure login system with role-based access
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: React Query for efficient data synchronization
- **Smooth Animations**: Framer Motion for engaging UI interactions

### Environmental Monitoring
- **Flood Map**: Interactive map for reporting and tracking flood incidents
- **Environmental Data Tabs**: Real-time weather and environmental metrics
  - Rainfall data
  - Wind conditions
  - Alert system for critical weather events
- **Severity Classification**: Low, Medium, High, and Critical severity levels

### Farmer Dashboard
- **Farm Management**: Track multiple farms and crop locations
- **Crop Health Monitoring**: NDVI (Normalized Difference Vegetation Index) scoring
- **Satellite Imagery**: Integration with satellite data for crop analysis
- **Farm Reporting**: Upload crop images and environmental observations
- **Trend Analysis**: Historical data visualization with trending indicators

### Community Features
- **User Progress Tracking**: Earn points for environmental contributions
- **Report History**: View and manage submitted reports
- **Quick Actions**: Fast access to common tasks
- **About Us & Rewards**: Community engagement and gamification
- **My City**: Location-based content and community data

### Technical Features
- **Progressive Web App**: Service worker support (manifest and sw.js)
- **REST API Integration**: Base44 client for backend communication
- **Leaflet Maps**: Interactive mapping with React-Leaflet
- **Responsive UI Components**: Custom badge, button, card, progress, switch, and tabs components

## 🚀 How to Run

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository** (if applicable)
   ```bash
   cd /Users/urnotdeva/Documents/Projects/PlanetOS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Development

Start the development server with hot module reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port)

### Production Build

Create an optimized production build:

```bash
npm run build
```

This generates a `dist` folder with minified and optimized files.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## 📦 Tech Stack

- **Frontend Framework**: React 18.3
- **Language**: TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router 6.27
- **State Management**: React Context API + React Query 5.59
- **Maps**: Leaflet 1.9.4 with React-Leaflet 4.2
- **Animations**: Framer Motion 11.11
- **Icons**: Lucide React 0.453

## 📁 Project Structure

```
├── Pages/              # Main page components
├── Components/         # Reusable UI components
│   ├── dashboard/     # Dashboard-specific components
│   ├── flood/         # Flood monitoring components
│   ├── common/        # Shared components
│   ├── ui/           # Basic UI elements
│   └── context/      # App context and state
├── Entities/          # JSON data schemas
├── api/              # Backend API client
├── public/           # Static assets and PWA files
└── utils.ts          # Utility functions
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production-ready build |
| `npm run preview` | Preview the production build locally |

## 📱 PWA Support

PlanetOS includes Progressive Web App capabilities:
- Service worker for offline functionality
- Web manifest for installability
- App icons for home screen installation

---

**PlanetOS** - Making the planet greener, one report at a time. 🌍♻️
