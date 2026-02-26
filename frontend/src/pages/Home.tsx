import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Sentence, Stats } from '../types';

const Home: React.FC = () => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sentencesRes, statsRes] = await Promise.all([
          api.getSentences(1, 3),
          api.getStats().catch(() => null)
        ]);
        setSentences(sentencesRes.data);
        setStats(statsRes);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="main">
      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Master English Pronunciation
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
          Practice with native British and American speakers. Get instant feedback on your pronunciation with color-coded scoring.
        </p>
        <Link to="/practice" className="btn btn-primary btn-large">
          Start Practicing Now
        </Link>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalSentences}</div>
              <div className="stat-label">Total Sentences</div>
            </div>
            {stats.byCategory.slice(0, 3).map(cat => (
              <div key={cat.category} className="stat-card">
                <div className="stat-value">{cat.count}</div>
                <div className="stat-label" style={{ textTransform: 'capitalize' }}>{cat.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Sentences */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Practice Sentences</h2>
          <Link to="/practice" className="btn btn-secondary">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : sentences.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sentences.map(sentence => (
              <div
                key={sentence.id}
                style={{
                  padding: '16px',
                  background: 'var(--background)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                    {sentence.text}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ textTransform: 'capitalize' }}>{sentence.category}</span>
                    <span>Level {sentence.difficulty}</span>
                    <span style={{ textTransform: 'capitalize' }}>{sentence.audioStatus}</span>
                  </div>
                </div>
                {sentence.audioBritish && (
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => new Audio(api.getAudioUrl(sentence.audioBritish!)).play()}
                    title="Play British"
                  >
                    🇬🇧
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No sentences available. Add some in the admin panel!</p>
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px', fontWeight: 600 }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ marginBottom: '8px' }}>Listen to Native Speakers</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Hear authentic British and American pronunciations
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎤</div>
            <h3 style={{ marginBottom: '8px' }}>Record Your Voice</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Practice speaking and compare to native audio
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ marginBottom: '8px' }}>Get Instant Feedback</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Color-coded scoring helps you improve quickly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
