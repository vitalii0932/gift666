/**
 * gift.js — Gift Hints Page
 * Nova Poshta city/warehouse search, Leaflet map, star rating, form submission.
 */

const GiftPage = {

    // ── State ───────────────────────────────────────────────────────────
    map: null,
    markers: [],
    selectedMarker: null,
    debounceTimer: null,
    currentRating: 0,
    warehouses: [],

    // ── Bootstrap ───────────────────────────────────────────────────────
    init() {
        this.initMap();
        this.initCitySearch();
        this.initWarehouseSelect();
        this.initStarRating();
        this.initFormSubmit();
    },

    // ── Leaflet Map ─────────────────────────────────────────────────────
    initMap() {
        this.map = L.map('map').setView([48.5, 31.5], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(this.map);
    },

    clearMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
        this.selectedMarker = null;
    },

    addWarehouseMarkers(warehouses) {
        this.clearMarkers();

        warehouses.forEach(wh => {
            const lat = parseFloat(wh.Latitude);
            const lng = parseFloat(wh.Longitude);
            if (!lat || !lng) return;

            const marker = L.marker([lat, lng])
                .addTo(this.map)
                .bindPopup(wh.Description);

            this.markers.push(marker);
        });

        // Fit map to show all markers
        if (this.markers.length) {
            const group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.15));
        }
    },

    flyToWarehouse(warehouse) {
        const lat = parseFloat(warehouse.Latitude);
        const lng = parseFloat(warehouse.Longitude);
        if (!lat || !lng) return;

        this.map.flyTo([lat, lng], 16, { duration: 1.2 });

        // Highlight the selected marker
        this.markers.forEach(m => {
            const pos = m.getLatLng();
            if (
                Math.abs(pos.lat - lat) < 0.0001 &&
                Math.abs(pos.lng - lng) < 0.0001
            ) {
                m.openPopup();
                this.selectedMarker = m;
            }
        });
    },

    // ── City Search (autocomplete) ──────────────────────────────────────
    initCitySearch() {
        const input = document.getElementById('citySearch');
        const dropdown = document.getElementById('citySuggestions');

        input.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            const query = input.value.trim();

            if (query.length < 2) {
                this.hideSuggestions();
                return;
            }

            this.debounceTimer = setTimeout(() => this.searchCities(query), 300);
        });

        // Close dropdown on outside click
        document.addEventListener('click', e => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    },

    async searchCities(query) {
        const dropdown = document.getElementById('citySuggestions');
        dropdown.innerHTML =
            '<div class="suggestion-item suggestion-loading">Завантаження...</div>';
        dropdown.classList.add('active');

        try {
            const res = await fetch('/api/cities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search: query }),
            });

            if (!res.ok) throw new Error('Network');

            const json = await res.json();
            const cities = json.data || [];

            if (!cities.length) {
                dropdown.innerHTML =
                    '<div class="suggestion-item suggestion-empty">Місто не знайдено</div>';
                return;
            }

            dropdown.innerHTML = '';
            cities.forEach(city => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = city.AreaDescription
                    ? `${city.Description} (${city.AreaDescription} обл.)`
                    : city.Description;

                item.addEventListener('click', () => this.selectCity(city));
                dropdown.appendChild(item);
            });
        } catch {
            dropdown.innerHTML =
                '<div class="suggestion-item suggestion-error">Помилка завантаження. Спробуй ще раз.</div>';
        }
    },

    selectCity(city) {
        document.getElementById('citySearch').value = city.Description;
        document.getElementById('cityRef').value = city.Ref;
        document.getElementById('cityName').value = city.Description;
        this.hideSuggestions();
        this.loadWarehouses(city.Ref);
    },

    hideSuggestions() {
        const dropdown = document.getElementById('citySuggestions');
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
    },

    // ── Warehouse Select ────────────────────────────────────────────────
    initWarehouseSelect() {
        const select = document.getElementById('warehouseSelect');

        select.addEventListener('change', () => {
            const idx = parseInt(select.value, 10);
            if (isNaN(idx)) return;

            const wh = this.warehouses[idx];
            if (!wh) return;

            document.getElementById('warehouseName').value = wh.Description;
            this.flyToWarehouse(wh);
        });
    },

    async loadWarehouses(cityRef) {
        const select = document.getElementById('warehouseSelect');
        select.disabled = true;
        select.innerHTML = '<option value="">Завантаження відділень...</option>';

        try {
            const res = await fetch('/api/warehouses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cityRef }),
            });

            if (!res.ok) throw new Error('Network');

            const json = await res.json();
            this.warehouses = json.data || [];

            if (!this.warehouses.length) {
                select.innerHTML =
                    '<option value="">Відділення не знайдені</option>';
                this.clearMarkers();
                return;
            }

            select.innerHTML =
                '<option value="">Обери відділення...</option>';
            this.warehouses.forEach((wh, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = wh.Description;
                select.appendChild(opt);
            });

            select.disabled = false;
            this.addWarehouseMarkers(this.warehouses);
        } catch {
            select.innerHTML =
                '<option value="">Помилка завантаження</option>';
        }
    },

    // ── Star Rating ─────────────────────────────────────────────────────
    initStarRating() {
        const container = document.getElementById('starRating');
        container.innerHTML = '';

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.dataset.value = i;
            star.textContent = '☆';

            star.addEventListener('mouseenter', () => this.hoverStars(i));
            star.addEventListener('mouseleave', () =>
                this.renderStars(this.currentRating),
            );
            star.addEventListener('click', () => this.setRating(i));

            container.appendChild(star);
        }
    },

    hoverStars(upTo) {
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach(s => {
            const v = parseInt(s.dataset.value, 10);
            s.textContent = v <= upTo ? '★' : '☆';
            s.classList.toggle('star--active', v <= upTo);
        });
    },

    renderStars(upTo) {
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach(s => {
            const v = parseInt(s.dataset.value, 10);
            s.textContent = v <= upTo ? '★' : '☆';
            s.classList.toggle('star--active', v <= upTo);
        });
    },

    setRating(value) {
        this.currentRating = value;
        document.getElementById('ratingValue').value = value;
        this.renderStars(value);
    },

    // ── Form Submission ─────────────────────────────────────────────────
    initFormSubmit() {
        const form = document.getElementById('giftForm');
        form.addEventListener('submit', e => this.handleSubmit(e));
    },

    handleSubmit(e) {
        e.preventDefault();

        const cityName = document.getElementById('cityName').value;
        const warehouseName = document.getElementById('warehouseName').value;
        const rating = document.getElementById('ratingValue').value;

        let valid = true;

        // Validate city
        if (!cityName) {
            this.shakeField('citySearch', 'Обери місто');
            valid = false;
        }

        // Validate warehouse
        if (!warehouseName) {
            this.shakeField('warehouseSelect', 'Обери відділення');
            valid = false;
        }

        // Validate rating
        if (!rating || rating === '0') {
            this.shakeField('starRating', 'Постав оцінку');
            valid = false;
        }

        if (!valid) return;

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Відправляю...';

        fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityName, warehouseName, rating }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Помилка сервера');
                window.location.href = '/thankyou';
            })
            .catch(() => {
                this.showError('Щось пішло не так 😢 Спробуй ще раз.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Відправити 💌';
            });
    },

    // ── UI Helpers ──────────────────────────────────────────────────────
    shakeField(id, message) {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 600);

        // Tooltip
        this.showTooltip(el, message);
    },

    showTooltip(anchor, text) {
        // Remove any existing tooltip
        const existing = anchor.parentNode.querySelector('.field-tooltip');
        if (existing) existing.remove();

        const tip = document.createElement('div');
        tip.className = 'field-tooltip';
        tip.textContent = text;

        anchor.parentNode.style.position = 'relative';
        anchor.parentNode.appendChild(tip);

        setTimeout(() => tip.remove(), 2500);
    },

    showError(msg) {
        let toast = document.getElementById('errorToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'errorToast';
            toast.className = 'error-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 4000);
    },
};

// ── Kick off ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => GiftPage.init());
