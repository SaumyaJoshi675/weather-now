 class WeatherAppPro {
            constructor() {
                this.apiKey = 'a8e71c9932b20c4ceb0aed183e6a83bb';
                this.baseUrl = 'https://api.openweathermap.org/data/2.5';
                this.youtubeApiKey = 'AIzaSyDummy'; // Replace with actual YouTube API key
                this.database = []; // In-memory database simulation
                this.currentWeatherData = null;
                this.init();
            }

            init() {
                this.initEventListeners();
                this.loadDatabase();
                this.setDateDefaults();
            }

            initEventListeners() {
                // Tab navigation
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        this.switchTab(e.target.dataset.tab);
                    });
                });

                // Current weather
                document.getElementById('searchBtn').addEventListener('click', () => {
                    const location = document.getElementById('locationInput').value.trim();
                    if (location) this.getWeatherByLocation(location);
                });

                document.getElementById('currentLocationBtn').addEventListener('click', () => {
                    this.getCurrentLocation();
                });

                // CRUD operations
                document.getElementById('createForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.createWeatherRecord();
                });

                document.getElementById('editForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.updateWeatherRecord();
                });

                document.getElementById('refreshRecords').addEventListener('click', () => {
                    this.displayRecords();
                });

                document.getElementById('searchRecords').addEventListener('input', (e) => {
                    this.searchRecords(e.target.value);
                });

                // Export functions
                document.getElementById('exportJSON').addEventListener('click', () => this.exportData('json'));
                document.getElementById('exportCSV').addEventListener('click', () => this.exportData('csv'));
                document.getElementById('exportXML').addEventListener('click', () => this.exportData('xml'));
                document.getElementById('exportMD').addEventListener('click', () => this.exportData('md'));

                // API integrations
                document.getElementById('showMapBtn').addEventListener('click', () => this.showMap());
                document.getElementById('showVideosBtn').addEventListener('click', () => this.showVideos());
            }

            setDateDefaults() {
                const today = new Date();
                const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                
                document.getElementById('startDate').value = oneWeekAgo.toISOString().split('T')[0];
                document.getElementById('endDate').value = today.toISOString().split('T')[0];
            }

            switchTab(tabName) {
                // Update tab buttons
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

                // Update tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(tabName).classList.add('active');

                // Load records when switching to records tab
                if (tabName === 'records') {
                    this.displayRecords();
                }
            }

            showMessage(message, type = 'success') {
                const div = document.getElementById(type === 'error' ? 'errorDiv' : 'successDiv');
                div.textContent = message;
                div.classList.remove('hidden');
                
                setTimeout(() => {
                    div.classList.add('hidden');
                }, 5000);
            }

            // Weather API Functions
            async getWeatherByLocation(location) {
                this.showLoading();
                try {
                    const response = await fetch(
                        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
                    );

                    if (!response.ok) {
                        throw new Error('Location not found. Please check your input.');
                    }

                    const data = await response.json();
                    this.currentWeatherData = data;
                    await this.getWeatherByCoords(data.coord.lat, data.coord.lon);
                } catch (error) {
                    this.showError(error.message);
                }
            }

            async getWeatherByCoords(lat, lon) {
                try {
                    const [currentResponse, forecastResponse] = await Promise.all([
                        fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`),
                        fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`)
                    ]);

                    if (!currentResponse.ok || !forecastResponse.ok) {
                        throw new Error('Failed to fetch weather data');
                    }

                    const currentData = await currentResponse.json();
                    const forecastData = await forecastResponse.json();

                    this.currentWeatherData = currentData;
                    this.displayCurrentWeather(currentData);
                    this.displayForecast(forecastData);
                    this.showWeather();
                } catch (error) {
                    this.showError(error.message);
                }
            }

            getCurrentLocation() {
                if (!navigator.geolocation) {
                    this.showError('Geolocation not supported by this browser.');
                    return;
                }

                this.showLoading();
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        this.getWeatherByCoords(latitude, longitude);
                    },
                    (error) => {
                        this.showError('Failed to get your location.');
                    }
                );
            }

            displayCurrentWeather(data) {
                document.getElementById('locationName').textContent = `${data.name}, ${data.sys.country}`;
                document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°C`;
                document.getElementById('currentDesc').textContent = data.weather[0].description;
                document.getElementById('currentIcon').textContent = this.getWeatherEmoji(data.weather[0].icon);
                document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
                document.getElementById('humidity').textContent = `${data.main.humidity}%`;
                document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
                document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
            }

            displayForecast(data) {
                const forecastList = document.getElementById('forecastList');
                forecastList.innerHTML = '';

                const dailyForecasts = [];
                for (let i = 0; i < data.list.length; i += 8) {
                    if (dailyForecasts.length < 5) {
                        dailyForecasts.push(data.list[i]);
                    }
                }

                dailyForecasts.forEach((forecast, index) => {
                    const date = new Date(forecast.dt * 1000);
                    const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    const forecastItem = document.createElement('div');
                    forecastItem.className = 'detail-item';
                    forecastItem.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">${dayName}</div>
                                <div style="opacity: 0.8; text-transform: capitalize;">${forecast.weather[0].description}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 2em; margin: 5px 0;">${this.getWeatherEmoji(forecast.weather[0].icon)}</div>
                                <div style="font-weight: 600;">${Math.round(forecast.main.temp_max)}° / ${Math.round(forecast.main.temp_min)}°</div>
                            </div>
                        </div>
                    `;
                    forecastList.appendChild(forecastItem);
                });
            }

            // CRUD Operations
            async createWeatherRecord() {
                const location = document.getElementById('createLocation').value.trim();
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;

                if (!this.validateDateRange(startDate, endDate)) {
                    this.showError('Invalid date range. End date must be after start date.');
                    return;
                }

                this.showLoading();
                
                try {
                    // Validate location exists
                    const locationResponse = await fetch(
                        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
                    );

                    if (!locationResponse.ok) {
                        throw new Error('Location not found. Please enter a valid location.');
                    }

                    const locationData = await locationResponse.json();
                    
                    // Get historical/current weather data
                    const weatherData = await this.getHistoricalWeather(locationData.coord.lat, locationData.coord.lon, startDate, endDate);
                    
                    // Create database record
                    const record = {
                        id: Date.now().toString(),
                        location: location,
                        locationName: `${locationData.name}, ${locationData.sys.country}`,
                        startDate: startDate,
                        endDate: endDate,
                        coordinates: {
                            lat: locationData.coord.lat,
                            lon: locationData.coord.lon
                        },
                        weatherData: weatherData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    this.database.push(record);
                    this.saveDatabase();
                    
                    this.hideLoading();
                    this.showMessage('Weather record created successfully!');
                    document.getElementById('createForm').reset();
                    this.setDateDefaults();
                    
                } catch (error) {
                    this.hideLoading();
                    this.showError(error.message);
                }
            }

            async getHistoricalWeather(lat, lon, startDate, endDate) {
                // Simulate historical weather data (in real app, use historical weather API)
                const start = new Date(startDate);
                const end = new Date(endDate);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                
                const weatherData = [];
                for (let i = 0; i < days; i++) {
                    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
                    weatherData.push({
                        date: date.toISOString().split('T')[0],
                        temperature: Math.round(15 + Math.random() * 20), // Random temp 15-35°C
                        humidity: Math.round(40 + Math.random() * 50),    // Random humidity 40-90%
                        windSpeed: Math.round(Math.random() * 20),        // Random wind 0-20 km/h
                        description: ['sunny', 'cloudy', 'rainy', 'partly cloudy'][Math.floor(Math.random() * 4)]
                    });
                }
                
                return weatherData;
            }

            validateDateRange(start, end) {
                const startDate = new Date(start);
                const endDate = new Date(end);
                const today = new Date();
                
                return startDate <= endDate && startDate <= today;
            }

            displayRecords() {
                const tableContainer = document.getElementById('recordsTable');
                
                if (this.database.length === 0) {
                    tableContainer.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 40px;">No weather records found. Create your first record!</p>';
                    return;
                }

                let tableHTML = `
                    <table class="records-table">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Date Range</th>
                                <th>Avg Temp</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                this.database.forEach(record => {
                    const avgTemp = Math.round(
                        record.weatherData.reduce((sum, day) => sum + day.temperature, 0) / record.weatherData.length
                    );
                    
                    tableHTML += `
                        <tr>
                            <td>${record.locationName}</td>
                            <td>${record.startDate} to ${record.endDate}</td>
                            <td>${avgTemp}°C</td>
                            <td>${new Date(record.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-warning" onclick="weatherApp.editRecord('${record.id}')">✏️ Edit</button>
                                    <button class="btn btn-danger" onclick="weatherApp.deleteRecord('${record.id}')">🗑️ Delete</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });

                tableHTML += '</tbody></table>';
                tableContainer.innerHTML = tableHTML;
            }

            editRecord(id) {
                const record = this.database.find(r => r.id === id);
                if (!record) return;

                document.getElementById('editId').value = record.id;
                document.getElementById('editLocation').value = record.location;
                document.getElementById('editStartDate').value = record.startDate;
                document.getElementById('editEndDate').value = record.endDate;
                
                this.openModal('editModal');
            }

            async updateWeatherRecord() {
                const id = document.getElementById('editId').value;
                const location = document.getElementById('editLocation').value.trim();
                const startDate = document.getElementById('editStartDate').value;
                const endDate = document.getElementById('editEndDate').value;

                if (!this.validateDateRange(startDate, endDate)) {
                    this.showError('Invalid date range. End date must be after start date.');
                    return;
                }

                try {
                    const recordIndex = this.database.findIndex(r => r.id === id);
                    if (recordIndex === -1) throw new Error('Record not found');

                    // Validate location if changed
                    const locationResponse = await fetch(
                        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
                    );

                    if (!locationResponse.ok) {
                        throw new Error('Location not found. Please enter a valid location.');
                    }

                    const locationData = await locationResponse.json();
                    const weatherData = await this.getHistoricalWeather(locationData.coord.lat, locationData.coord.lon, startDate, endDate);

                    // Update record
                    this.database[recordIndex] = {
                        ...this.database[recordIndex],
                        location: location,
                        locationName: `${locationData.name}, ${locationData.sys.country}`,
                        startDate: startDate,
                        endDate: endDate,
                        coordinates: {
                            lat: locationData.coord.lat,
                            lon: locationData.coord.lon
                        },
                        weatherData: weatherData,
                        updatedAt: new Date().toISOString()
                    };

                    this.saveDatabase();
                    this.closeModal('editModal');
                    this.displayRecords();
                    this.showMessage('Record updated successfully!');
                    
                } catch (error) {
                    this.showError(error.message);
                }
            }

            deleteRecord(id) {
                if (confirm('Are you sure you want to delete this record?')) {
                    this.database = this.database.filter(r => r.id !== id);
                    this.saveDatabase();
                    this.displayRecords();
                    this.showMessage('Record deleted successfully!');
                }
            }

            searchRecords(query) {
                if (!query.trim()) {
                    this.displayRecords();
                    return;
                }

                const filtered = this.database.filter(record => 
                    record.location.toLowerCase().includes(query.toLowerCase()) ||
                    record.locationName.toLowerCase().includes(query.toLowerCase()) ||
                    record.startDate.includes(query) ||
                    record.endDate.includes(query)
                );

                // Display filtered results
                const tableContainer = document.getElementById('recordsTable');
                
                if (filtered.length === 0) {
                    tableContainer.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 40px;">No matching records found.</p>';
                    return;
                }

                let tableHTML = `
                    <table class="records-table">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Date Range</th>
                                <th>Avg Temp</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                filtered.forEach(record => {
                    const avgTemp = Math.round(
                        record.weatherData.reduce((sum, day) => sum + day.temperature, 0) / record.weatherData.length
                    );
                    
                    tableHTML += `
                        <tr>
                            <td>${record.locationName}</td>
                            <td>${record.startDate} to ${record.endDate}</td>
                            <td>${avgTemp}°C</td>
                            <td>${new Date(record.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-warning" onclick="weatherApp.editRecord('${record.id}')">✏️ Edit</button>
                                    <button class="btn btn-danger" onclick="weatherApp.deleteRecord('${record.id}')">🗑️ Delete</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });

                tableHTML += '</tbody></table>';
                tableContainer.innerHTML = tableHTML;
            }

            // Export Functions
            exportData(format) {
                if (this.database.length === 0) {
                    this.showError('No data to export. Please create some weather records first.');
                    return;
                }

                let exportContent = '';
                let filename = '';
                let mimeType = '';

                switch (format) {
                    case 'json':
                        exportContent = JSON.stringify(this.database, null, 2);
                        filename = 'weather_data.json';
                        mimeType = 'application/json';
                        break;
                        
                    case 'csv':
                        exportContent = this.generateCSV();
                        filename = 'weather_data.csv';
                        mimeType = 'text/csv';
                        break;
                        
                    case 'xml':
                        exportContent = this.generateXML();
                        filename = 'weather_data.xml';
                        mimeType = 'application/xml';
                        break;
                        
                    case 'md':
                        exportContent = this.generateMarkdown();
                        filename = 'weather_data.md';
                        mimeType = 'text/markdown';
                        break;
                }

                // Show preview
                document.getElementById('exportContent').textContent = exportContent;
                document.getElementById('exportPreview').classList.remove('hidden');

                // Download file
                this.downloadFile(exportContent, filename, mimeType);
                this.showMessage(`Data exported as ${format.toUpperCase()} successfully!`);
            }

            generateCSV() {
                let csv = 'Location,Location Name,Start Date,End Date,Avg Temperature,Total Days,Created At\n';
                
                this.database.forEach(record => {
                    const avgTemp = Math.round(
                        record.weatherData.reduce((sum, day) => sum + day.temperature, 0) / record.weatherData.length
                    );
                    
                    csv += `"${record.location}","${record.locationName}","${record.startDate}","${record.endDate}",${avgTemp},${record.weatherData.length},"${new Date(record.createdAt).toLocaleString()}"\n`;
                });
                
                return csv;
            }

            generateXML() {
                let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<weatherRecords>\n';
                
                this.database.forEach(record => {
                    xml += '  <record>\n';
                    xml += `    <id>${record.id}</id>\n`;
                    xml += `    <location><![CDATA[${record.location}]]></location>\n`;
                    xml += `    <locationName><![CDATA[${record.locationName}]]></locationName>\n`;
                    xml += `    <startDate>${record.startDate}</startDate>\n`;
                    xml += `    <endDate>${record.endDate}</endDate>\n`;
                    xml += `    <createdAt>${record.createdAt}</createdAt>\n`;
                    xml += '    <weatherData>\n';
                    
                    record.weatherData.forEach(day => {
                        xml += '      <day>\n';
                        xml += `        <date>${day.date}</date>\n`;
                        xml += `        <temperature>${day.temperature}</temperature>\n`;
                        xml += `        <humidity>${day.humidity}</humidity>\n`;
                        xml += `        <windSpeed>${day.windSpeed}</windSpeed>\n`;
                        xml += `        <description><![CDATA[${day.description}]]></description>\n`;
                        xml += '      </day>\n';
                    });
                    
                    xml += '    </weatherData>\n';
                    xml += '  </record>\n';
                });
                
                xml += '</weatherRecords>';
                return xml;
            }

            generateMarkdown() {
                let md = '# Weather Records Database\n\n';
                md += `Generated on: ${new Date().toLocaleString()}\n\n`;
                md += `Total Records: ${this.database.length}\n\n`;
                
                this.database.forEach((record, index) => {
                    const avgTemp = Math.round(
                        record.weatherData.reduce((sum, day) => sum + day.temperature, 0) / record.weatherData.length
                    );
                    
                    md += `## Record ${index + 1}: ${record.locationName}\n\n`;
                    md += `- **Location**: ${record.location}\n`;
                    md += `- **Date Range**: ${record.startDate} to ${record.endDate}\n`;
                    md += `- **Average Temperature**: ${avgTemp}°C\n`;
                    md += `- **Total Days**: ${record.weatherData.length}\n`;
                    md += `- **Created**: ${new Date(record.createdAt).toLocaleString()}\n\n`;
                    
                    if (record.weatherData.length > 0) {
                        md += '### Daily Weather Data\n\n';
                        md += '| Date | Temperature | Humidity | Wind Speed | Description |\n';
                        md += '|------|-------------|----------|------------|-------------|\n';
                        
                        record.weatherData.forEach(day => {
                            md += `| ${day.date} | ${day.temperature}°C | ${day.humidity}% | ${day.windSpeed} km/h | ${day.description} |\n`;
                        });
                        
                        md += '\n';
                    }
                });
                
                return md;
            }

            downloadFile(content, filename, mimeType) {
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            // API Integration Functions
            showMap() {
                if (!this.currentWeatherData) {
                    this.showError('Please search for a location first.');
                    return;
                }

                this.openModal('mapModal');
                
                // Initialize map (using OpenStreetMap with Leaflet-like approach)
                const mapContainer = document.getElementById('map');
                const { lat, lon } = this.currentWeatherData.coord;
                const locationName = this.currentWeatherData.name;
                
                mapContainer.innerHTML = `
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        scrolling="no" 
                        marginheight="0" 
                        marginwidth="0" 
                        src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.1},${lat-0.1},${lon+0.1},${lat+0.1}&layer=mapnik&marker=${lat},${lon}"
                        style="border-radius: 12px;">
                    </iframe>
                    <div style="text-align: center; margin-top: 10px; opacity: 0.8;">
                        📍 ${locationName} (${lat.toFixed(4)}, ${lon.toFixed(4)})
                    </div>
                `;
            }

            async showVideos() {
                if (!this.currentWeatherData) {
                    this.showError('Please search for a location first.');
                    return;
                }

                this.openModal('videosModal');
                const videosContainer = document.getElementById('videosContent');
                videosContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Loading videos...</div>';

                try {
                    // Simulate YouTube API call (replace with real API)
                    const videos = await this.getLocationVideos(this.currentWeatherData.name);
                    this.displayVideos(videos);
                } catch (error) {
                    videosContainer.innerHTML = '<p style="text-align: center; opacity: 0.7;">Failed to load videos. Please try again later.</p>';
                }
            }

            async getLocationVideos(location) {
                // Simulate YouTube API response
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve([
                            {
                                title: `Travel Guide: ${location}`,
                                thumbnail: 'https://via.placeholder.com/300x180/667eea/white?text=Travel+Guide',
                                channelTitle: 'Travel Channel',
                                url: '#'
                            },
                            {
                                title: `Weather in ${location}`,
                                thumbnail: 'https://via.placeholder.com/300x180/764ba2/white?text=Weather+Info',
                                channelTitle: 'Weather Network',
                                url: '#'
                            },
                            {
                                title: `Best Places in ${location}`,
                                thumbnail: 'https://via.placeholder.com/300x180/f093fb/white?text=Best+Places',
                                channelTitle: 'Discovery',
                                url: '#'
                            }
                        ]);
                    }, 1000);
                });
            }

            displayVideos(videos) {
                const videosContainer = document.getElementById('videosContent');
                
                if (videos.length === 0) {
                    videosContainer.innerHTML = '<p style="text-align: center; opacity: 0.7;">No videos found for this location.</p>';
                    return;
                }

                videosContainer.innerHTML = videos.map(video => `
                    <div class="video-item">
                        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                        <div>
                            <h4 style="margin-bottom: 8px;">${video.title}</h4>
                            <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 10px;">${video.channelTitle}</p>
                            <a href="${video.url}" target="_blank" class="btn btn-primary btn-sm">▶️ Watch</a>
                        </div>
                    </div>
                `).join('');
            }

            // Database Functions
            loadDatabase() {
                try {
                    const saved = JSON.parse(localStorage.getItem('weatherDatabase') || '[]');
                    this.database = saved;
                } catch (error) {
                    console.warn('Failed to load database from localStorage:', error);
                    this.database = [];
                }
            }

            saveDatabase() {
                try {
                    localStorage.setItem('weatherDatabase', JSON.stringify(this.database));
                } catch (error) {
                    console.warn('Failed to save database to localStorage:', error);
                }
            }

            // Utility Functions
            openModal(modalId) {
                document.getElementById(modalId).classList.add('active');
            }

            closeModal(modalId) {
                document.getElementById(modalId).classList.remove('active');
            }

            showLoading() {
                document.getElementById('loadingDiv').classList.remove('hidden');
            }

            hideLoading() {
                document.getElementById('loadingDiv').classList.add('hidden');
            }

            showError(message) {
                this.hideLoading();
                document.getElementById('errorDiv').textContent = message;
                document.getElementById('errorDiv').classList.remove('hidden');
                document.getElementById('successDiv').classList.add('hidden');
            }

            showWeather() {
                this.hideLoading();
                document.getElementById('weatherContent').classList.remove('hidden');
                document.getElementById('errorDiv').classList.add('hidden');
            }

            getWeatherEmoji(iconCode) {
                const iconMap = {
                    '01d': '☀️', '01n': '🌙',
                    '02d': '⛅', '02n': '☁️',
                    '03d': '☁️', '03n': '☁️',
                    '04d': '☁️', '04n': '☁️',
                    '09d': '🌧️', '09n': '🌧️',
                    '10d': '🌦️', '10n': '🌧️',
                    '11d': '⛈️', '11n': '⛈️',
                    '13d': '🌨️', '13n': '🌨️',
                    '50d': '🌫️', '50n': '🌫️'
                };
                return iconMap[iconCode] || '🌤️';
            }
        }

        // Global functions for modal and record operations
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // Initialize the app
        let weatherApp;
        document.addEventListener('DOMContentLoaded', () => {
            weatherApp = new WeatherAppPro();
        });