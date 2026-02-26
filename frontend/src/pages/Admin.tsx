import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Sentence, Stats } from '../types';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSentence, setEditingSentence] = useState<Sentence | null>(null);
  const [formData, setFormData] = useState({ text: '', category: 'general', difficulty: 1 });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSentences();
      fetchStats();
    }
  }, [isAuthenticated, page]);

  const checkAuth = async () => {
    try {
      const res = await api.verifyAuth();
      setIsAuthenticated(res.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.login(username, password);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const fetchSentences = async () => {
    try {
      const res = await api.getSentences(page, 10);
      setSentences(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching sentences:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.getStats();
      setStats(res);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSentence) {
        await api.updateSentence(editingSentence.id, formData);
      } else {
        await api.createSentence(formData);
      }
      setShowModal(false);
      setEditingSentence(null);
      setFormData({ text: '', category: 'general', difficulty: 1 });
      fetchSentences();
      fetchStats();
    } catch (error) {
      console.error('Error saving sentence:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sentence?')) return;
    
    try {
      await api.deleteSentence(id);
      fetchSentences();
      fetchStats();
    } catch (error) {
      console.error('Error deleting sentence:', error);
    }
  };

  const handleRegenerateAudio = async (id: number) => {
    try {
      await api.regenerateAudio(id);
      alert('Audio regeneration started');
      fetchSentences();
    } catch (error) {
      console.error('Error regenerating audio:', error);
    }
  };

  const openEditModal = (sentence: Sentence) => {
    setEditingSentence(sentence);
    setFormData({
      text: sentence.text,
      category: sentence.category,
      difficulty: sentence.difficulty
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingSentence(null);
    setFormData({ text: '', category: 'general', difficulty: 1 });
    setShowModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="main">
        <div className="card" style={{ maxWidth: '400px', margin: '48px auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Admin Login</h2>
          
          {error && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--error)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{ 
            marginTop: '16px', 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            fontSize: '12px'
          }}>
            Default credentials: admin / admin123
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Admin Panel</h1>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalSentences}</div>
            <div className="stat-label">Total Sentences</div>
          </div>
          {stats.audioStatus.map(s => (
            <div key={s.status} className="stat-card">
              <div className="stat-value">{s.count}</div>
              <div className="stat-label" style={{ textTransform: 'capitalize' }}>
                {s.status} Audio
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sentences Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Sentences ({stats?.totalSentences || 0})</h2>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Sentence
          </button>
        </div>

        {sentences.length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Text</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Audio</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sentences.map(sentence => (
                  <tr key={sentence.id}>
                    <td style={{ maxWidth: '300px' }}>{sentence.text}</td>
                    <td style={{ textTransform: 'capitalize' }}>{sentence.category}</td>
                    <td>{sentence.difficulty}</td>
                    <td>
                      <span style={{ 
                        textTransform: 'capitalize',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: sentence.audioStatus === 'completed' 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : sentence.audioStatus === 'processing'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: sentence.audioStatus === 'completed' 
                          ? 'var(--secondary)' 
                          : sentence.audioStatus === 'processing'
                          ? 'var(--warning)'
                          : 'var(--error)'
                      }}>
                        {sentence.audioStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => openEditModal(sentence)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleRegenerateAudio(sentence.id)}
                          disabled={sentence.audioStatus === 'processing'}
                        >
                          🔊
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleDelete(sentence.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                <button 
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  className="btn btn-secondary"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>No sentences yet. Click "Add Sentence" to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSentence ? 'Edit Sentence' : 'Add New Sentence'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">English Text</label>
                <textarea
                  className="form-textarea"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Enter the sentence to practice..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="greeting">Greeting</option>
                  <option value="casual">Casual</option>
                  <option value="business">Business</option>
                  <option value="formal">Formal</option>
                  <option value="ordering">Ordering</option>
                  <option value="asking">Asking</option>
                  <option value="tongue-twister">Tongue Twister</option>
                  <option value="pangram">Pangram</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty (1-5)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="5"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSentence ? 'Save Changes' : 'Add Sentence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
