class WeatherApp {
            constructor() {
                this.apiKey = 'a8e71c9932b20c4ceb0aed183e6a83bb'; // OpenWeatherMap API key
                this.baseUrl = 'https://api.openweathermap.org/data/2.5';
                this.init();
            }

            init() {
                document.getElementById('searchForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const location = document.getElementById('locationInput').value.trim();
                    if (location) {
                        this.getWeatherByLocation(location);
                    }
                });

                document.getElementById('currentLocationBtn').addEventListener('click', () => {
                    this.getCurrentLocation();
                });
            }

            showLoading() {
                document.getElementById('loadingDiv').classList.remove('hidden');
                document.getElementById('weatherContent').classList.add('hidden');
                document.getElementById('errorDiv').classList.add('hidden');
            }

            hideLoading() {
                document.getElementById('loadingDiv').classList.add('hidden');
            }

            showError(message) {
                this.hideLoading();
                const errorDiv = document.getElementById('errorDiv');
                errorDiv.textContent = message;
                errorDiv.classList.remove('hidden');
                document.getElementById('weatherContent').classList.add('hidden');
            }

            showWeather() {
                this.hideLoading();
                document.getElementById('weatherContent').classList.remove('hidden');
                document.getElementById('errorDiv').classList.add('hidden');
            }

            async getWeatherByLocation(location) {
                this.showLoading();
                try {
                    // First get coordinates from location name
                    const geoResponse = await fetch(
                        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
                    );

                    if (!geoResponse.ok) {
                        throw new Error('Location not found. Please check your input and try again.');
                    }

                    const geoData = await geoResponse.json();
                    await this.getWeatherByCoords(geoData.coord.lat, geoData.coord.lon);
                } catch (error) {
                    this.showError(error.message || 'Failed to fetch weather data. Please try again.');
                }
            }

            async getWeatherByCoords(lat, lon) {
                try {
                    // Get current weather
                    const currentResponse = await fetch(
                        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
                    );

                    // Get 5-day forecast
                    const forecastResponse = await fetch(
                        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
                    );

                    if (!currentResponse.ok || !forecastResponse.ok) {
                        throw new Error('Failed to fetch weather data');
                    }

                    const currentData = await currentResponse.json();
                    const forecastData = await forecastResponse.json();

                    this.displayCurrentWeather(currentData);
                    this.displayForecast(forecastData);
                    this.showWeather();
                } catch (error) {
                    this.showError(error.message || 'Failed to fetch weather data. Please try again.');
                }
            }

            getCurrentLocation() {
                if (!navigator.geolocation) {
                    this.showError('Geolocation is not supported by this browser.');
                    return;
                }

                this.showLoading();
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        this.getWeatherByCoords(latitude, longitude);
                    },
                    (error) => {
                        let message = 'Failed to get your location. ';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                message += 'Location access denied.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                message += 'Location information unavailable.';
                                break;
                            case error.TIMEOUT:
                                message += 'Location request timed out.';
                                break;
                        }
                        this.showError(message);
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

                // Group forecast by day (every 8th item = 24 hours)
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
                    forecastItem.className = 'forecast-item';
                    forecastItem.innerHTML = `
                        <div class="forecast-day">${dayName}</div>
                        <div class="forecast-weather">
                            <div class="forecast-icon">${this.getWeatherEmoji(forecast.weather[0].icon)}</div>
                            <div class="forecast-desc">${forecast.weather[0].description}</div>
                        </div>
                        <div class="forecast-temp">
                            ${Math.round(forecast.main.temp_max)}° / ${Math.round(forecast.main.temp_min)}°
                        </div>
                    `;
                    forecastList.appendChild(forecastItem);
                });
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

        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            new WeatherApp();
        });