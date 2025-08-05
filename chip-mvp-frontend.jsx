// CHIP MVP Frontend - React Application
// Climate-Resilient Healthcare Infrastructure Protection

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as THREE from 'three';

// Main App Component
function CHIPApp() {
  const [currentView, setCurrentView] = useState('upload');
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/buildings');
      setBuildings(response.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  return (
    <div className="chip-app">
      <Header />
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="main-content">
        {currentView === 'upload' && (
          <UploadView onBuildingUploaded={loadBuildings} />
        )}
        {currentView === 'buildings' && (
          <BuildingsView 
            buildings={buildings} 
            onSelectBuilding={setSelectedBuilding}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'simulation' && selectedBuilding && (
          <SimulationView 
            building={selectedBuilding}
            onSimulationComplete={setSimulationResults}
          />
        )}
        {currentView === 'results' && simulationResults && (
          <ResultsView results={simulationResults} building={selectedBuilding} />
        )}
        {currentView === 'recommendations' && selectedBuilding && (
          <RecommendationsView building={selectedBuilding} />
        )}
        {currentView === 'visualizer' && selectedBuilding && (
          <Visualizer3D building={selectedBuilding} results={simulationResults} />
        )}
      </main>
    </div>
  );
}

// Header Component
function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>CHIP - Climate-Resilient Healthcare Infrastructure</h1>
        <p>Building Simulation and Climate Adaptation Platform</p>
      </div>
    </header>
  );
}

// Navigation Component
function Navigation({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'upload', label: 'Upload Building', icon: '📤' },
    { id: 'buildings', label: 'Buildings', icon: '🏥' },
    { id: 'simulation', label: 'Simulation', icon: '⚡' },
    { id: 'results', label: 'Results', icon: '📊' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'visualizer', label: '3D Visualizer', icon: '🎯' }
  ];

  return (
    <nav className="navigation">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-button ${currentView === item.id ? 'active' : ''}`}
          onClick={() => setCurrentView(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// Upload View Component
function UploadView({ onBuildingUploaded }) {
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    building_type: 'healthcare',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      setUploadStatus('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading building data...');

    try {
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('name', formData.name);
      uploadData.append('latitude', formData.latitude);
      uploadData.append('longitude', formData.longitude);
      uploadData.append('building_type', formData.building_type);

      const response = await axios.post('http://localhost:5000/api/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadStatus('Building uploaded successfully!');
      onBuildingUploaded();
      
      // Reset form
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        building_type: 'healthcare',
        file: null
      });

    } catch (error) {
      setUploadStatus('Error uploading building: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const getLocationFromBrowser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="upload-view">
      <div className="upload-card">
        <h2>Upload Building Information</h2>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="name">Building Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Regional Hospital Main Building"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude:</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
                placeholder="e.g., 28.6139"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitude">Longitude:</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
                placeholder="e.g., 77.2090"
                required
              />
            </div>
            <button
              type="button"
              onClick={getLocationFromBrowser}
              className="location-button"
            >
              📍 Get Current Location
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="building_type">Building Type:</label>
            <select
              id="building_type"
              name="building_type"
              value={formData.building_type}
              onChange={handleInputChange}
            >
              <option value="healthcare">Healthcare Facility</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="emergency">Emergency Center</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="file">Building Drawings/Plans:</label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              accept=".pdf,.dwg,.dxf,.jpg,.png,.jpeg"
            />
            <small>Supported formats: PDF, DWG, DXF, JPG, PNG</small>
          </div>

          <button
            type="submit"
            className="upload-button"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Building'}
          </button>

          {uploadStatus && (
            <div className={`status-message ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
              {uploadStatus}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Buildings List View Component
function BuildingsView({ buildings, onSelectBuilding, setCurrentView }) {
  const handleSelectBuilding = (building) => {
    onSelectBuilding(building);
    setCurrentView('simulation');
  };

  return (
    <div className="buildings-view">
      <h2>Your Buildings</h2>
      
      {buildings.length === 0 ? (
        <div className="empty-state">
          <p>No buildings uploaded yet. Upload your first building to get started!</p>
        </div>
      ) : (
        <div className="buildings-grid">
          {buildings.map(building => (
            <div key={building.id} className="building-card">
              <div className="building-info">
                <h3>{building.name}</h3>
                <p>Type: {building.building_type}</p>
                <p>Location: {building.latitude}°, {building.longitude}°</p>
                <p>Added: {new Date(building.created_at).toLocaleDateString()}</p>
              </div>
              <div className="building-actions">
                <button
                  className="select-button"
                  onClick={() => handleSelectBuilding(building)}
                >
                  Analyze Building
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simulation View Component
function SimulationView({ building, onSimulationComplete }) {
  const [weatherData, setWeatherData] = useState(null);
  const [simulationStatus, setSimulationStatus] = useState('idle');
  const [simulationId, setSimulationId] = useState(null);

  useEffect(() => {
    if (building) {
      loadWeatherData();
    }
  }, [building]);

  const loadWeatherData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/weather/${building.latitude}/${building.longitude}`
      );
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };

  const runSimulation = async (simulationType) => {
    try {
      setSimulationStatus('starting');
      
      const response = await axios.post('http://localhost:5000/api/simulate', {
        building_id: building.id,
        simulation_type: simulationType
      });

      const simId = response.data.simulation_id;
      setSimulationId(simId);
      setSimulationStatus('running');

      // Poll for results
      pollForResults(simId);

    } catch (error) {
      console.error('Error starting simulation:', error);
      setSimulationStatus('error');
    }
  };

  const pollForResults = async (simId) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/results/${simId}`);
        
        if (response.data.status === 'completed') {
          setSimulationStatus('completed');
          onSimulationComplete(response.data);
          return;
        } else if (response.data.status === 'failed') {
          setSimulationStatus('failed');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setSimulationStatus('timeout');
        }

      } catch (error) {
        console.error('Error polling results:', error);
        setSimulationStatus('error');
      }
    };

    poll();
  };

  return (
    <div className="simulation-view">
      <h2>Building Simulation - {building.name}</h2>
      
      {weatherData && (
        <div className="weather-info">
          <h3>Current Climate Conditions</h3>
          <div className="weather-grid">
            <div className="weather-item">
              <span>Location:</span>
              <span>{weatherData.location.city}, {weatherData.location.country}</span>
            </div>
            <div className="weather-item">
              <span>Temperature:</span>
              <span>{weatherData.current_conditions.temperature}°C</span>
            </div>
            <div className="weather-item">
              <span>Humidity:</span>
              <span>{weatherData.current_conditions.humidity}%</span>
            </div>
            <div className="weather-item">
              <span>Solar Irradiance:</span>
              <span>{Math.round(weatherData.current_conditions.solar_irradiance)} W/m²</span>
            </div>
          </div>
        </div>
      )}

      <div className="simulation-controls">
        <h3>Run Building Simulation</h3>
        
        <div className="simulation-options">
          <button
            className="simulation-button energy"
            onClick={() => runSimulation('energy_analysis')}
            disabled={simulationStatus === 'running'}
          >
            🔋 Energy Analysis
          </button>
          
          <button
            className="simulation-button comfort"
            onClick={() => runSimulation('thermal_comfort')}
            disabled={simulationStatus === 'running'}
          >
            🌡️ Thermal Comfort
          </button>
          
          <button
            className="simulation-button solar"
            onClick={() => runSimulation('solar_analysis')}
            disabled={simulationStatus === 'running'}
          >
            ☀️ Solar Analysis
          </button>
          
          <button
            className="simulation-button comprehensive"
            onClick={() => runSimulation('comprehensive')}
            disabled={simulationStatus === 'running'}
          >
            📊 Comprehensive Analysis
          </button>
        </div>

        {simulationStatus !== 'idle' && (
          <div className="simulation-status">
            <SimulationProgress status={simulationStatus} />
          </div>
        )}
      </div>
    </div>
  );
}

// Simulation Progress Component
function SimulationProgress({ status }) {
  const getStatusInfo = () => {
    switch (status) {
      case 'starting':
        return { message: 'Initializing simulation...', color: '#ffa500' };
      case 'running':
        return { message: 'Simulation in progress...', color: '#4CAF50' };
      case 'completed':
        return { message: 'Simulation completed successfully!', color: '#4CAF50' };
      case 'failed':
        return { message: 'Simulation failed. Please try again.', color: '#f44336' };
      case 'timeout':
        return { message: 'Simulation timed out. Please try again.', color: '#ff9800' };
      case 'error':
        return { message: 'An error occurred during simulation.', color: '#f44336' };
      default:
        return { message: 'Unknown status', color: '#666' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="progress-container">
      <div className="progress-message" style={{ color: statusInfo.color }}>
        {statusInfo.message}
      </div>
      {(status === 'starting' || status === 'running') && (
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      )}
    </div>
  );
}

// Results View Component
function ResultsView({ results, building }) {
  if (!results) {
    return <div>No simulation results available.</div>;
  }

  return (
    <div className="results-view">
      <h2>Simulation Results - {building.name}</h2>
      
      <div className="results-grid">
        {results.energy_analysis && (
          <div className="result-card">
            <h3>🔋 Energy Analysis</h3>
            <div className="metrics">
              <div className="metric">
                <span>Annual Energy Consumption:</span>
                <span>{Math.round(results.energy_analysis.total_energy_consumption)} kWh/year</span>
              </div>
              <div className="metric">
                <span>Energy Intensity:</span>
                <span>{Math.round(results.energy_analysis.energy_intensity)} kWh/m²/year</span>
              </div>
              <div className="metric">
                <span>Peak Cooling Demand:</span>
                <span>{Math.round(results.energy_analysis.peak_cooling_demand)} kW</span>
              </div>
              <div className="metric">
                <span>Peak Heating Demand:</span>
                <span>{Math.round(results.energy_analysis.peak_heating_demand)} kW</span>
              </div>
            </div>
          </div>
        )}

        {results.solar_analysis && (
          <div className="result-card">
            <h3>☀️ Solar Analysis</h3>
            <div className="metrics">
              <div className="metric">
                <span>Annual Solar Gain:</span>
                <span>{Math.round(results.solar_analysis.annual_solar_gain)} kWh/year</span>
              </div>
              <div className="metric">
                <span>Peak Solar Gain:</span>
                <span>{Math.round(results.solar_analysis.peak_solar_gain)} kW</span>
              </div>
              <div className="metric">
                <span>Daylight Availability:</span>
                <span>{Math.round(results.solar_analysis.daylight_availability)}%</span>
              </div>
            </div>
          </div>
        )}

        {results.thermal_comfort && (
          <div className="result-card">
            <h3>🌡️ Thermal Comfort</h3>
            <div className="metrics">
              <div className="metric">
                <span>Comfortable Hours:</span>
                <span>{Math.round(results.thermal_comfort.comfortable_hours)} hours/year</span>
              </div>
              <div className="metric">
                <span>Comfort Percentage:</span>
                <span>{Math.round(results.thermal_comfort.comfort_percentage)}%</span>
              </div>
              <div className="metric">
                <span>Overheating Hours:</span>
                <span>{Math.round(results.thermal_comfort.overheating_hours)} hours/year</span>
              </div>
            </div>
          </div>
        )}

        {results.climate_resilience && (
          <div className="result-card">
            <h3>🌍 Climate Resilience</h3>
            <div className="metrics">
              <div className="metric">
                <span>Heat Stress Risk:</span>
                <span>{results.climate_resilience.heat_stress_risk}</span>
              </div>
              <div className="metric">
                <span>Cooling System Strain:</span>
                <span>{Math.round(results.climate_resilience.cooling_system_strain)}%</span>
              </div>
              <div className="metric">
                <span>Adaptive Comfort Potential:</span>
                <span>{results.climate_resilience.adaptive_comfort_potential}%</span>
              </div>
              <div className="metric">
                <span>Climate Vulnerability:</span>
                <span>{results.climate_resilience.climate_change_vulnerability}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Recommendations View Component
function RecommendationsView({ building }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [building]);

  const loadRecommendations = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/recommendations/${building.id}`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (!recommendations) {
    return <div>No recommendations available.</div>;
  }

  return (
    <div className="recommendations-view">
      <h2>Climate-Resilient Retrofitting Recommendations</h2>
      <h3>{building.name}</h3>
      
      <div className="recommendations-header">
        <div className="climate-info">
          <span>Climate Zone: {recommendations.climate_zone}</span>
          <span>Priority Level: {recommendations.priority_level}</span>
        </div>
      </div>

      <div className="recommendations-list">
        {recommendations.recommendations.map((rec, index) => (
          <div key={index} className="recommendation-card">
            <div className="rec-header">
              <h4>{rec.title}</h4>
              <span className="rec-category">{rec.category}</span>
            </div>
            <p className="rec-description">{rec.description}</p>
            <div className="rec-details">
              <div className="rec-detail">
                <span>Estimated Savings:</span>
                <span>{rec.estimated_savings}</span>
              </div>
              <div className="rec-detail">
                <span>Implementation Cost:</span>
                <span>{rec.implementation_cost}</span>
              </div>
              <div className="rec-detail">
                <span>Climate Benefit:</span>
                <span>{rec.climate_benefit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3D Visualizer Component
function Visualizer3D({ building, results }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (mountRef.current) {
      initThreeJS();
      createBuildingModel();
    }

    return () => {
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [building]);

  const initThreeJS = () => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  };

  const createBuildingModel = () => {
    if (!sceneRef.current) return;

    // Create simplified building model
    const buildingGeometry = new THREE.BoxGeometry(10, 6, 15);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.position.y = 3;
    buildingMesh.castShadow = true;
    sceneRef.current.add(buildingMesh);

    // Add roof
    const roofGeometry = new THREE.ConeGeometry(8, 3, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.position.y = 7.5;
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.castShadow = true;
    sceneRef.current.add(roofMesh);

    // Add windows
    const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
    
    for (let i = 0; i < 3; i++) {
      const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(-4.5 + i * 3, 2, 7.51);
      sceneRef.current.add(window1);
      
      const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
      window2.position.set(-4.5 + i * 3, 2, -7.51);
      sceneRef.current.add(window2);
    }

    // Add climate visualization if results are available
    if (results && results.climate_resilience) {
      addClimateVisualization();
    }
  };

  const addClimateVisualization = () => {
    // Add heat stress visualization
    if (results.climate_resilience.heat_stress_risk === 'High') {
      const heatGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const heatMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF4444, 
        transparent: true, 
        opacity: 0.6 
      });
      
      for (let i = 0; i < 5; i++) {
        const heatSphere = new THREE.Mesh(heatGeometry, heatMaterial);
        heatSphere.position.set(
          (Math.random() - 0.5) * 20,
          10 + Math.random() * 5,
          (Math.random() - 0.5) * 20
        );
        sceneRef.current.add(heatSphere);
      }
    }
  };

  return (
    <div className="visualizer-3d">
      <h2>3D Building Visualization - {building.name}</h2>
      <div className="viewer-container">
        <div ref={mountRef} className="three-js-container" />
        <div className="visualization-controls">
          <h4>Visualization Controls</h4>
          <p>• Scroll to zoom in/out</p>
          <p>• Click and drag to rotate view</p>
          <p>• Climate stress indicators shown in red</p>
        </div>
      </div>
    </div>
  );
}

export default CHIPApp;