"use client";

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Activity, TrendingUp, AlertTriangle, Loader2, Zap, Globe, Clock, ExternalLink, ImagePlus, ChevronDown, ChevronUp } from 'lucide-react';
import './globals.css';

interface MarketData {
  price?: number;
  changePercent?: number;
  high?: number;
  low?: number;
}

export default function Home() {
  const [mode, setMode] = useState('current');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({
    pre: { analysis: null, marketData: null, news: null, error: null },
    current: { analysis: null, marketData: null, news: null, error: null },
    post: { analysis: null, marketData: null, news: null, error: null }
  });

  const analysis = results[mode]?.analysis || null;
  const marketData = results[mode]?.marketData || null;
  const news = results[mode]?.news || null;
  const error = results[mode]?.error || null;
  const [showManual, setShowManual] = useState(true);

  const [giftNifty, setGiftNifty] = useState({
    price: '', changeSign: '+', change: '', percentSign: '+', percent: '', o: '', h: '', l: '', c: ''
  });

  const [fiiDii, setFiiDii] = useState(
    Array(5).fill({ date: '', fiiStocks: '', fiiOptions: '', diiStocks: '', diiOptions: '' })
  );

  const [optionChainImage, setOptionChainImage] = useState<string | null>(null);
  const [niftyChartImage, setNiftyChartImage] = useState<string | null>(null);
  const [bankNiftyChartImage, setBankNiftyChartImage] = useState<string | null>(null);
  const [optionalImage, setOptionalImage] = useState<string | null>(null);

  const handleFiiChange = (index: number, field: string, value: string) => {
    const newData = [...fiiDii];
    newData[index] = { ...newData[index], [field]: value };
    setFiiDii(newData);
  };

  useEffect(() => {
    if (mode === 'pre' || mode === 'post') {
      const dates: string[] = [];
      let date = new Date();
      
      if (mode === 'pre') {
        date.setDate(date.getDate() - 1);
      }
      
      while (dates.length < 5) {
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
          dates.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
        }
        date.setDate(date.getDate() - 1);
      }
      dates.reverse();
      
      setFiiDii(prev => prev.map((row, i) => ({
        ...row,
        date: dates[i] || row.date
      })));
    }
  }, [mode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'RAVIO_EXTENSION_IMAGES') {
        const { images } = event.data;
        if (images.nifty) setNiftyChartImage(images.nifty);
        if (images.bankNifty) setBankNiftyChartImage(images.bankNifty);
        if (images.optionChain) setOptionChainImage(images.optionChain);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeMarket = async () => {
    setLoading(true);
    setResults(prev => ({ ...prev, [mode]: { ...prev[mode], error: null } }));
    try {
      const payload = {
        mode,
        manualData: {
          giftNifty: (mode === 'pre' || mode === 'post') ? giftNifty : null,
          fiiDii: (mode === 'pre' || mode === 'post') ? fiiDii : null,
          optionChainImage: mode === 'current' ? optionChainImage : null,
          niftyChartImage: mode === 'current' ? niftyChartImage : null,
          bankNiftyChartImage: mode === 'current' ? bankNiftyChartImage : null,
          optionalImage: mode === 'current' ? optionalImage : null
        }
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch analysis');
      }

      setResults(prev => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          marketData: json.data,
          analysis: json.analysis,
          news: json.news
        }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        [mode]: { ...prev[mode], error: err.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const renderTickerCard = (title: string, data?: MarketData) => {
    if (!data || !data.price) return null;
    const isPositive = (data.changePercent || 0) >= 0;

    return (
      <div key={title} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
          {title === 'USD/INR' ? '₹' : title === 'US Crude Oil' ? '$' : ''}{data.price.toFixed(2)}
        </div>
        {data.changePercent !== undefined && (
          <div className={isPositive ? 'positive-text' : 'negative-text'} style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isPositive ? '▲' : '▼'} {Math.abs(data.changePercent).toFixed(2)}%
          </div>
        )}
      </div>
    );
  };

  const renderUploadBox = (id: string, label: string, desc: string, imageState: string | null, setter: React.Dispatch<React.SetStateAction<string | null>>) => (
    <div style={{ border: '2px dashed var(--glass-border)', padding: '20px', textAlign: 'center', borderRadius: '12px', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', flex: '1', minWidth: '250px' }}>
      <input type="file" id={id} accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setter)} />
      <label htmlFor={id} style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
        <div style={{ background: 'var(--accent-blue)', padding: '12px', borderRadius: '50%' }}>
          <ImagePlus size={24} color="white" />
        </div>
        <span style={{ fontWeight: 500 }}>{imageState ? 'Image Uploaded!' : label}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{desc}</span>
      </label>
      {imageState && (
        <div style={{ marginTop: '16px' }}>
          <img src={imageState} alt={label} style={{ maxHeight: '100px', borderRadius: '8px', border: '1px solid var(--glass-border)', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <div className="bg-animation">
        <div className="grid-layer"></div>
        <div className="glow-node n1"></div>
        <div className="glow-node n2"></div>
        <div className="glow-node n3"></div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', display: 'flex', height: '100vh', padding: '24px' }}>
        
        <aside style={{ width: '260px', height: '100%', borderRadius: '24px', padding: '24px 16px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', marginRight: '32px' }}>
          
          <div style={{ marginBottom: '32px', padding: '0 8px' }}>
            <img src="/logo.png" alt="Ravio Edge Logo" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', padding: '0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Modes
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <button
              onClick={() => setMode('pre')}
              style={{ 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: mode === 'pre' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent', 
                background: mode === 'pre' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', 
                color: mode === 'pre' ? '#fff' : 'var(--text-muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                fontSize: '0.95rem', 
                fontWeight: mode === 'pre' ? 600 : 500,
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <Clock size={18} color={mode === 'pre' ? '#fff' : '#60a5fa'} /> Pre-Market Mode
            </button>
            <button
              onClick={() => setMode('current')}
              style={{ 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: mode === 'current' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent', 
                background: mode === 'current' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', 
                color: mode === 'current' ? '#fff' : 'var(--text-muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                fontSize: '0.95rem', 
                fontWeight: mode === 'current' ? 600 : 500,
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <Zap size={18} color={mode === 'current' ? '#fff' : '#a855f7'} /> Live Market Mode
            </button>
            <button
              onClick={() => setMode('post')}
              style={{ 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: mode === 'post' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent', 
                background: mode === 'post' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', 
                color: mode === 'post' ? '#fff' : 'var(--text-muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                fontSize: '0.95rem', 
                fontWeight: mode === 'post' ? 600 : 500,
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <Globe size={18} color={mode === 'post' ? '#fff' : '#10b981'} /> Post-Market Mode
            </button>
          </nav>

          <div style={{ marginTop: 'auto', padding: '16px 8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Developed By <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Ravi</span>
            </p>
          </div>
        </aside>

        <main style={{ flex: 1, padding: '20px 0', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            
            <header style={{ marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Execution Dashboard</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '4px' }}>Mode: <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{mode.toUpperCase()}</span></p>
              </div>
            </header>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <a href="https://www.moneycontrol.com/live-index/gift-nifty?symbol=in;gsx" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
              <ExternalLink size={16} /> Live GIFT Nifty
            </a>
            <a href="https://web.stockedge.com/fii-activity" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
              <ExternalLink size={16} /> FII/DII Activity (StockEdge)
            </a>
            <a href="https://pulse.zerodha.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
              <ExternalLink size={16} /> Pulse News
            </a>
          </div>

          <div className="glass-panel" style={{ marginBottom: '40px', padding: '0', overflow: 'hidden' }}>
            <button
              onClick={() => setShowManual(!showManual)}
              style={{ width: '100%', padding: '20px', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600 }}
            >
              <span>Advanced Overrides & Vision Integrations</span>
              {showManual ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showManual && (
              <div style={{ padding: '24px' }}>

                {mode === 'current' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Upload Live Data for Multimodal Analysis (Optional)</h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {renderUploadBox('optionChainUpload', 'Options Chain', 'Auto-extract Strikes, OI, IV, PCR', optionChainImage, setOptionChainImage)}
                      {renderUploadBox('niftyChartUpload', 'Nifty 50 Chart', '5m timeframe, VWAP, EMAs, SMA 88', niftyChartImage, setNiftyChartImage)}
                      {renderUploadBox('bankNiftyChartUpload', 'Bank Nifty Chart', '5m timeframe, VWAP, EMAs, SMA 88', bankNiftyChartImage, setBankNiftyChartImage)}
                      {renderUploadBox('optionalImageUpload', 'Optional Screenshot', 'Additional context for AI analysis', optionalImage, setOptionalImage)}
                    </div>
                  </div>
                )}

                {(mode === 'pre' || mode === 'post') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    <div>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '16px' }}>GIFT Nifty Live Data</h3>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="number" placeholder="Price" className="manual-input" value={giftNifty.price} onChange={e => setGiftNifty({ ...giftNifty, price: e.target.value })} />

                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                          <select className="manual-select" value={giftNifty.changeSign} onChange={e => setGiftNifty({ ...giftNifty, changeSign: e.target.value })}>
                            <option value="+">+</option><option value="-">-</option>
                          </select>
                          <input type="number" placeholder="Change" className="manual-input-flat" value={giftNifty.change} onChange={e => setGiftNifty({ ...giftNifty, change: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                          <select className="manual-select" value={giftNifty.percentSign} onChange={e => setGiftNifty({ ...giftNifty, percentSign: e.target.value })}>
                            <option value="+">+</option><option value="-">-</option>
                          </select>
                          <input type="number" placeholder="%" className="manual-input-flat" value={giftNifty.percent} onChange={e => setGiftNifty({ ...giftNifty, percent: e.target.value })} />
                        </div>

                        <div style={{ borderLeft: '1px solid var(--glass-border)', height: '30px', margin: '0 8px' }}></div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>30m Candle:</span>
                        <input type="number" placeholder="O" className="manual-input-sm" value={giftNifty.o} onChange={e => setGiftNifty({ ...giftNifty, o: e.target.value })} />
                        <input type="number" placeholder="H" className="manual-input-sm" value={giftNifty.h} onChange={e => setGiftNifty({ ...giftNifty, h: e.target.value })} />
                        <input type="number" placeholder="L" className="manual-input-sm" value={giftNifty.l} onChange={e => setGiftNifty({ ...giftNifty, l: e.target.value })} />
                        <input type="number" placeholder="C" className="manual-input-sm" value={giftNifty.c} onChange={e => setGiftNifty({ ...giftNifty, c: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '16px' }}>FII/DII Activity (Last 5 Days - Net Values in Cr)</h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>Date</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>FII CASH(₹ Cr.)</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>FII FUTURES(₹ Cr.)</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>DII CASH(₹ Cr.)</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>FII OPTIONS(₹ Cr.)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fiiDii.map((row, i) => (
                              <tr key={i}>
                                <td style={{ padding: '4px' }}><input type="text" placeholder="e.g. 21 Apr" className="manual-table-input" value={row.date} onChange={e => handleFiiChange(i, 'date', e.target.value)} /></td>
                                <td style={{ padding: '4px' }}><input type="number" className="manual-table-input" value={row.fiiStocks} onChange={e => handleFiiChange(i, 'fiiStocks', e.target.value)} /></td>
                                <td style={{ padding: '4px' }}><input type="number" className="manual-table-input" value={row.fiiOptions} onChange={e => handleFiiChange(i, 'fiiOptions', e.target.value)} /></td>
                                <td style={{ padding: '4px' }}><input type="number" className="manual-table-input" value={row.diiStocks} onChange={e => handleFiiChange(i, 'diiStocks', e.target.value)} /></td>
                                <td style={{ padding: '4px' }}><input type="number" className="manual-table-input" value={row.diiOptions} onChange={e => handleFiiChange(i, 'diiOptions', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ maxWidth: '400px', margin: '0 auto 40px' }}>
            <button
              id="run-analysis-btn"
              onClick={analyzeMarket}
              disabled={loading}
              className={`button-primary ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" size={24} />
                  I am Generating {mode.toUpperCase()} Analysis...
                </>
              ) : (
                <>
                  <Zap size={24} />
                  Run {mode.toUpperCase()} Analysis
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="glass-panel" style={{ border: '1px solid var(--negative)', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle color="var(--negative)" size={24} />
              <p style={{ color: '#f8fafc' }}>{error}</p>
            </div>
          )}

          {(marketData || analysis) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>

              {marketData && (
                <div>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} color="var(--accent-blue)" />
                    Data Snapshot
                  </h2>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Indian Markets</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {renderTickerCard('Nifty 50', marketData.nifty)}
                      {renderTickerCard('Bank Nifty', marketData.bankNifty)}
                      {renderTickerCard('India VIX', marketData.indiaVix)}
                      {renderTickerCard('Reliance', marketData.reliance)}
                      {renderTickerCard('HDFC Bank', marketData.hdfc)}
                      {renderTickerCard('ICICI Bank', marketData.icici)}
                      {renderTickerCard('SBI', marketData.sbi)}
                      {renderTickerCard('TCS', marketData.tcs)}
                      {renderTickerCard('Infosys', marketData.infosys)}
                    </div>
                  </div>

                  {(mode === 'pre' || mode === 'post') && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Global & ADRs</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {renderTickerCard('Dow Jones', marketData.dji)}
                        {renderTickerCard('Nasdaq', marketData.ixic)}
                        {renderTickerCard('S&P 500', marketData.spx)}
                        {renderTickerCard('Nikkei 225', marketData.nikkei)}
                        {renderTickerCard('Hang Seng', marketData.hsi)}
                        {renderTickerCard('KOSPI', marketData.kospi)}
                        {renderTickerCard('INFY (ADR)', marketData.infyAdr)}
                        {renderTickerCard('HDB (ADR)', marketData.hdfcAdr)}
                        {renderTickerCard('IBN (ADR)', marketData.iciciAdr)}
                        {renderTickerCard('WIT (ADR)', marketData.wiproAdr)}
                        {renderTickerCard('USD/INR', marketData.usdInr)}
                        {renderTickerCard('US Crude Oil', marketData.usOil)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {analysis && (
                <div className="glass-panel markdown-content" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', padding: '8px', borderRadius: '8px' }}>
                      <Activity size={24} color="white" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>Ravio Edge System Output</h2>
                  </div>
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
