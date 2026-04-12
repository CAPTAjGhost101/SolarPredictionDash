# SolarPlanner v2.1 – Solar Energy Optimization Platform

A web-based SaaS application for planning and evaluating solar energy systems. It enables users to estimate energy generation, savings, and return on investment using location-based inputs, system configuration, and interactive data visualization.

---

## Live Demo

https://effulgent-pegasus-18f686.netlify.app/

## Repository

https://github.com/CAPTAjGhost101/SolarPredictionDash

---

## Overview

SolarPlanner is designed to help users make informed decisions before installing a solar system. The platform combines energy prediction logic with an interactive interface, allowing users to analyze different configurations based on location, system size, tilt, and direction.

It provides realistic estimates for energy production and financial outcomes, along with tools to save, compare, and export system configurations.

---

## Version

### v2.1 (Current)

- Location-based solar analysis using manual input, GPS, and map selection
- Google Authentication for user access
- Firestore integration for persistent storage of user data
- Solar optimization system for tilt and direction adjustments
- Interactive charts for energy production and financial projections
- PDF report generation for system analysis
- Multilingual interface (English and Hindi)
- Dark mode support and responsive design
- Improved UI with smoother transitions and structured layout

### v1.0

- Basic dashboard with energy estimation
- Initial chart visualization

---

## Features

### Energy Prediction

- Monthly and yearly energy estimation
- Real vs estimated data comparison
- Location-aware solar calculations
- System efficiency, tilt, and direction-based adjustments

### Financial Analysis

- Monthly and yearly savings calculation
- Payback period estimation
- Long-term savings projection

### User Functionality

- Save and manage multiple solar configurations
- Compare different setups
- Export detailed PDF reports

### Interface

- Responsive design for mobile and desktop
- Dark and light theme support
- Interactive charts using Recharts
- Map-based location selection

### Authentication and Storage

- Google Sign-In using Firebase Authentication
- Cloud storage with Firebase Firestore
- Persistent user-specific data

---

## Tech Stack

| Category        | Technology                 |
| --------------- | -------------------------- |
| Frontend        | React.js                   |
| Styling         | Tailwind CSS               |
| Charts          | Recharts                   |
| State Logic     | React Hooks                |
| Maps            | Leaflet.js                 |
| Backend/Cloud   | Firebase (Auth, Firestore) |
| Build Tool      | Vite                       |
| Deployment      | Netlify                    |
| Version Control | Git & GitHub               |

---

## Architecture

src/
├── components/ # Reusable UI components (charts, cards, controls)
├── pages/ # Main application screens
├── context/ # Global state (settings, theme)
├── utils/ # Helper functions and calculations
├── assets/ # Static resources
└── App.jsx

---

## Installation

git clone https://github.com/CAPTAjGhost101/SolarPredictionDash.git  
cd SolarPredictionDash  
npm install  
npm run dev

---

## Deployment

The application is deployed using Netlify with GitHub integration.

npm run build

---

## Key Highlights

- Built a production-style SaaS platform for solar planning
- Integrated authentication and cloud storage using Firebase
- Developed a custom solar prediction and optimization system
- Designed a responsive and user-focused interface
- Implemented real-time interaction with charts and map-based inputs

---

## Key Learnings

- Building scalable React applications
- Managing authentication and cloud databases
- Designing data-driven interfaces
- Improving user experience with responsive design and animations
- Structuring frontend architecture for maintainability

---

## Future Improvements

- Integration with real-time solar and weather APIs
- Advanced analytics and deeper insights
- Historical data tracking
- Smart notifications and alerts
- Improved optimization models

---

## Contributing

Contributions are welcome. Fork the repository and submit a pull request with improvements or fixes.

---

## License

MIT License © 2026
