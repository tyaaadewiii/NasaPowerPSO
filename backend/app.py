from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
# Membuka akses CORS agar React bisa mengambil data
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Mencari lokasi file CSV secara otomatis
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, 'Skripsi_PSO.csv')

# Koordinat pusat Kabupaten di Bali
KOORDINAT = {
    'Badung': [-8.5833, 115.1833], 'Bangli': [-8.2500, 115.3500],
    'Buleleng': [-8.2000, 114.9000], 'Denpasar': [-8.6500, 115.2167],
    'Gianyar': [-8.4833, 115.3167], 'Jembrana': [-8.3000, 114.6667],
    'Karangasem': [-8.3500, 115.5333], 'Klungkung': [-8.5500, 115.4000],
    'Tabanan': [-8.5333, 115.1167]
}

def load_data():
    if not os.path.exists(CSV_PATH):
        return None
    df = pd.read_csv(CSV_PATH)
    df['ds'] = pd.to_datetime(df['ds'])
    return df

@app.route('/api/rainfall', methods=['GET'])
def get_rainfall():
    wilayah = request.args.get('wilayah', 'Badung')
    tahun = int(request.args.get('tahun', 2025))
    bulan = int(request.args.get('bulan', 1))
    
    df = load_data()
    if df is None:
        return jsonify({"error": "File CSV tidak ditemukan"}), 500

    # Filter berdasarkan Tahun dan Bulan
    mask = (df['ds'].dt.year == tahun) & (df['ds'].dt.month == bulan)
    df_period = df[mask]

    # 1. Data untuk Grafik (Harian wilayah terpilih)
    chart_df = df_period[df_period['wilayah'] == wilayah].sort_values('ds')
    chart_res = chart_df.to_dict(orient='records')
    
    # 2. Narasi & Ringkasan (Summary)
    avg_val = chart_df['curah_hujan'].mean() if not chart_df.empty else 0
    max_val = chart_df['curah_hujan'].max() if not chart_df.empty else 0
    is_prediksi = chart_df['tipe'].iloc[0] == 'prediksi' if not chart_df.empty else False
    
    kondisi = "Basah" if avg_val > 10 else "Normal" if avg_val > 5 else "Kering"
    narasi = f"Wilayah {wilayah} pada periode ini cenderung {kondisi} dengan rata-rata harian {avg_val:.2f} mm."

    # 3. Data untuk Peta (Rerata per kabupaten di bulan tersebut)
    map_stats = df_period.groupby('wilayah').agg({'curah_hujan': 'mean'}).reset_index()
    map_res = [] 
    for _, row in map_stats.iterrows():
        w = row['wilayah']

        if w in KOORDINAT:
            map_res.append({
            "wilayah": w,
            "curah_hujan": round(float(row['curah_hujan']), 2),
            "lat": KOORDINAT[w][0],
            "lng": KOORDINAT[w][1],
            "is_selected": w == wilayah
        })

    return jsonify({
        "chart": chart_res,
        "map": map_res,
        "summary": {
            "avg": round(avg_val, 2),
            "max": round(max_val, 2),
            "narasi": narasi,
            "is_prediksi": is_prediksi
        },
        "selected_coords": KOORDINAT.get(wilayah, [-8.4095, 115.1889])
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)