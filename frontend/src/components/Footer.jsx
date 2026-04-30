import React from 'react';
import { CloudRain, ExternalLink } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full bg-slate-900 text-slate-300 pt-16 pb-10 px-6 sm:px-10 border-t border-slate-800 mt-auto">
            <div className="max-w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-12 lg:mb-16">

                {/* Kolom 1: Brand & Deskripsi */}
                <div className="space-y-5 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20 shrink-0">
                            <CloudRain size={28} />
                        </div>
                        <span className="text-2xl sm:text-3xl font-black tracking-tighter uppercase italic">
                            BaliRain <span className="text-emerald-400">Prophet</span>
                        </span>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed font-semibold opacity-90 max-w-xl text-slate-400">
                        Platform analisis cerdas yang mengintegrasikan data NASA Power dengan Machine Learning (FB Prophet) untuk memetakan dan memprediksi pola curah hujan di Pulau Bali.
                    </p>
                </div>

                {/* Kolom 2: Tech Stack */}
                <div className="flex flex-col space-y-4">
                    <div className="w-full">
                        <h4 className="text-white text-sm font-black uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-3 mb-5 sm:mb-6">
                            Intelligence Engine
                        </h4>
                        <ul className="text-sm space-y-3 sm:space-y-4 font-bold uppercase tracking-wider list-none p-0 text-slate-400">
                            {['FB Prophet Forecasting', 'Python Flask Backend', 'React Leaflet Mapping'].map(item => (
                                <li key={item} className="flex items-center gap-3 hover:text-emerald-400 transition-colors cursor-default">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Kolom 3: Sumber Data */}
                <div className="flex flex-col space-y-4 sm:col-span-2 lg:col-span-1">
                    <div className="w-full">
                        <h4 className="text-white text-sm font-black uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-3 mb-5 sm:mb-6">
                            Sumber Data Resmi
                        </h4>
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                            {[
                                { label: 'NASA Power Data', href: 'https://power.larc.nasa.gov/' },
                                { label: 'BMKG Indonesia',  href: 'https://www.bmkg.go.id/' },
                            ].map(({ label, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 hover:border-slate-500 transition-all group flex-1 lg:flex-none"
                                >
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-emerald-400">
                                        {label}
                                    </span>
                                    <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400 shrink-0 ml-3" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800 pt-8 sm:pt-10 flex flex-col items-center justify-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 text-center leading-relaxed">
                    &copy; 2026 BaliRain Intelligent Prediction System.
                    <span className="hidden sm:inline text-slate-700 mx-2">|</span>
                    <span className="block sm:inline">All Rights Reserved.</span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;