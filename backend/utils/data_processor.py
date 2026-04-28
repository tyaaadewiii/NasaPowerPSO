import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'data', 'Skripsi_PSO.csv')

def load_df():
    df = pd.read_csv(CSV_PATH)
    df['ds'] = pd.to_datetime(df['ds'])
    return df

def get_chart_data(wilayah, tahun, bulan):
    df = load_df()
    mask = (df['wilayah'] == wilayah) & \
           (df['ds'].dt.year == int(tahun)) & \
           (df['ds'].dt.month == int(bulan))
    
    filtered = df[mask].sort_values('ds')
    # Format data untuk Recharts
    result = []
    for _, row in filtered.iterrows():
        result.append({
            "ds": row['ds'].strftime('%Y-%m-%d'),
            "histori": row['curah_hujan'] if row['tipe'] == 'histori' else None,
            "prediksi": row['curah_hujan'] if row['tipe'] == 'prediksi' else None,
            "wilayah": row['wilayah']
        })
    return result

def get_map_data(tanggal):
    df = load_df()
    # Filter data pada tanggal spesifik untuk semua wilayah
    target_date = pd.to_datetime(tanggal)
    df_date = df[df['ds'] == target_date]
    
    return df_date[['wilayah', 'curah_hujan', 'tipe']].to_dict(orient='records')