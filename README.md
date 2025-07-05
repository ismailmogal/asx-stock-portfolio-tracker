# ASX Stock Portfolio Tracker

A modern stock/portfolio tracking application with AI-powered analysis, built with FastAPI backend and React frontend. The app provides real-time stock data, portfolio management, and intelligent insights using Yahoo Finance API and AI assistance.

## 🚀 Current Features

### Backend (FastAPI)
- **Real-time Stock Data**: Yahoo Finance API integration for live market data
- **AI Assistant**: Groq-powered chat interface for portfolio analysis and insights
- **Portfolio Management**: CRUD operations for stocks and watchlists
- **News Integration**: Yahoo Finance news fetching for selected stocks
- **Key Metrics API**: Real-time price, volume, and 52-week range data
- **Database**: SQLite with SQLAlchemy ORM

### Frontend (React + TypeScript)
- **Dashboard Layout**: Resizable vertical and horizontal dividers
- **TradingView Chart**: Interactive stock charts with dynamic stock selection
- **Portfolio Overview**: "Your Stocks" section with watchlist grouping
- **Key Metrics Display**: Real-time price, day high/low, volume, and 52-week performance
- **News Section**: On-demand news fetching with toggle functionality
- **AI Chat Interface**: Integrated chatbox for portfolio analysis
- **Responsive Design**: Modern UI with clean card layouts

### Core Functionality
- **Live Data Integration**: All stock data sourced from Yahoo Finance API
- **Watchlist Management**: Create and manage multiple watchlists
- **Stock Search**: Real-time search with dynamic results
- **News Filtering**: Relevant stock and sector news with market fallback
- **Performance Tracking**: 52-week range analysis with color-coded indicators
- **AI-Powered Insights**: Portfolio analysis and recommendations

## 🛠️ Technical Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite with SQLAlchemy
- **AI Integration**: Groq API
- **Data Source**: Yahoo Finance API
- **Authentication**: JWT-based (planned)
- **Dependencies**: See `backend/requirements.txt`

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Custom components with CSS
- **Charts**: TradingView Widget
- **State Management**: React hooks
- **HTTP Client**: Fetch API
- **Build Tool**: Vite

## 📋 Technical Roadmap

### Phase 1: Core Infrastructure Enhancement (Weeks 1-2)

#### Backend Improvements
- [ ] **Database Migration System**
  - Implement Alembic for schema versioning
  - Add migration scripts for future schema changes
  - Database backup and recovery procedures

- [ ] **API Rate Limiting & Caching**
  - Implement Redis for caching Yahoo Finance responses
  - Add rate limiting to prevent API abuse
  - Cache invalidation strategies for real-time data

- [ ] **Error Handling & Logging**
  - Comprehensive error handling middleware
  - Structured logging with different levels
  - API health monitoring endpoints

- [ ] **Authentication & Authorization**
  - JWT-based user authentication
  - Role-based access control
  - User session management
  - Secure password hashing

#### Frontend Improvements
- [ ] **State Management**
  - Implement Zustand or Redux Toolkit
  - Centralized state for user data and preferences
  - Persistent state management

- [ ] **Component Library**
  - Create reusable UI component library
  - Design system with consistent styling
  - Accessibility improvements (ARIA labels, keyboard navigation)

- [ ] **Performance Optimization**
  - Code splitting and lazy loading
  - Memoization for expensive calculations
  - Virtual scrolling for large lists

### Phase 2: Advanced Portfolio Features (Weeks 3-4)

#### Portfolio Analytics
- [ ] **Portfolio Performance Tracking**
  - Historical performance charts
  - Benchmark comparison (ASX 200, sector indices)
  - Risk metrics (Sharpe ratio, beta, volatility)
  - Dividend tracking and yield calculations

- [ ] **Advanced Watchlist Features**
  - Smart watchlists with AI-suggested stocks
  - Watchlist performance comparison
  - Price alerts and notifications
  - Custom watchlist categories

- [ ] **Transaction Management**
  - Buy/sell transaction logging
  - Cost basis tracking
  - Realized/unrealized gains
  - Tax lot tracking

#### Data Enhancement
- [ ] **Alternative Data Sources**
  - Alpha Vantage API integration (backup)
  - ASX announcements and company filings
  - Social sentiment analysis
  - Institutional ownership data

- [ ] **Historical Data**
  - Historical price data storage
  - Technical indicators calculation
  - Pattern recognition algorithms

### Phase 3: AI-Powered Features (Weeks 5-6)

#### Enhanced AI Assistant
- [ ] **Smart Portfolio Analysis**
  - Portfolio diversification analysis
  - Risk assessment and recommendations
  - Sector allocation optimization
  - Rebalancing suggestions

- [ ] **Predictive Insights**
  - Stock price trend analysis
  - Earnings prediction models
  - Market sentiment analysis
  - Volatility forecasting

- [ ] **Personalized Recommendations**
  - User preference learning
  - Risk tolerance assessment
  - Investment goal alignment
  - Custom investment strategies

#### Natural Language Processing
- [ ] **Chat-Driven Operations**
  - "Add BHP to my mining watchlist"
  - "Show me stocks with high dividend yield"
  - "Analyze my portfolio's tech exposure"
  - "Compare BHP and RIO performance"

- [ ] **Voice Commands**
  - Speech-to-text integration
  - Voice-activated portfolio queries
  - Hands-free trading interface

### Phase 4: Advanced Features (Weeks 7-8)

#### Real-time Features
- [ ] **WebSocket Integration**
  - Real-time price updates
  - Live portfolio value changes
  - Instant notifications
  - Multi-user collaboration

- [ ] **Push Notifications**
  - Price alert notifications
  - News alerts for watchlist stocks
  - Portfolio milestone notifications
  - Market opening/closing alerts

#### Advanced Analytics
- [ ] **Technical Analysis**
  - Moving averages, RSI, MACD
  - Support/resistance levels
  - Chart pattern recognition
  - Fibonacci retracements

- [ ] **Fundamental Analysis**
  - Financial ratios calculation
  - Earnings analysis
  - Valuation metrics
  - Peer comparison

### Phase 5: Enterprise Features (Weeks 9-10)

#### Multi-user & Collaboration
- [ ] **Team Features**
  - Shared watchlists
  - Portfolio sharing
  - Team performance tracking
  - Collaborative analysis

- [ ] **Advanced Permissions**
  - Role-based access control
  - Portfolio sharing permissions
  - Audit logging
  - Compliance reporting

#### Integration & Export
- [ ] **Third-party Integrations**
  - Brokerage account integration
  - Tax software export
  - Accounting system integration
  - CRM integration

- [ ] **Data Export**
  - PDF portfolio reports
  - Excel/CSV export
  - API for external tools
  - Scheduled reports

### Phase 6: Mobile & Accessibility (Weeks 11-12)

#### Mobile Application
- [ ] **React Native App**
  - Cross-platform mobile app
  - Offline functionality
  - Push notifications
  - Biometric authentication

- [ ] **Progressive Web App**
  - Offline-first design
  - App-like experience
  - Background sync
  - Home screen installation

#### Accessibility & Internationalization
- [ ] **Accessibility**
  - WCAG 2.1 compliance
  - Screen reader support
  - High contrast mode
  - Keyboard navigation

- [ ] **Internationalization**
  - Multi-language support
  - Currency conversion
  - Regional market data
  - Localized news

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- SQLite

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both backend and frontend directories:

**Backend (.env)**
```
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=sqlite:///./asx_trading.db
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:8000
```

## 📊 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the troubleshooting guide

---

**Note**: This roadmap is flexible and can be adjusted based on user feedback and business priorities. Each phase builds upon the previous one, ensuring a solid foundation for advanced features. 