export const dynamic = 'force-dynamic';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/lib/useSupabaseAuth';
import type { CarpoolPost } from '@/lib/supabase/db';

export default function CarpoolPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const [posts, setPosts] = useState<CarpoolPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'offer' as 'offer' | 'request',
    starting_point: '',
    destination: '',
    date: '',
    time: '',
    price: '',
    availability: '',
    additional_info: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/carpool');
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

    if (!formData.starting_point || !formData.destination || !formData.date || !formData.time) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/carpool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          type: 'offer',
          starting_point: '',
          destination: '',
          date: '',
          time: '',
          price: '',
          availability: '',
          additional_info: '',
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
        <Link href="/carpool" className="nav-link active">Carpool</Link>
        <Link href="/housing" className="nav-link">Housing</Link>
        <span className="nav-user">{user.email}</span>
      </nav>

      <div className="posts-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Carpool</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="submit-button"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            {showCreateForm ? 'Cancel' : '+ New Post'}
          </button>
        </div>

        {showCreateForm && (
          <div className="form-container" style={{ marginBottom: '20px' }}>
            <h2>{formData.type === 'offer' ? 'Offer a Carpool' : 'Request a Carpool'}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'offer' })}
                    className={formData.type === 'offer' ? 'submit-button' : 'submit-button'}
                    style={{
                      flex: 1,
                      backgroundColor: formData.type === 'offer' ? '#4a90e2' : '#f0f0f0',
                      color: formData.type === 'offer' ? 'white' : '#666',
                    }}
                  >
                    Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'request' })}
                    className="submit-button"
                    style={{
                      flex: 1,
                      backgroundColor: formData.type === 'request' ? '#4a90e2' : '#f0f0f0',
                      color: formData.type === 'request' ? 'white' : '#666',
                    }}
                  >
                    Request
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Starting Point <span style={{ color: '#c33' }}>*</span></label>
                <input
                  type="text"
                  value={formData.starting_point}
                  onChange={(e) => setFormData({ ...formData, starting_point: e.target.value })}
                  placeholder="e.g., Main Street, Berwick"
                  required
                />
              </div>

              <div className="form-group">
                <label>Destination <span style={{ color: '#c33' }}>*</span></label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g., EVP Office"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date <span style={{ color: '#c33' }}>*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time <span style={{ color: '#c33' }}>*</span></label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Price (optional)</label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., $5, Free, Gas money"
                />
              </div>

              <div className="form-group">
                <label>Availability (optional)</label>
                <input
                  type="text"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  placeholder="e.g., Daily, Weekdays only"
                />
              </div>

              <div className="form-group">
                <label>Additional Info (optional)</label>
                <textarea
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  placeholder="Any additional details..."
                />
              </div>

              <button type="submit" className="submit-button" disabled={submitting}>
                {submitting ? 'Posting...' : 'Create Post'}
              </button>
            </form>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="form-container">
            <p style={{ textAlign: 'center', color: '#666' }}>No carpool posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isOwner = post.user_id === user?.id;
            return (
              <div key={post.id} className="post-card">
                <Link href={`/carpool/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="post-header">
                    <span className={`post-type ${post.type}`}>{post.type}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="post-title">
                    {post.starting_point} → {post.destination}
                  </div>
                  <div className="post-meta">
                    📅 {post.date} at {post.time}
                    {post.price && ` • 💰 ${post.price}`}
                  </div>
                  {post.availability && (
                    <div className="post-meta">📋 {post.availability}</div>
                  )}
                  {post.additional_info && (
                    <div className="post-description">{post.additional_info}</div>
                  )}
                </Link>
                {isOwner && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                          try {
                            const response = await fetch(`/api/carpool?id=${post.id}`, {
                              method: 'DELETE',
                            });
                            if (response.ok) {
                              loadPosts();
                            } else {
                              alert('Failed to delete post');
                            }
                          } catch (err) {
                            alert('Error deleting post');
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
                      🗑️ Delete Post
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

