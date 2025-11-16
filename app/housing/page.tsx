'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import type { HousingPost } from '@/lib/db';

export default function HousingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<HousingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    type: 'shared' as 'shared' | 'private',
    title: '',
    description: '',
    price: '',
    contact_info: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/verify');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/housing');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.location || !formData.title || !formData.description) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/housing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          location: '',
          type: 'shared',
          title: '',
          description: '',
          price: '',
          contact_info: '',
        });
        loadPosts();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create post');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container">
        <div className="form-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container">
      <nav className="main-nav">
        <Link href="/" className="nav-link">Messages</Link>
        <Link href="/carpool" className="nav-link">Carpool</Link>
        <Link href="/housing" className="nav-link active">Housing</Link>
        <span className="nav-user">{user.email}</span>
      </nav>

      <div className="posts-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Housing / Rentals</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="submit-button"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            {showCreateForm ? 'Cancel' : '+ New Listing'}
          </button>
        </div>

        {showCreateForm && (
          <div className="form-container" style={{ marginBottom: '20px' }}>
            <h2>Create Housing Listing</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'shared' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: formData.type === 'shared' ? '#52c41a' : '#f0f0f0',
                      color: formData.type === 'shared' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Shared
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'private' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: formData.type === 'private' ? '#ff4d4f' : '#f0f0f0',
                      color: formData.type === 'private' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Private
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Location <span style={{ color: '#c33' }}>*</span></label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., 123 Main St, Berwick, NS"
                  required
                />
              </div>

              <div className="form-group">
                <label>Title <span style={{ color: '#c33' }}>*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Cozy 2-bedroom apartment"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description <span style={{ color: '#c33' }}>*</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the property, amenities, etc."
                  required
                />
              </div>

              <div className="form-group">
                <label>Price (optional)</label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., $800/month, $500 + utilities"
                />
              </div>

              <div className="form-group">
                <label>Contact Info (optional)</label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="Phone number or other contact method"
                />
              </div>

              <button type="submit" className="submit-button" disabled={submitting}>
                {submitting ? 'Posting...' : 'Create Listing'}
              </button>
            </form>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="form-container">
            <p style={{ textAlign: 'center', color: '#666' }}>No housing listings yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isOwner = post.user_id === user?.id;
            return (
              <div key={post.id} className="post-card">
                <Link href={`/housing/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="post-header">
                    <span className={`post-type ${post.type}`}>{post.type}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="post-title">{post.title}</div>
                  <div className="post-meta">📍 {post.location}</div>
                  {post.price && (
                    <div className="post-meta">💰 {post.price}</div>
                  )}
                  <div className="post-description">{post.description}</div>
                </Link>
                {isOwner && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                          try {
                            const response = await fetch(`/api/housing?id=${post.id}`, {
                              method: 'DELETE',
                            });
                            if (response.ok) {
                              loadPosts();
                            } else {
                              alert('Failed to delete listing');
                            }
                          } catch (err) {
                            alert('Error deleting listing');
                          }
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        width: '100%',
                      }}
                    >
                      🗑️ Delete Listing
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

