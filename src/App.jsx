import { useState } from 'react';
import './index.css';

// All API calls go through the backend proxy - API key is NEVER in the frontend
const API = '/api';

const DEFAULTS = {
  bride: { dob: '1992-08-22', time: '14:15', lat: '19.0760', lon: '72.8777', city: 'Mumbai' },
  groom: { dob: '1990-05-15', time: '06:30', lat: '28.6139', lon: '77.2090', city: 'Delhi' },
};

function scoreColor(score) {
  if (score >= 70) return '#0fa87e';
  if (score >= 50) return '#e8a317';
  if (score >= 30) return '#e85d00';
  return '#e5384b';
}

function ScoreRing({ score }) {
  const r = 58, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="score-ring">
      <svg viewBox="0 0 140 140">
        <circle className="bg" cx="70" cy="70" r={r} />
        <circle className="fill" cx="70" cy="70" r={r}
          stroke={scoreColor(score)}
          strokeDasharray={c}
          strokeDashoffset={offset} />
      </svg>
      <div className="score-value">
        <div className="num" style={{ color: scoreColor(score) }}>{score}</div>
        <div className="label">out of 100</div>
      </div>
    </div>
  );
}

function PersonForm({ label, emoji, data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div className="person-card">
      <h2><span>{emoji}</span> {label}</h2>
      <div className="field">
        <label>Date of Birth</label>
        <input type="date" value={data.dob} onChange={e => set('dob', e.target.value)} />
      </div>
      <div className="field">
        <label>Time of Birth</label>
        <input type="time" value={data.time} onChange={e => set('time', e.target.value)} />
      </div>
      <div className="field">
        <label>Birth City</label>
        <input type="text" value={data.city} onChange={e => set('city', e.target.value)} placeholder="City name (for reference)" />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Latitude</label>
          <input type="number" step="any" value={data.lat} onChange={e => set('lat', e.target.value)} />
        </div>
        <div className="field">
          <label>Longitude</label>
          <input type="number" step="any" value={data.lon} onChange={e => set('lon', e.target.value)} />
        </div>
      </div>
      <div className="field-hint">Use Google Maps to find lat/lon for any city</div>
    </div>
  );
}

function KootaGrid({ breakdown }) {
  if (!breakdown) return null;
  const maxScores = { varna: 1, vashya: 2, tara: 3, yoni: 4, graha_maitri: 5, gana: 6, bhakoot: 7, nadi: 8 };
  return (
    <div className="koota-grid">
      {Object.entries(breakdown).map(([k, v]) => {
        const score = typeof v === 'object' ? (v.score ?? v.value ?? 0) : v;
        const max = typeof v === 'object' ? (v.max ?? maxScores[k] ?? '?') : (maxScores[k] || '?');
        return (
          <div className="koota-item" key={k}>
            <div className="koota-name">{k.replace(/_/g, ' ')}</div>
            <div className="koota-val">{score} / {max}</div>
          </div>
        );
      })}
    </div>
  );
}

function DomainScores({ domains }) {
  if (!domains) return null;
  return (
    <div className="domain-grid">
      {Object.entries(domains).map(([k, v]) => {
        const val = typeof v === 'object' ? (v.score ?? v.value ?? 0) : v;
        return (
          <div className="domain-item" key={k}>
            <div className="domain-label">{k}</div>
            <div className="domain-bar">
              <div className="domain-fill" style={{ width: `${val}%`, background: scoreColor(val) }} />
            </div>
            <div className="domain-val">{val}</div>
          </div>
        );
      })}
    </div>
  );
}

// Safely render any value as a string (handles nested objects)
function safe(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val.label) return val.label;
  if (val.name) return val.name;
  if (val.text) return val.text;
  return JSON.stringify(val);
}

function ReportSection({ title, content }) {
  if (!content) return null;
  if (typeof content === 'string') {
    return (
      <div className="section-block">
        <div className="section-title">{title}</div>
        <div className="section-content">{content}</div>
      </div>
    );
  }
  if (Array.isArray(content)) {
    return (
      <div className="section-block">
        <div className="section-title">{title}</div>
        <div className="section-content">
          <ul>{content.map((item, i) => <li key={i}>{safe(item)}</li>)}</ul>
        </div>
      </div>
    );
  }
  if (typeof content === 'object') {
    return (
      <div className="section-block">
        <div className="section-title">{title}</div>
        <div className="section-content">
          <ul>{Object.entries(content).map(([k, v]) => <li key={k}><strong>{k}:</strong> {safe(v)}</li>)}</ul>
        </div>
      </div>
    );
  }
  return null;
}

export default function App() {
  const [bride, setBride] = useState(DEFAULTS.bride);
  const [groom, setGroom] = useState(DEFAULTS.groom);
  const [score, setScore] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState({ score: false, report: false, pdf: false });
  const [error, setError] = useState(null);

  async function fetchScore() {
    setLoading(l => ({ ...l, score: true }));
    setError(null);
    setScore(null);
    setReport(null);
    try {
      const params = new URLSearchParams({
        bride_dob: bride.dob, bride_time: bride.time,
        bride_lat: bride.lat, bride_lon: bride.lon,
        groom_dob: groom.dob, groom_time: groom.time,
        groom_lat: groom.lat, groom_lon: groom.lon,
        mode: 'full'
      });
      const res = await fetch(`${API}/compatibility/score?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setScore(data);
    } catch (e) {
      setError(`Score API error: ${e.message}`);
    } finally {
      setLoading(l => ({ ...l, score: false }));
    }
  }

  async function fetchReport() {
    setLoading(l => ({ ...l, report: true }));
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`${API}/compatibility/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_a: { name: 'Bride', date_of_birth: bride.dob, time_of_birth: bride.time, latitude: parseFloat(bride.lat), longitude: parseFloat(bride.lon) },
          person_b: { name: 'Groom', date_of_birth: groom.dob, time_of_birth: groom.time, latitude: parseFloat(groom.lat), longitude: parseFloat(groom.lon) },
          lang: 'en'
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReport(data);
    } catch (e) {
      setError(`Report API error: ${e.message}`);
    } finally {
      setLoading(l => ({ ...l, report: false }));
    }
  }

  async function fetchPDF() {
    setLoading(l => ({ ...l, pdf: true }));
    setError(null);
    try {
      const res = await fetch(`${API}/compatibility/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${bride.city} Bride`,
          date_of_birth: bride.dob,
          time_of_birth: bride.time,
          latitude: parseFloat(bride.lat),
          longitude: parseFloat(bride.lon),
          lang: 'en'
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.pdf_url) {
        window.open(data.pdf_url, '_blank');
      } else {
        setError('PDF generated but no download URL returned');
      }
    } catch (e) {
      setError(`PDF API error: ${e.message}`);
    } finally {
      setLoading(l => ({ ...l, pdf: false }));
    }
  }

  // Extract report sections for display
  const reportSections = report?.sections || report?.report?.sections;
  const reportSummary = report?.summary || report?.report?.summary;
  const reportRemedies = report?.remedies || report?.report?.remedies;
  const reportStrengths = report?.strengths || report?.report?.strengths;
  const reportChallenges = report?.challenges || report?.report?.challenges;
  const reportPsychology = report?.psychology || report?.report?.psychology;

  return (
    <div className="app">
      <div className="header">
        <img src="https://tathaastuapi.com/assets/images/logo1.png" alt="TathaAstu" />
        <h1>Compatibility Checker</h1>
        <span className="badge">Demo App</span>
      </div>

      <div className="form-grid">
        <PersonForm label="Bride" emoji="👰" data={bride} onChange={setBride} />
        <PersonForm label="Groom" emoji="🤵" data={groom} onChange={setGroom} />
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={fetchScore} disabled={loading.score}>
          {loading.score ? <><span className="spinner" /> Checking...</> : 'Check Compatibility'}
        </button>
        {score && (
          <button className="btn btn-secondary" onClick={fetchReport} disabled={loading.report}>
            {loading.report ? <><span className="spinner" style={{ borderColor: 'rgba(0,0,0,.2)', borderTopColor: '#1a1d2e' }} /> Loading...</> : 'Get Full Report'}
          </button>
        )}
        {score && (
          <button className="btn btn-pdf" onClick={fetchPDF} disabled={loading.pdf}>
            {loading.pdf ? <><span className="spinner" /> Generating...</> : 'Generate PDF'}
          </button>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {score && (
        <div className="results">
          <div className="score-card">
            <ScoreRing score={Math.round(score.overall_score || 0)} />
            <div className="verdict" style={{ color: scoreColor(score.overall_score || 0) }}>
              {typeof score.verdict === 'object' ? (score.verdict.label || score.verdict.code) : (score.verdict || 'N/A')}
            </div>
            <div className="guna">
              Guna Milan: {typeof (score.guna_milan ?? score.guna) === 'object' ? (score.guna_milan?.score ?? score.guna?.score ?? 0) : (score.guna_milan || score.guna || 0)} / 36
            </div>

            <KootaGrid breakdown={score.koota_breakdown} />

            {score.doshas && (
              <div className="dosha-row">
                {Object.entries(score.doshas).map(([k, v]) => {
                  const isPresent = typeof v === 'object' ? v.present || v.status : !!v;
                  return (
                    <span key={k} className={`dosha-badge ${isPresent ? 'dosha-yes' : 'dosha-no'}`}>
                      {k.replace(/_/g, ' ')}: {isPresent ? 'Present' : 'Clear'}
                    </span>
                  );
                })}
              </div>
            )}

            {score.domain_scores && (
              <>
                <div style={{ marginTop: 20, fontSize: '.82rem', fontWeight: 700, color: '#5a5f7a', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left' }}>
                  Domain Scores
                </div>
                <DomainScores domains={score.domain_scores} />
              </>
            )}
          </div>
        </div>
      )}

      {report && (
        <div className="report-card">
          <div className="report-header">
            <h3>Compatibility Report</h3>
            <span style={{ fontSize: '.75rem', color: '#9ca0b8' }}>Powered by TathaAstu API</span>
          </div>
          <div className="report-body">
            {reportSummary && <ReportSection title="Summary" content={reportSummary} />}
            {reportPsychology && <ReportSection title="Psychology" content={reportPsychology} />}
            {reportStrengths && <ReportSection title="Strengths" content={reportStrengths} />}
            {reportChallenges && <ReportSection title="Challenges" content={reportChallenges} />}
            {reportSections && typeof reportSections === 'object' && (
              Object.entries(reportSections).map(([k, v]) => (
                <ReportSection key={k} title={k.replace(/_/g, ' ')} content={v} />
              ))
            )}
            {reportRemedies && <ReportSection title="Remedies" content={reportRemedies} />}
          </div>
        </div>
      )}

      <div className="footer">
        Built with <a href="https://tathaastuapi.com" target="_blank" rel="noopener">TathaAstu API</a> &middot;
        <a href="https://tathaastuapi.com/docs.html" target="_blank" rel="noopener"> Documentation</a> &middot;
        <a href="https://github.com/nicksahdev/tathaastu-compatibility-demo" target="_blank" rel="noopener"> GitHub</a>
      </div>
    </div>
  );
}
