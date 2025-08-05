// CHIP MVP Application JavaScript

// Demo data from application_data_json
const demoData = {
  demoBuildings: [
    {
      id: "demo-delhi-hospital",
      name: "Regional Hospital New Delhi",
      location: {lat: 28.6139, lon: 77.2090, city: "New Delhi", country: "India"},
      buildingType: "hospital",
      climateZone: "Subtropical",
      floorArea: 2500,
      floors: 3,
      uploaded: "2024-01-15T10:30:00Z"
    },
    {
      id: "demo-mumbai-clinic", 
      name: "Community Health Center Mumbai",
      location: {lat: 19.0760, lon: 72.8777, city: "Mumbai", country: "India"},
      buildingType: "clinic",
      climateZone: "Tropical",
      floorArea: 800,
      floors: 2,
      uploaded: "2024-01-20T14:15:00Z"
    }
  ],
  weatherData: {
    newDelhi: {
      temperature: 34.5,
      humidity: 68,
      windSpeed: 12.5,
      solarIrradiance: 850,
      uvIndex: 9,
      airQuality: "Moderate"
    },
    mumbai: {
      temperature: 31.2,
      humidity: 78,
      windSpeed: 18.3,
      solarIrradiance: 720,
      uvIndex: 8,
      airQuality: "Poor"
    }
  },
  simulationResults: {
    energyAnalysis: {
      annualConsumption: 145000,
      energyIntensity: 58,
      peakCooling: 85.5,
      peakHeating: 12.3,
      coolingLoad: 89500,
      heatingLoad: 8200
    },
    solarAnalysis: {
      annualSolarGain: 32500,
      peakSolarGain: 45.8,
      daylightAvailability: 72,
      solarHeatGainCoeff: 0.32
    },
    thermalComfort: {
      comfortableHours: 6840,
      comfortPercentage: 78.1,
      overheatingHours: 1250,
      underheatingHours: 670
    },
    climateResilience: {
      heatStressRisk: "High",
      coolingSystemStrain: 85,
      adaptiveComfortPotential: 65,
      vulnerabilityScore: "Moderate-High"
    }
  },
  recommendations: [
    {
      category: "Cooling",
      title: "Enhanced Natural Ventilation",
      description: "Install cross-ventilation systems and ceiling fans to reduce mechanical cooling loads by 25-30%",
      estimatedSavings: "25-30% cooling energy",
      implementationCost: "₹2,50,000 - ₹4,00,000",
      paybackPeriod: "18-24 months",
      climateBenefit: "Reduces overheating risk during power outages",
      priority: "High"
    },
    {
      category: "Solar Protection", 
      title: "External Shading Systems",
      description: "Install overhangs, louvers, or vegetation for solar heat gain control",
      estimatedSavings: "15-25% cooling energy",
      implementationCost: "₹3,50,000 - ₹6,00,000", 
      paybackPeriod: "24-36 months",
      climateBenefit: "Maintains indoor comfort during extreme heat events",
      priority: "High"
    },
    {
      category: "Building Envelope",
      title: "Cool Roof Technology", 
      description: "Apply reflective roof coatings or install cool roof materials",
      estimatedSavings: "10-20% cooling energy",
      implementationCost: "₹1,50,000 - ₹2,50,000",
      paybackPeriod: "12-18 months", 
      climateBenefit: "Reduces urban heat island effect and building heat gain",
      priority: "Medium"
    },
    {
      category: "Backup Systems",
      title: "Solar + Battery Backup",
      description: "Install solar panels with battery backup for critical operations",
      estimatedSavings: "40-60% grid dependency",
      implementationCost: "₹8,00,000 - ₹12,00,000",
      paybackPeriod: "48-60 months",
      climateBenefit: "Ensures power during climate-related grid failures", 
      priority: "High"
    }
  ]
};

// Global state
let currentBuilding = null;
let currentLocation = null;
let scene, camera, renderer, controls;
let animationId = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('CHIP app initializing...');
  initializeApp();
});

function initializeApp() {
  setupNavigation();
  setupUploadForm();
  setupSimulation();
  setupEventListeners();
  renderDemoBuildings();
  renderRecommendations();
  
  // Show landing page by default
  showSection('landing');
  console.log('CHIP app initialized successfully');
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('nav a');
  console.log(`Setting up navigation for ${navLinks.length} links`);
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      console.log(`Navigating to section: ${targetId}`);
      showSection(targetId);
      updateActiveNav(link);
      
      // Handle section-specific initialization
      if (targetId === 'visualizer') {
        setTimeout(() => {
          console.log('Initializing 3D visualizer...');
          init3DVisualizer();
        }, 200);
      } else if (targetId === 'results') {
        setTimeout(() => {
          console.log('Rendering charts...');
          renderCharts();
        }, 100);
      }
    });
  });
}

function updateActiveNav(activeLink) {
  document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
  activeLink.classList.add('active');
}

function showSection(sectionId) {
  console.log(`Showing section: ${sectionId}`);
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.classList.add('fade-in');
    console.log(`Successfully showed section: ${sectionId}`);
  } else {
    console.error(`Section not found: ${sectionId}`);
  }
}

function setupEventListeners() {
  // CTA buttons
  const ctaStart = document.getElementById('ctaStart');
  const ctaDemo = document.getElementById('ctaDemo');
  
  if (ctaStart) {
    ctaStart.addEventListener('click', () => {
      console.log('CTA Start clicked');
      showSection('upload');
      updateActiveNav(document.querySelector('nav a[href="#upload"]'));
    });
  }

  if (ctaDemo) {
    ctaDemo.addEventListener('click', () => {
      console.log('CTA Demo clicked');
      loadDemoBuilding(demoData.demoBuildings[0]);
    });
  }

  // Flow buttons
  const toVisualizer = document.getElementById('toVisualizer');
  const toRetrofit = document.getElementById('toRetrofit');
  
  if (toVisualizer) {
    toVisualizer.addEventListener('click', () => {
      console.log('To Visualizer clicked');
      showSection('visualizer');
      updateActiveNav(document.querySelector('nav a[href="#visualizer"]'));
      setTimeout(init3DVisualizer, 200);
    });
  }

  if (toRetrofit) {
    toRetrofit.addEventListener('click', () => {
      console.log('To Retrofit clicked');
      showSection('recommendations');
      updateActiveNav(document.querySelector('nav a[href="#recommendations"]'));
    });
  }

  // Geolocation
  const geoBtn = document.getElementById('geoBtn');
  if (geoBtn) {
    geoBtn.addEventListener('click', getUserLocation);
  }

  // 3D controls
  const heatToggle = document.getElementById('heatToggle');
  const sunToggle = document.getElementById('sunToggle');
  
  if (heatToggle) {
    heatToggle.addEventListener('click', toggleHeatOverlay);
  }
  
  if (sunToggle) {
    sunToggle.addEventListener('click', toggleSunPath);
  }
}

function setupUploadForm() {
  const form = document.getElementById('uploadForm');
  if (form) {
    form.addEventListener('submit', handleUpload);
  }
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      document.getElementById('lat').value = position.coords.latitude.toFixed(4);
      document.getElementById('lon').value = position.coords.longitude.toFixed(4);
    }, (error) => {
      alert('Could not get location: ' + error.message);
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

function handleUpload(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const buildingData = {
    name: formData.get('buildingName'),
    type: formData.get('buildingType'),
    lat: parseFloat(formData.get('lat')),
    lon: parseFloat(formData.get('lon')),
    file: formData.get('drawing')
  };

  // Simulate upload progress
  showUploadProgress();
  simulateUploadProgress().then(() => {
    const buildingId = 'building-' + Date.now();
    showUploadSuccess(buildingId);
    currentBuilding = {
      id: buildingId,
      name: buildingData.name,
      location: { lat: buildingData.lat, lon: buildingData.lon },
      buildingType: buildingData.type
    };
    currentLocation = determineLocation(buildingData.lat, buildingData.lon);
  });
}

function showUploadProgress() {
  const uploadProgress = document.getElementById('uploadProgress');
  if (uploadProgress) {
    uploadProgress.classList.remove('hidden');
  }
}

function simulateUploadProgress() {
  return new Promise((resolve) => {
    const progressBar = document.getElementById('uploadBar');
    if (!progressBar) {
      resolve();
      return;
    }
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        resolve();
      }
      progressBar.style.width = progress + '%';
    }, 200);
  });
}

function showUploadSuccess(buildingId) {
  const successEl = document.getElementById('uploadSuccess');
  if (successEl) {
    successEl.textContent = `Upload successful! Building ID: ${buildingId}`;
    successEl.classList.remove('hidden');
  }
  
  setTimeout(() => {
    showSection('simulation');
    updateActiveNav(document.querySelector('nav a[href="#simulation"]'));
    setupSimulationDashboard();
  }, 2000);
}

function renderDemoBuildings() {
  const container = document.getElementById('demoList');
  if (!container) return;
  
  container.innerHTML = '';
  
  demoData.demoBuildings.forEach(building => {
    const buildingEl = document.createElement('div');
    buildingEl.className = 'demo-building';
    buildingEl.innerHTML = `
      <h4>${building.name}</h4>
      <div class="meta">
        <span>Type: ${building.buildingType}</span>
        <span>Location: ${building.location.city}</span>
        <span>Zone: ${building.climateZone}</span>
        <span>Area: ${building.floorArea}m²</span>
      </div>
    `;
    buildingEl.addEventListener('click', () => loadDemoBuilding(building));
    container.appendChild(buildingEl);
  });
}

function loadDemoBuilding(building) {
  console.log('Loading demo building:', building.name);
  currentBuilding = building;
  currentLocation = building.location.city.toLowerCase().replace(' ', '');
  
  showSection('simulation');
  updateActiveNav(document.querySelector('nav a[href="#simulation"]'));
  setupSimulationDashboard();
}

function setupSimulationDashboard() {
  if (!currentBuilding || !currentLocation) return;
  
  const weatherKey = currentLocation === 'newdelhi' ? 'newDelhi' : 'mumbai';
  const weather = demoData.weatherData[weatherKey];
  
  const weatherInfo = document.getElementById('weatherInfo');
  if (weatherInfo) {
    weatherInfo.innerHTML = `
      <strong>Current Conditions - ${currentBuilding.location.city || currentBuilding.name}</strong><br>
      Temperature: ${weather.temperature}°C | Humidity: ${weather.humidity}% | 
      Wind: ${weather.windSpeed} km/h | Solar: ${weather.solarIrradiance} W/m² | 
      UV Index: ${weather.uvIndex} | Air Quality: ${weather.airQuality}
    `;
  }
}

function setupSimulation() {
  const startSimBtn = document.getElementById('startSimBtn');
  if (startSimBtn) {
    startSimBtn.addEventListener('click', startSimulation);
  }
}

function startSimulation() {
  const simType = document.getElementById('simType')?.value || 'comprehensive';
  const progressContainer = document.getElementById('simProgress');
  const statusContainer = document.getElementById('simStatus');
  
  if (progressContainer) {
    progressContainer.classList.remove('hidden');
  }
  
  if (statusContainer) {
    statusContainer.classList.remove('hidden');
    statusContainer.textContent = `Starting ${simType} simulation...`;
    statusContainer.className = 'status status--info mt-8';
  }
  
  simulateProgress().then(() => {
    if (statusContainer) {
      statusContainer.textContent = 'Simulation complete! View results below.';
      statusContainer.className = 'status status--success mt-8';
    }
    
    setTimeout(() => {
      showSection('results');
      updateActiveNav(document.querySelector('nav a[href="#results"]'));
      renderCharts();
    }, 1500);
  });
}

function simulateProgress() {
  return new Promise((resolve) => {
    const progressBar = document.getElementById('simBar');
    if (!progressBar) {
      resolve();
      return;
    }
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        resolve();
      }
      progressBar.style.width = progress + '%';
    }, 300);
  });
}

function renderCharts() {
  console.log('Rendering charts...');
  try {
    renderEnergyChart();
    renderSolarChart();
    renderComfortChart();
    renderResilienceChart();
    console.log('Charts rendered successfully');
  } catch (error) {
    console.error('Error rendering charts:', error);
  }
}

function renderEnergyChart() {
  const canvas = document.getElementById('energyChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const data = demoData.simulationResults.energyAnalysis;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Annual Consumption (MWh)', 'Energy Intensity (kWh/m²)', 'Peak Cooling (kW)', 'Peak Heating (kW)'],
      datasets: [{
        label: 'Energy Metrics',
        data: [data.annualConsumption/1000, data.energyIntensity, data.peakCooling, data.peakHeating],
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderSolarChart() {
  const canvas = document.getElementById('solarChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const data = demoData.simulationResults.solarAnalysis;
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Daylight Available', 'Artificial Light Needed'],
      datasets: [{
        data: [data.daylightAvailability, 100 - data.daylightAvailability],
        backgroundColor: ['#1FB8CD', '#5D878F']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderComfortChart() {
  const canvas = document.getElementById('comfortChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const data = demoData.simulationResults.thermalComfort;
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Comfortable Hours', 'Overheating Hours', 'Underheating Hours'],
      datasets: [{
        data: [data.comfortableHours, data.overheatingHours, data.underheatingHours],
        backgroundColor: ['#1FB8CD', '#B4413C', '#FFC185']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderResilienceChart() {
  const canvas = document.getElementById('resilienceChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const data = demoData.simulationResults.climateResilience;
  
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Heat Stress Risk', 'Cooling System Strain', 'Adaptive Comfort', 'Overall Vulnerability'],
      datasets: [{
        label: 'Resilience Metrics',
        data: [75, data.coolingSystemStrain, data.adaptiveComfortPotential, 70],
        backgroundColor: 'rgba(31, 184, 205, 0.2)',
        borderColor: '#1FB8CD',
        pointBackgroundColor: '#1FB8CD'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function init3DVisualizer() {
  const container = document.getElementById('threeContainer');
  if (!container) {
    console.error('3D container not found');
    return;
  }
  
  console.log('Initializing 3D visualizer...');
  
  // Clear any existing content
  container.innerHTML = '';
  
  // Cancel any existing animation loop
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  try {
    // Check if THREE is available
    if (typeof THREE === 'undefined') {
      console.error('THREE.js not loaded');
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f8ff;color:#333;">THREE.js not available</div>';
      return;
    }

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8f4f8);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // OrbitControls setup
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      console.log('OrbitControls initialized');
    } else {
      console.warn('OrbitControls not available');
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create building
    createBuilding();

    // Position camera
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);

    console.log('3D scene setup complete, starting animation...');
    
    // Start animation loop
    animate();
    
  } catch (error) {
    console.error('3D initialization error:', error);
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f8ff;color:#333;font-size:16px;border-radius:8px;">3D Visualization Error</div>';
  }
}

function createBuilding() {
  console.log('Creating 3D building...');
  
  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(30, 30);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Main building structure
  const buildingGeometry = new THREE.BoxGeometry(8, 6, 12);
  const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
  const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
  building.position.y = 3;
  building.castShadow = true;
  building.receiveShadow = true;
  building.name = 'mainBuilding';
  scene.add(building);

  // Roof
  const roofGeometry = new THREE.BoxGeometry(9, 0.5, 13);
  const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 6.25;
  roof.castShadow = true;
  scene.add(roof);

  // Windows on front face
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const windowGeometry = new THREE.PlaneGeometry(1.2, 1.5);
      const windowMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4169E1,
        transparent: true,
        opacity: 0.7
      });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-2.5 + i * 2.5, 2 + j * 2, 6.01);
      scene.add(window);
    }
  }

  // Door
  const doorGeometry = new THREE.PlaneGeometry(1.5, 2.5);
  const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, 1.25, 6.01);
  scene.add(door);

  // Add some trees for context
  for (let i = 0; i < 4; i++) {
    const treeGeometry = new THREE.ConeGeometry(1, 3, 6);
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const tree = new THREE.Mesh(treeGeometry, treeMaterial);
    
    const angle = (i / 4) * Math.PI * 2;
    tree.position.set(
      Math.cos(angle) * 12, 
      1.5, 
      Math.sin(angle) * 12
    );
    tree.castShadow = true;
    scene.add(tree);
  }
  
  console.log('3D building created successfully');
}

function animate() {
  animationId = requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  // Animate sun if it exists
  const sun = scene?.getObjectByName('sunPath');
  if (sun && sun.userData.animate) {
    sun.userData.animate();
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function toggleHeatOverlay() {
  console.log('Toggling heat overlay...');
  if (!scene) return;
  
  const building = scene.getObjectByName('mainBuilding');
  if (building) {
    const currentColor = building.material.color.getHex();
    if (currentColor === 0x87CEEB) {
      // Apply heat overlay - red gradient
      building.material.color.setHex(0xFF6B6B);
      console.log('Heat overlay applied');
    } else {
      // Reset to normal color
      building.material.color.setHex(0x87CEEB);
      console.log('Heat overlay removed');
    }
  }
}

function toggleSunPath() {
  console.log('Toggling sun path...');
  if (!scene) return;
  
  const existingSun = scene.getObjectByName('sunPath');
  if (existingSun) {
    scene.remove(existingSun);
    console.log('Sun path removed');
  } else {
    const sunGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFD700,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.3
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.name = 'sunPath';
    sun.position.set(12, 8, 8);
    scene.add(sun);

    // Add sun path animation
    sun.userData.animate = function() {
      const time = Date.now() * 0.0005;
      sun.position.x = 12 * Math.cos(time);
      sun.position.z = 12 * Math.sin(time);
      sun.position.y = 8 + 3 * Math.sin(time * 0.5);
    };
    
    console.log('Sun path added');
  }
}

function renderRecommendations() {
  const tbody = document.getElementById('recommendationBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  demoData.recommendations.forEach(rec => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="priority-${rec.priority.toLowerCase()}">${rec.priority}</span></td>
      <td>
        <strong>${rec.title}</strong><br>
        <small style="color: var(--color-text-secondary);">${rec.description}</small>
      </td>
      <td>${rec.estimatedSavings}</td>
      <td>${rec.implementationCost}</td>
      <td>${rec.paybackPeriod}</td>
      <td><small>${rec.climateBenefit}</small></td>
    `;
    tbody.appendChild(row);
  });
  
  console.log('Recommendations rendered');
}

function determineLocation(lat, lon) {
  // Simple location determination based on coordinates
  if (lat > 28 && lat < 29 && lon > 77 && lon < 78) {
    return 'newDelhi';
  } else if (lat > 18 && lat < 20 && lon > 72 && lon < 73) {
    return 'mumbai';
  }
  return 'newDelhi'; // Default
}

// Handle window resize for 3D viewer
window.addEventListener('resize', () => {
  if (camera && renderer) {
    const container = document.getElementById('threeContainer');
    if (container && container.clientWidth > 0) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  }
});

// Export for potential external use
window.CHIP = {
  showSection,
  loadDemoBuilding: (index) => loadDemoBuilding(demoData.demoBuildings[index]),
  getCurrentBuilding: () => currentBuilding,
  demoData,
  // Debug functions
  debugNav: () => {
    console.log('Available sections:', document.querySelectorAll('.section'));
    console.log('Current building:', currentBuilding);
  }
};

console.log('CHIP application loaded');