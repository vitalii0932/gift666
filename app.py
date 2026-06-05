"""
🎂 Birthday Gift App for Katia
Flask server with routes, email sending, and Nova Poshta API proxy
"""

import os
from datetime import datetime, timezone, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_mail import Mail, Message
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'katia-birthday-2026-secret')

# ---- Mail Configuration ----
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME', '')

mail = Mail(app)

# ---- Nova Poshta Config ----
NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/'
NP_API_KEY = os.getenv('NOVA_POSHTA_API_KEY', '')

# ---- Kyiv Timezone (UTC+2 as specified) ----
KYIV_TZ = timezone(timedelta(hours=3))
GATE_DATE = datetime(2026, 6, 6, 0, 1, tzinfo=KYIV_TZ)


def is_too_early():
    """Check if current time is before the gate date."""
    now = datetime.now(KYIV_TZ)
    return now < GATE_DATE


# ---- Routes ----

@app.route('/')
def index():
    """Main page or 'too early' page depending on date."""
    if is_too_early():
        return render_template('early.html')
    return render_template('index.html')


@app.route('/gift')
def gift():
    """Gift hints page with Nova Poshta form."""
    if is_too_early():
        return redirect(url_for('index'))
    return render_template('gift.html')


@app.route('/thankyou')
def thankyou():
    """Thank you / final page."""
    return render_template('thankyou.html')


@app.route('/submit', methods=['POST'])
def submit():
    """Handle gift form submission — send email with details."""
    try:
        data = request.get_json()
        city_name = data.get('cityName', 'Не вказано')
        warehouse_name = data.get('warehouseName', 'Не вказано')
        rating = data.get('rating', 'Не вказано')
        feedback = data.get('feedback', '')

        # Compose email
        subject = '🎁 Катя обрала відділення для подарунка!'
        body = f"""
Привіт! Катя заповнила форму на сайті-подарунку 🎂

📍 Місто: {city_name}
📮 Відділення: {warehouse_name}
⭐ Оцінка: {rating}/5
💬 Відгук: {feedback}

---
Відправлено автоматично з Birthday Gift App
        """.strip()

        # Try to send email
        try:
            msg = Message(
                subject=subject,
                recipients=['vitalikhall@gmail.com'],
                body=body
            )
            mail.send(msg)
            app.logger.info('Email sent successfully!')
        except Exception as e:
            # If email fails, log it but don't fail the request
            app.logger.error(f'Email sending failed: {e}')
            # Save to a local file as backup
            backup_path = os.path.join(os.path.dirname(__file__), 'submissions.txt')
            with open(backup_path, 'a', encoding='utf-8') as f:
                f.write(f'\n--- {datetime.now(KYIV_TZ).isoformat()} ---\n')
                f.write(f'Місто: {city_name}\n')
                f.write(f'Відділення: {warehouse_name}\n')
                f.write(f'Оцінка: {rating}/5\n')
                f.write(f'Відгук: {feedback}\n')

        return jsonify({'success': True})

    except Exception as e:
        app.logger.error(f'Submit error: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500


# ---- Nova Poshta API Proxy ----

@app.route('/api/cities', methods=['POST'])
def api_cities():
    """Proxy for Nova Poshta getCities API."""
    try:
        data = request.get_json()
        search = data.get('search', '')

        payload = {
            'apiKey': NP_API_KEY,
            'modelName': 'Address',
            'calledMethod': 'getCities',
            'methodProperties': {
                'FindByString': search,
                'Limit': 20
            }
        }

        response = requests.post(NP_API_URL, json=payload, timeout=10)
        result = response.json()

        if result.get('success'):
            cities = [{
                'Ref': city['Ref'],
                'Description': city['Description'],
                'AreaDescription': city.get('AreaDescription', '')
            } for city in result.get('data', [])]
            return jsonify({'data': cities})
        else:
            return jsonify({'data': [], 'errors': result.get('errors', [])})

    except Exception as e:
        return jsonify({'data': [], 'error': str(e)}), 500


@app.route('/api/warehouses', methods=['POST'])
def api_warehouses():
    """Proxy for Nova Poshta getWarehouses API."""
    try:
        data = request.get_json()
        city_ref = data.get('cityRef', '')

        payload = {
            'apiKey': NP_API_KEY,
            'modelName': 'Address',
            'calledMethod': 'getWarehouses',
            'methodProperties': {
                'CityRef': city_ref,
                'Limit': 500
            }
        }

        response = requests.post(NP_API_URL, json=payload, timeout=15)
        result = response.json()

        if result.get('success'):
            warehouses = [{
                'Ref': wh['Ref'],
                'Description': wh['Description'],
                'Longitude': wh.get('Longitude', ''),
                'Latitude': wh.get('Latitude', ''),
                'Number': wh.get('Number', ''),
                'ShortAddress': wh.get('ShortAddress', '')
            } for wh in result.get('data', [])]
            return jsonify({'data': warehouses})
        else:
            return jsonify({'data': [], 'errors': result.get('errors', [])})

    except Exception as e:
        return jsonify({'data': [], 'error': str(e)}), 500


# ---- Run ----

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
