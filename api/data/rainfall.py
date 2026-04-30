from urllib.parse import urlparse, parse_qs
import pandas as pd
import json
import os

# Koordinat pusat Kabupaten di Bali
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

def load_data():
    # File CSV diletakkan di folder /api/data/
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'data', 'Skripsi_PSO.csv')
    df = pd.read_csv(csv_path)
    df['ds'] = pd.to_datetime(df['ds'])
    return df

def get_response(wilayah, tahun, bulan):
    df = load_data()

    mask = (df['ds'].dt.year == tahun) & (df['ds'].dt.month == bulan)
    df_period = df[mask]

    chart_df = df_period[df_period['wilayah'] == wilayah].sort_values('ds')

    # Konversi datetime ke string agar bisa di-JSON-kan
    chart_res = []
    for _, row in chart_df.iterrows():
        chart_res.append({
            'ds': row['ds'].strftime('%Y-%m-%d'),
            'wilayah': row['wilayah'],
            'curah_hujan': float(row['curah_hujan']),
            'tipe': row['tipe'],
        })

    avg_val = float(chart_df['curah_hujan'].mean()) if not chart_df.empty else 0
    max_val = float(chart_df['curah_hujan'].max()) if not chart_df.empty else 0
    is_prediksi = (chart_df['tipe'].iloc[0] == 'prediksi') if not chart_df.empty else False

    kondisi = 'Basah' if avg_val > 10 else 'Normal' if avg_val > 5 else 'Kering'
    narasi = f'Wilayah {wilayah} pada periode ini cenderung {kondisi} dengan rata-rata harian {avg_val:.2f} mm.'

    map_stats = df_period.groupby('wilayah').agg({'curah_hujan': 'mean'}).reset_index()
    map_res = []
    for _, row in map_stats.iterrows():
        w = row['wilayah']
        if w in KOORDINAT:
            map_res.append({
                'wilayah': w,
                'curah_hujan': round(float(row['curah_hujan']), 2),
                'lat': KOORDINAT[w][0],
                'lng': KOORDINAT[w][1],
                'is_selected': w == wilayah,
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


def handler(request):
    from urllib.parse import urlparse, parse_qs

    parsed = urlparse(request.url)
    params = parse_qs(parsed.query)

    wilayah = params.get('wilayah', ['Badung'])[0]
    tahun   = int(params.get('tahun',  ['2025'])[0])
    bulan   = int(params.get('bulan',  ['1'])[0])

    try:
        result = get_response(wilayah, tahun, bulan)
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(result)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }