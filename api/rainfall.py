from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import pandas as pd
import json
import os
import pickle
import calendar

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
# LOAD MODEL (PKL)
# =========================
def load_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(base_dir, 'models')

    models = {}

    for file in os.listdir(model_dir):
        if file.endswith(".pkl"):
            wilayah = file.replace(".pkl", "").capitalize()
            with open(os.path.join(model_dir, file), "rb") as f:
                models[wilayah] = pickle.load(f)

    return models


# =========================
# LOAD DATA CSV
# =========================
def load_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base_dir, "data", "Skripsi_PSO.csv")

    df = pd.read_csv(path)

    # FIX penting
    df['ds'] = pd.to_datetime(df['ds'])
    df['wilayah'] = df['wilayah'].str.strip().str.capitalize()

    data_dict = {}

    for wilayah in df['wilayah'].unique():
        data_dict[wilayah] = df[df['wilayah'] == wilayah]

    return data_dict


# =========================
# INIT
# =========================
MODELS = load_models()
DATA   = load_data()

print("✅ MODEL:", list(MODELS.keys()))
print("✅ DATA :", list(DATA.keys()))


# =========================
# CORE LOGIC
# =========================
def get_response(wilayah, tahun, bulan):
    wilayah = wilayah.capitalize()

    print(f"📥 Request: {wilayah} | {tahun}-{bulan}")

    if wilayah not in MODELS:
        raise Exception(f"Model '{wilayah}' tidak ditemukan")

    if wilayah not in DATA:
        raise Exception(f"Data '{wilayah}' tidak ditemukan")

    model = MODELS[wilayah]
    df    = DATA[wilayah]

    # =========================
    # HISTORIS (≤ 2025)
    # =========================
    if tahun <= 2025:

        df_hist = df[
            (df['wilayah'] == wilayah) &
            (df['ds'].dt.year == tahun) &
            (df['ds'].dt.month == bulan)
        ]

        print("📊 HIST:", len(df_hist))

        if df_hist.empty:
            raise Exception("Data historis tidak ditemukan")

        chart_res = [
            {
                "ds": row["ds"].strftime("%Y-%m-%d"),
                "wilayah": wilayah,
                "curah_hujan": float(row["curah_hujan"]),
                "tipe": "historis",
            }
            for _, row in df_hist.iterrows()
        ]

        avg_val = df_hist["curah_hujan"].mean()
        max_val = df_hist["curah_hujan"].max()
        is_prediksi = False

    # =========================
    # PREDIKSI (2026+)
    # =========================
    else:
        days = calendar.monthrange(tahun, bulan)[1]

        future = pd.date_range(
            start=f"{tahun}-{bulan:02d}-01",
            periods=days
        )

        forecast = model.predict(pd.DataFrame({"ds": future}))

        chart_res = [
            {
                "ds": row["ds"].strftime("%Y-%m-%d"),
                "wilayah": wilayah,
                "curah_hujan": float(row["yhat"]),
                "tipe": "prediksi",
            }
            for _, row in forecast.iterrows()
        ]

        avg_val = forecast["yhat"].mean()
        max_val = forecast["yhat"].max()
        is_prediksi = True

    # =========================
    # MAP
    # =========================
    map_res = []

    for w, coords in KOORDINAT.items():
        if w in MODELS:
            model_w = MODELS[w]

            days = calendar.monthrange(tahun, bulan)[1]

            future = pd.date_range(
                start=f"{tahun}-{bulan:02d}-01",
                periods=days
            )

            fc = model_w.predict(pd.DataFrame({"ds": future}))
            avg = float(fc["yhat"].mean())

            map_res.append({
                "wilayah": w,
                "curah_hujan": round(avg, 2),
                "lat": coords[0],
                "lng": coords[1],
                "is_selected": w == wilayah
            })

    kondisi = "Basah" if avg_val > 10 else "Normal" if avg_val > 5 else "Kering"

    return {
        "chart": chart_res,
        "map": map_res,
        "summary": {
            "avg": round(avg_val, 2),
            "max": round(max_val, 2),
            "narasi": f"Wilayah {wilayah} cenderung {kondisi}",
            "is_prediksi": is_prediksi,
        },
        "selected_coords": KOORDINAT.get(wilayah),
    }


# =========================
# API HANDLER
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
        tahun   = int(params.get('tahun',  ['2025'])[0])
        bulan   = int(params.get('bulan',  ['1'])[0])

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


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    from http.server import HTTPServer

    port = int(os.environ.get("PORT", 8000))
    server = HTTPServer(("0.0.0.0", port), handler)

    print(f"🚀 Server jalan di http://localhost:{port}")
    server.serve_forever()