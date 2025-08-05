# CHIP MVP Backend - Flask API Server
# Climate-Resilient Healthcare Infrastructure Protection

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import uuid
import requests
from datetime import datetime, timedelta
import sqlite3
import threading
import tempfile
import zipfile

app = Flask(__name__)
CORS(app)

# Configuration
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'your_api_key_here')
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
DATABASE = 'chip_mvp.db'

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Database setup
def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Buildings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id TEXT PRIMARY KEY,
            name TEXT,
            latitude REAL,
            longitude REAL,
            building_type TEXT,
            file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Simulations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS simulations (
            id TEXT PRIMARY KEY,
            building_id TEXT,
            simulation_type TEXT,
            status TEXT DEFAULT 'pending',
            results_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (building_id) REFERENCES buildings (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Weather data integration
@app.route('/api/weather/<float:lat>/<float:lon>', methods=['GET'])
def get_weather_data(lat, lon):
    """Fetch weather data from OpenWeatherMap API"""
    try:
        # Current weather
        current_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        current_response = requests.get(current_url)
        current_data = current_response.json()
        
        # Climate data for building simulation
        climate_data = {
            "location": {
                "latitude": lat,
                "longitude": lon,
                "city": current_data.get("name", "Unknown"),
                "country": current_data.get("sys", {}).get("country", "Unknown")
            },
            "current_conditions": {
                "temperature": current_data.get("main", {}).get("temp", 0),
                "humidity": current_data.get("main", {}).get("humidity", 0),
                "pressure": current_data.get("main", {}).get("pressure", 0),
                "wind_speed": current_data.get("wind", {}).get("speed", 0),
                "wind_direction": current_data.get("wind", {}).get("deg", 0),
                "solar_irradiance": calculate_solar_irradiance(lat, lon)
            },
            "design_conditions": {
                "summer_design_temp": current_data.get("main", {}).get("temp_max", 35),
                "winter_design_temp": current_data.get("main", {}).get("temp_min", 5),
                "cooling_degree_days": estimate_cooling_dd(lat),
                "heating_degree_days": estimate_heating_dd(lat)
            }
        }
        
        return jsonify(climate_data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def calculate_solar_irradiance(lat, lon):
    """Estimate solar irradiance based on location and time"""
    # Simplified solar calculation for MVP
    # In production, this would use NASA POWER API or similar
    import math
    
    day_of_year = datetime.now().timetuple().tm_yday
    solar_declination = 23.45 * math.sin(math.radians(360 * (284 + day_of_year) / 365))
    
    # Simplified direct normal irradiance estimation
    dni = 900 * math.cos(math.radians(abs(lat - solar_declination)))
    return max(0, dni)

def estimate_cooling_dd(lat):
    """Estimate cooling degree days based on latitude"""
    # Simplified estimation for MVP
    if abs(lat) < 23.5:  # Tropical
        return 2000
    elif abs(lat) < 35:  # Subtropical
        return 1500
    elif abs(lat) < 50:  # Temperate
        return 1000
    else:  # Cold
        return 500

def estimate_heating_dd(lat):
    """Estimate heating degree days based on latitude"""
    # Simplified estimation for MVP
    if abs(lat) < 23.5:  # Tropical
        return 100
    elif abs(lat) < 35:  # Subtropical
        return 500
    elif abs(lat) < 50:  # Temperate
        return 2000
    else:  # Cold
        return 4000

# File upload endpoint
@app.route('/api/upload', methods=['POST'])
def upload_drawing():
    """Upload architectural drawing and building information"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Get building information
        building_data = {
            'name': request.form.get('name', 'Unnamed Building'),
            'latitude': float(request.form.get('latitude', 0)),
            'longitude': float(request.form.get('longitude', 0)),
            'building_type': request.form.get('building_type', 'healthcare')
        }
        
        # Generate unique building ID
        building_id = str(uuid.uuid4())
        
        # Save uploaded file
        filename = f"{building_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Store building information in database
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO buildings (id, name, latitude, longitude, building_type, file_path)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (building_id, building_data['name'], building_data['latitude'], 
              building_data['longitude'], building_data['building_type'], file_path))
        conn.commit()
        conn.close()
        
        # Process the building geometry (simplified for MVP)
        building_geometry = process_building_geometry(file_path)
        
        response_data = {
            "building_id": building_id,
            "message": "Building uploaded successfully",
            "geometry": building_geometry,
            "climate_zone": determine_climate_zone(building_data['latitude'])
        }
        
        return jsonify(response_data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def process_building_geometry(file_path):
    """Process uploaded building file and extract geometry"""
    # Simplified geometry processing for MVP
    # In production, this would use CAD file parsers
    
    file_ext = os.path.splitext(file_path)[1].lower()
    
    # Mock geometry data based on file type
    if file_ext in ['.dwg', '.dxf']:
        return {
            "type": "cad_drawing",
            "floors": 2,
            "floor_area": 500,  # m²
            "height": 6,  # m
            "orientation": 0,  # degrees from north
            "window_to_wall_ratio": 0.3,
            "building_envelope": {
                "wall_area": 800,  # m²
                "window_area": 120,  # m²
                "roof_area": 250   # m²
            }
        }
    elif file_ext in ['.pdf', '.jpg', '.png']:
        return {
            "type": "image_plan",
            "floors": 1,
            "floor_area": 300,  # m²
            "height": 4,  # m
            "orientation": 0,
            "window_to_wall_ratio": 0.25,
            "building_envelope": {
                "wall_area": 400,
                "window_area": 60,
                "roof_area": 150
            }
        }
    else:
        return {
            "type": "unknown",
            "floors": 1,
            "floor_area": 100,
            "height": 3,
            "orientation": 0,
            "window_to_wall_ratio": 0.2,
            "building_envelope": {
                "wall_area": 200,
                "window_area": 30,
                "roof_area": 100
            }
        }

def determine_climate_zone(latitude):
    """Determine climate zone based on latitude"""
    abs_lat = abs(latitude)
    if abs_lat < 23.5:
        return "Tropical"
    elif abs_lat < 35:
        return "Subtropical" 
    elif abs_lat < 50:
        return "Temperate"
    else:
        return "Cold"

# Simulation endpoint
@app.route('/api/simulate', methods=['POST'])
def run_simulation():
    """Execute building simulation"""
    try:
        data = request.json
        building_id = data.get('building_id')
        simulation_type = data.get('simulation_type', 'energy_analysis')
        
        if not building_id:
            return jsonify({"error": "Building ID required"}), 400
        
        # Generate simulation ID
        simulation_id = str(uuid.uuid4())
        
        # Store simulation record
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO simulations (id, building_id, simulation_type, status)
            VALUES (?, ?, ?, ?)
        ''', (simulation_id, building_id, simulation_type, 'running'))
        conn.commit()
        conn.close()
        
        # Start simulation in background thread
        thread = threading.Thread(
            target=perform_simulation,
            args=(simulation_id, building_id, simulation_type)
        )
        thread.start()
        
        return jsonify({
            "simulation_id": simulation_id,
            "status": "started",
            "message": "Simulation started successfully"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def perform_simulation(simulation_id, building_id, simulation_type):
    """Perform the actual building simulation"""
    try:
        # Get building data
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM buildings WHERE id = ?', (building_id,))
        building = cursor.fetchone()
        conn.close()
        
        if not building:
            return
        
        # Get weather data
        lat, lon = building[2], building[3]
        weather_response = requests.get(f'http://localhost:5000/api/weather/{lat}/{lon}')
        weather_data = weather_response.json()
        
        # Simulate building performance (simplified for MVP)
        results = simulate_building_performance(building, weather_data, simulation_type)
        
        # Save results
        results_file = os.path.join(RESULTS_FOLDER, f"{simulation_id}_results.json")
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Update simulation status
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE simulations 
            SET status = ?, results_path = ?, completed_at = ?
            WHERE id = ?
        ''', ('completed', results_file, datetime.now(), simulation_id))
        conn.commit()
        conn.close()
        
    except Exception as e:
        # Update simulation status to failed
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE simulations SET status = ? WHERE id = ?
        ''', ('failed', simulation_id))
        conn.commit()
        conn.close()

def simulate_building_performance(building, weather_data, simulation_type):
    """Simplified building performance simulation"""
    import random
    import math
    
    # Mock simulation results for MVP demonstration
    # In production, this would use EnergyPlus API
    
    base_temp = weather_data['current_conditions']['temperature']
    building_area = 500  # m² (from geometry processing)
    
    # Energy analysis
    cooling_load = max(0, (base_temp - 22) * building_area * 0.05)  # kWh
    heating_load = max(0, (18 - base_temp) * building_area * 0.03)  # kWh
    
    # Solar analysis
    solar_gain = weather_data['current_conditions']['solar_irradiance'] * 0.3 * 120  # Window area
    
    # Comfort analysis
    comfort_hours = max(0, 8760 - abs(base_temp - 22) * 200)
    
    results = {
        "simulation_type": simulation_type,
        "building_id": building[0],
        "timestamp": datetime.now().isoformat(),
        "energy_analysis": {
            "annual_cooling_load": cooling_load * 365,  # kWh/year
            "annual_heating_load": heating_load * 365,  # kWh/year
            "total_energy_consumption": (cooling_load + heating_load) * 365,
            "peak_cooling_demand": cooling_load * 1.5,  # kW
            "peak_heating_demand": heating_load * 1.2,  # kW
            "energy_intensity": ((cooling_load + heating_load) * 365) / building_area  # kWh/m²/year
        },
        "solar_analysis": {
            "annual_solar_gain": solar_gain * 365 * 8,  # kWh/year (8 hours average)
            "peak_solar_gain": solar_gain * 1.2,  # kW
            "solar_heat_gain_coefficient": 0.3,
            "daylight_availability": min(100, (solar_gain / 10) * 100)  # percentage
        },
        "thermal_comfort": {
            "comfortable_hours": comfort_hours,
            "comfort_percentage": (comfort_hours / 8760) * 100,
            "overheating_hours": max(0, (base_temp - 26) * 50),
            "underheating_hours": max(0, (16 - base_temp) * 50)
        },
        "climate_resilience": {
            "heat_stress_risk": "Medium" if base_temp > 30 else "Low",
            "cooling_system_strain": min(100, (base_temp - 22) * 10),
            "adaptive_comfort_potential": 75,  # percentage
            "climate_change_vulnerability": "Moderate"
        }
    }
    
    return results

# Results endpoint
@app.route('/api/results/<simulation_id>', methods=['GET'])
def get_simulation_results(simulation_id):
    """Retrieve simulation results"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM simulations WHERE id = ?', (simulation_id,))
        simulation = cursor.fetchone()
        conn.close()
        
        if not simulation:
            return jsonify({"error": "Simulation not found"}), 404
        
        status = simulation[3]
        
        if status == 'completed':
            results_path = simulation[4]
            if os.path.exists(results_path):
                with open(results_path, 'r') as f:
                    results = json.load(f)
                return jsonify(results)
            else:
                return jsonify({"error": "Results file not found"}), 404
        else:
            return jsonify({
                "simulation_id": simulation_id,
                "status": status,
                "message": f"Simulation is {status}"
            })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Recommendations endpoint
@app.route('/api/recommendations/<building_id>', methods=['GET'])
def get_retrofitting_recommendations(building_id):
    """Get climate-resilient retrofitting recommendations"""
    try:
        # Get building and latest simulation data
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM buildings WHERE id = ?', (building_id,))
        building = cursor.fetchone()
        
        cursor.execute('''
            SELECT * FROM simulations 
            WHERE building_id = ? AND status = "completed"
            ORDER BY completed_at DESC LIMIT 1
        ''', (building_id,))
        simulation = cursor.fetchone()
        conn.close()
        
        if not building:
            return jsonify({"error": "Building not found"}), 404
        
        lat, lon = building[2], building[3]
        climate_zone = determine_climate_zone(lat)
        
        # Generate recommendations based on climate and building type
        recommendations = generate_climate_recommendations(climate_zone, building, simulation)
        
        return jsonify(recommendations)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_climate_recommendations(climate_zone, building, simulation):
    """Generate climate-specific retrofitting recommendations"""
    
    recommendations = {
        "building_id": building[0],
        "climate_zone": climate_zone,
        "priority_level": "High",
        "recommendations": []
    }
    
    # Climate-specific recommendations
    if climate_zone in ["Tropical", "Subtropical"]:
        recommendations["recommendations"].extend([
            {
                "category": "Cooling",
                "title": "Enhanced Natural Ventilation",
                "description": "Install cross-ventilation systems and ceiling fans to reduce mechanical cooling loads",
                "estimated_savings": "20-30% cooling energy",
                "implementation_cost": "Low",
                "climate_benefit": "Reduces overheating risk during power outages"
            },
            {
                "category": "Solar Protection",
                "title": "External Shading Systems",
                "description": "Install overhangs, louvers, or vegetation for solar heat gain control",
                "estimated_savings": "15-25% cooling energy",
                "implementation_cost": "Medium",
                "climate_benefit": "Maintains indoor comfort during extreme heat events"
            },
            {
                "category": "Building Envelope",
                "title": "Cool Roof Technology",
                "description": "Apply reflective roof coatings or install cool roof materials",
                "estimated_savings": "10-20% cooling energy",
                "implementation_cost": "Low-Medium",
                "climate_benefit": "Reduces urban heat island effect and building heat gain"
            }
        ])
    
    elif climate_zone == "Temperate":
        recommendations["recommendations"].extend([
            {
                "category": "Insulation",
                "title": "Enhanced Building Insulation",
                "description": "Upgrade wall and roof insulation to reduce heating and cooling loads",
                "estimated_savings": "25-40% total energy",
                "implementation_cost": "Medium",
                "climate_benefit": "Maintains stable indoor temperatures during extreme weather"
            },
            {
                "category": "Windows",
                "title": "High-Performance Glazing",
                "description": "Install double or triple-glazed windows with low-E coatings",
                "estimated_savings": "15-25% heating/cooling energy",
                "implementation_cost": "High",
                "climate_benefit": "Reduces heat loss and solar heat gain"
            }
        ])
    
    else:  # Cold climate
        recommendations["recommendations"].extend([
            {
                "category": "Heating",
                "title": "Heat Recovery Ventilation",
                "description": "Install HRV systems to recover heat from exhaust air",
                "estimated_savings": "20-30% heating energy",
                "implementation_cost": "Medium-High",
                "climate_benefit": "Maintains indoor air quality while conserving heat"
            },
            {
                "category": "Building Envelope",
                "title": "Air Sealing",
                "description": "Seal air leaks to prevent heat loss and drafts",
                "estimated_savings": "10-20% heating energy",
                "implementation_cost": "Low",
                "climate_benefit": "Prevents frozen pipes and maintains warmth during outages"
            }
        ])
    
    # Healthcare-specific recommendations
    recommendations["recommendations"].extend([
        {
            "category": "Backup Systems",
            "title": "Renewable Energy + Storage",
            "description": "Install solar panels with battery backup for critical operations",
            "estimated_savings": "30-50% grid dependency",
            "implementation_cost": "High",
            "climate_benefit": "Ensures power during climate-related grid failures"
        },
        {
            "category": "Water Systems",
            "title": "Rainwater Harvesting",
            "description": "Install systems to collect and store rainwater for non-potable uses",
            "estimated_savings": "20-40% water costs",
            "implementation_cost": "Medium",
            "climate_benefit": "Provides water security during droughts or supply disruptions"
        }
    ])
    
    return recommendations

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

# List buildings endpoint
@app.route('/api/buildings', methods=['GET'])
def list_buildings():
    """List all buildings"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM buildings ORDER BY created_at DESC')
        buildings = cursor.fetchall()
        conn.close()
        
        buildings_list = []
        for building in buildings:
            buildings_list.append({
                "id": building[0],
                "name": building[1],
                "latitude": building[2],
                "longitude": building[3],
                "building_type": building[4],
                "created_at": building[6]
            })
        
        return jsonify(buildings_list)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting CHIP MVP Backend Server...")
    print("Available endpoints:")
    print("- POST /api/upload - Upload building drawings")
    print("- GET /api/weather/<lat>/<lon> - Get weather data")
    print("- POST /api/simulate - Run building simulation")
    print("- GET /api/results/<simulation_id> - Get simulation results")
    print("- GET /api/recommendations/<building_id> - Get retrofitting recommendations")
    print("- GET /api/buildings - List all buildings")
    print("- GET /api/health - Health check")
    
    app.run(debug=True, host='0.0.0.0', port=5000)