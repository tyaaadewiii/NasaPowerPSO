import React from 'react';
import { CloudRain, ExternalLink } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full bg-slate-900 text-slate-300 pt-16 pb-10 px-10 border-t border-slate-800 mt-auto">
            <div className="max-w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">

                {/* Kolom 1: Brand & Deskripsi */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                            <CloudRain size={28} />
                        </div>
                        <span className="text-3xl font-black tracking-tighter uppercase italic">
                            BaliRain <span className="text-emerald-400">Prophet</span>
                        </span>
                    </div>
                    <p className="text-base leading-relaxed font-semibold opacity-90 max-w-xl text-slate-400">
                        Platform analisis cerdas yang mengintegrasikan data NASA Power dengan Machine Learning (FB Prophet) untuk memetakan dan memprediksi pola curah hujan di Pulau Bali.
                    </p>
                </div>

                {/* Kolom 2: Tech Stack (Font Diperjelas) */}
                <div className="flex flex-col md:items-center space-y-4">
                    <div className="w-full md:w-64">
                        <h4 className="text-white text-sm font-black uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-3 mb-6">Intelligence Engine</h4>
                        <ul className="text-sm space-y-4 font-bold uppercase tracking-wider list-none p-0 text-slate-400">
                            <li className="flex items-center gap-3 hover:text-emerald-400 transition-colors cursor-default">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                FB Prophet Forecasting
                            </li>
                            <li className="flex items-center gap-3 hover:text-emerald-400 transition-colors cursor-default">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                Python Flask Backend
                            </li>
                            <li className="flex items-center gap-3 hover:text-emerald-400 transition-colors cursor-default">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                React Leaflet Mapping
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Kolom 3: External Resources (Link NASA & BMKG) */}
                <div className="flex flex-col md:items-end space-y-4">
                    <div className="w-full md:w-64">
                        <h4 className="text-white text-sm font-black uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-3 mb-6">Sumber Data Resmi</h4>
                        <div className="space-y-3">
                            <a
                                href="https://power.larc.nasa.gov/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 transition-all group"
                            >
                                <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-emerald-400">NASA Power Data</span>
                                <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400" />
                            </a>
                            <a
                                href="https://www.bmkg.go.id/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 transition-all group"
                            >
                                <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-emerald-400">BMKG Indonesia</span>
                                <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800 pt-10 flex flex-col items-center justify-center gap-8">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 text-center">
                    &copy; 2026 BaliRain Intelligent Prediction System.
                    <span className="hidden md:inline text-slate-700 mx-2">|</span>
                    All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;