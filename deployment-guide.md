# CHIP MVP Deployment Guide
# Climate-Resilient Healthcare Infrastructure Protection

## Quick Start Deployment

### Prerequisites
- Docker installed on your machine
- Git for version control
- OpenWeatherMap API key (free at openweathermap.org)
- Vercel account for frontend deployment
- Heroku account for backend deployment

### 1. Clone and Setup

```bash
# Create project directory
mkdir chip-mvp
cd chip-mvp

# Copy all provided files into this directory
# - chip-mvp-backend.py
# - chip-mvp-frontend.jsx  
# - chip-mvp-styles.css
# - Dockerfile
# - requirements.txt
# - package.json

# Create environment file
echo "OPENWEATHER_API_KEY=your_api_key_here" > .env
```

### 2. Local Development

#### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python chip-mvp-backend.py
# Server will start at http://localhost:5000
```

#### Frontend Setup
```bash
# In a new terminal, create React app
npx create-react-app frontend
cd frontend

# Install dependencies
npm install axios three @react-three/fiber @react-three/drei chart.js react-chartjs-2

# Replace default App.js with chip-mvp-frontend.jsx content
# Replace default App.css with chip-mvp-styles.css content

# Start development server
npm start
# Frontend will start at http://localhost:3000
```

### 3. Docker Deployment

#### Build and Run with Docker
```bash
# Build backend image
docker build -t chip-mvp-backend .

# Run backend container
docker run -p 5000:5000 -e OPENWEATHER_API_KEY=your_api_key_here chip-mvp-backend

# For frontend, create Dockerfile in frontend directory:
cat << EOF > frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
EOF

# Build and run frontend
cd frontend
docker build -t chip-mvp-frontend .
docker run -p 3000:3000 chip-mvp-frontend
```

### 4. Production Deployment

#### Backend Deployment on Heroku

```bash
# Create Heroku app
heroku create chip-mvp-backend

# Set environment variables
heroku config:set OPENWEATHER_API_KEY=your_api_key_here

# Create Procfile
echo "web: python chip-mvp-backend.py" > Procfile

# Deploy
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a chip-mvp-backend
git push heroku main
```

#### Frontend Deployment on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# In frontend directory
cd frontend
vercel

# Follow prompts to deploy
# Set environment variable in Vercel dashboard:
# REACT_APP_API_URL=https://your-heroku-backend.herokuapp.com
```

### 5. Environment Variables

#### Backend (.env)
```
OPENWEATHER_API_KEY=your_openweather_api_key
FLASK_ENV=production
DATABASE_URL=sqlite:///chip_mvp.db
```

#### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

### 6. API Endpoints

The MVP includes the following endpoints:

- `POST /api/upload` - Upload building drawings
- `GET /api/weather/{lat}/{lon}` - Get weather data
- `POST /api/simulate` - Run building simulation
- `GET /api/results/{simulation_id}` - Get simulation results
- `GET /api/recommendations/{building_id}` - Get retrofitting recommendations
- `GET /api/buildings` - List all buildings
- `GET /api/health` - Health check

### 7. Database Setup

The application uses SQLite for simplicity. On first run, it will automatically create:
- `buildings` table for storing building information
- `simulations` table for tracking simulation status and results

### 8. Testing the MVP

#### Sample Test Flow:
1. Upload a building drawing (PDF/image file) with coordinates
2. Run energy analysis simulation
3. View results showing energy consumption, thermal comfort, and climate resilience
4. Get retrofitting recommendations based on climate zone
5. Visualize building in 3D viewer

#### Test Data:
- Use coordinates: 28.6139, 77.2090 (New Delhi, India) for tropical/subtropical testing
- Upload any PDF or image file as a "building drawing"
- The system will generate mock simulation results for demonstration

### 9. Scaling and Production Notes

#### For Production Deployment:
1. Replace SQLite with PostgreSQL or MongoDB
2. Implement user authentication and authorization
3. Add file storage with AWS S3 or similar
4. Implement proper EnergyPlus API integration
5. Add rate limiting and API security
6. Implement proper logging and monitoring
7. Add automated testing suite

#### Performance Optimization:
- Use Redis for caching weather data
- Implement background job queuing for simulations
- Add CDN for static assets
- Optimize database queries
- Implement API response compression

### 10. Demo Script

#### For Demonstration Purposes:

1. **Introduction (2 minutes)**
   - Explain CHIP's purpose for climate-resilient healthcare facilities
   - Show the web interface and navigation

2. **Building Upload (3 minutes)**
   - Upload a sample building drawing
   - Input coordinates (use New Delhi for demo)
   - Show automatic climate zone detection

3. **Simulation Execution (3 minutes)**
   - Run comprehensive building analysis
   - Show real-time simulation progress
   - Explain background processing

4. **Results Analysis (4 minutes)**
   - Review energy consumption metrics
   - Analyze thermal comfort data
   - Examine climate resilience indicators
   - Show solar analysis results

5. **Recommendations (3 minutes)**
   - Display climate-specific retrofitting recommendations
   - Explain cost-benefit analysis
   - Show implementation priorities

6. **3D Visualization (2 minutes)**
   - Demonstrate interactive 3D building model
   - Show climate stress visualization
   - Explain visual feedback system

7. **Technical Architecture (2 minutes)**
   - Explain API integration capabilities
   - Show scalability features
   - Discuss deployment options

### 11. Troubleshooting

#### Common Issues:

1. **CORS Errors**: Ensure backend includes proper CORS headers
2. **API Key Issues**: Verify OpenWeatherMap API key is valid
3. **Database Errors**: Check file permissions for SQLite database
4. **Port Conflicts**: Ensure ports 3000 and 5000 are available
5. **Build Failures**: Clear node_modules and reinstall dependencies

#### Development Tips:
- Use browser dev tools to debug API calls
- Check backend logs for simulation errors
- Verify file upload formats are supported
- Test with different coordinate ranges for climate zones

This MVP demonstrates the core functionality of the CHIP platform and provides a solid foundation for showcasing the potential of climate-resilient building simulation to a larger audience.