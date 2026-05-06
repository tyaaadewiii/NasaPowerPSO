from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import pandas as pd
import json
import os

# =========================
# KOORDINAT
# =========================
KOORDINAT = {
    'Badung':     [-8.5833, 115.1833],
    'Bangli':     [-8.2500, 115.3500],
    'Buleleng':   [-8.2000, 114.9000],
    'Denpasar':   [-8.6500, 115.2167],
    'Gianyar':    [-8.4833, 115.3167],
    'Jembrana':   [-8.3000, 114.6667],
    'Karangasem': [-8.3500, 115.5333],
    'Klungkung':  [-8.5500, 115.4000],
    'Tabanan':    [-8.5333, 115.1167],
}

# =========================
# LOAD CSV
# =========================
def load_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, '../data/Skripsi_PSO.csv')
    df = pd.read_csv(csv_path)
    df['ds'] = pd.to_datetime(df['ds'], errors='coerce')

    df['wilayah'] = df['wilayah'].astype(str).str.strip()
    df['tipe'] = df['tipe'].astype(str).str.lower().str.strip()

    return df

# =========================
# LOGIC
# =========================
def get_response(wilayah, tahun, bulan):
    df = load_data()

    wilayah = wilayah.strip()

    mask = (df['ds'].dt.year == tahun) & (df['ds'].dt.month == bulan)
    df_period = df[mask]

    # FIX FILTER (case insensitive)
    chart_df = df_period[
        df_period['wilayah'].str.lower() == wilayah.lower()
    ].sort_values('ds')

    chart_res = []
    for _, row in chart_df.iterrows():
        chart_res.append({
            'ds': row['ds'].strftime('%Y-%m-%d'),
            'wilayah': row['wilayah'],
            'curah_hujan': max(0, float(row['curah_hujan'])),  
            'tipe': row['tipe'],
        })

    avg_val = max(0, float(chart_df['curah_hujan'].mean())) if not chart_df.empty else 0
    max_val = max(0, float(chart_df['curah_hujan'].max())) if not chart_df.empty else 0
    is_prediksi = (chart_df['tipe'].iloc[0] == 'prediksi') if not chart_df.empty else False

    kondisi = 'Basah' if avg_val > 10 else 'Normal' if avg_val > 5 else 'Kering'
    narasi = f'Wilayah {wilayah} pada periode ini cenderung {kondisi} dengan rata-rata harian {avg_val:.2f} mm.'

    # =========================
    # MAP
    # =========================
    map_stats = df_period.groupby('wilayah')['curah_hujan'].mean().reset_index()

    map_res = []
    for _, row in map_stats.iterrows():
        w = row['wilayah']
        if w in KOORDINAT:
            map_res.append({
                'wilayah': w,
                'curah_hujan': round(max(0, float(row['curah_hujan'])), 2),
                'lat': KOORDINAT[w][0],
                'lng': KOORDINAT[w][1],
                'is_selected': w.lower() == wilayah.lower(),
            })

    return {
        'chart': chart_res,
        'map': map_res,
        'summary': {
            'avg': round(avg_val, 2),
            'max': round(max_val, 2),
            'narasi': narasi,
            'is_prediksi': is_prediksi,
        },
        'selected_coords': KOORDINAT.get(wilayah, [-8.4095, 115.1889]),
    }

# =========================
# HANDLER VERCEL
# =========================
class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path != "/api/rainfall":
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
            return

        params = parse_qs(parsed.query)

        wilayah = params.get('wilayah', ['Badung'])[0]
        tahun   = int(params.get('tahun', ['2025'])[0])
        bulan   = int(params.get('bulan', ['1'])[0])

        try:
            result = get_response(wilayah, tahun, bulan)
            body = json.dumps(result).encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)

        except Exception as e:
            error = json.dumps({'error': str(e)}).encode('utf-8')

            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(error)

if __name__ == "__main__":
    from http.server import HTTPServer
    
    port = 8000
    server = HTTPServer(("0.0.0.0", port), handler)
    
    print(f"Server jalan di http://localhost:{port}")
    server.serve_forever()