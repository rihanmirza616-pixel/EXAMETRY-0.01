"""
EXAMETRY 0.01 — Optional Python Proxy Server
For NTA scraping and Research Mode
Run: python server.py
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

@app.route('/api/scrape', methods=['GET'])
def scrape():
    """Scrape NTA or other exam-related updates."""
    source = request.args.get('source', 'nta')

    urls = {
        'nta': 'https://nta.ac.in/',
        'jeemain': 'https://jeemain.nta.ac.in/',
        'neet': 'https://neet.nta.nic.in/',
        'cuet': 'https://cuet.nta.nic.in/'
    }

    url = urls.get(source, urls['nta'])

    try:
        resp = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; Exametry/0.01)'
        })
        soup = BeautifulSoup(resp.content, 'html.parser')

        # Extract notices/updates
        results = []
        for item in soup.find_all(['a', 'li', 'div'], class_=lambda c: c and any(
            k in (c if isinstance(c, str) else ' '.join(c))
            for k in ['notice', 'update', 'news', 'announcement']
        ))[:10]:
            text = item.get_text(strip=True)
            link = item.find('a')
            if text and len(text) > 10:
                results.append({
                    'title': text[:200],
                    'link': link['href'] if link and link.get('href') else url,
                    'source': source.upper()
                })

        return jsonify({'success': True, 'results': results, 'source': source})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': '0.01'})

if __name__ == '__main__':
    print('Exametry Proxy Server running on http://localhost:5000')
    app.run(debug=True, port=5000)
