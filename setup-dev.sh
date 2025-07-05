#!/bin/bash

# ASX Stock Portfolio Tracker - Development Setup Script
# This script sets up the development environment for the enhanced features

echo "🚀 Setting up ASX Stock Portfolio Tracker Development Environment"
echo "================================================================"

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Backend Setup
echo ""
echo "📦 Setting up Backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install development dependencies
echo "Installing development dependencies..."
pip install redis alembic pytest pytest-asyncio python-dotenv

# Create development environment file
if [ ! -f ".env.development" ]; then
    echo "Creating development environment file..."
    cat > .env.development << EOF
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./asx_trading_dev.db
REDIS_URL=redis://localhost:6379
LOG_LEVEL=DEBUG
ENVIRONMENT=development
EOF
    echo "⚠️  Please update .env.development with your actual API keys"
fi

cd ..

# Frontend Setup
echo ""
echo "📦 Setting up Frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Install development dependencies
echo "Installing development dependencies..."
npm install --save-dev @types/jest jest @testing-library/react @testing-library/jest-dom

# Create development environment file
if [ ! -f ".env.development" ]; then
    echo "Creating development environment file..."
    cat > .env.development << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_ENVIRONMENT=development
EOF
fi

cd ..

# Create development database
echo ""
echo "🗄️  Setting up Development Database..."
cd backend
source venv/bin/activate

# Initialize Alembic (if not already done)
if [ ! -d "alembic" ]; then
    echo "Initializing Alembic for database migrations..."
    alembic init alembic
    # Update alembic.ini with correct database URL
    sed -i '' 's|sqlite:///alembic.db|sqlite:///./asx_trading_dev.db|g' alembic.ini
fi

cd ..

# Create development scripts
echo ""
echo "📝 Creating development scripts..."

# Backend development script
cat > run-backend-dev.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
export $(cat .env.development | xargs)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
EOF

# Frontend development script
cat > run-frontend-dev.sh << 'EOF'
#!/bin/bash
cd frontend
export $(cat .env.development | xargs)
npm run dev
EOF

# Make scripts executable
chmod +x run-backend-dev.sh run-frontend-dev.sh

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env.development with your GROQ API key"
echo "2. Install Redis if you plan to use caching (optional)"
echo "3. Run './run-backend-dev.sh' to start the backend"
echo "4. Run './run-frontend-dev.sh' to start the frontend"
echo ""
echo "🔧 Development commands:"
echo "  Backend:  ./run-backend-dev.sh"
echo "  Frontend: ./run-frontend-dev.sh"
echo "  Tests:    cd backend && source venv/bin/activate && pytest"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Project overview"
echo "  - TECHNICAL_ROADMAP.md - Detailed roadmap"
echo "  - DEVELOPMENT_BRANCH.md - Development guidelines"
echo ""
echo "🎯 You're ready to start developing enhanced features!" 