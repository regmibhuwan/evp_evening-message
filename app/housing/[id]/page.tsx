'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/lib/useSupabaseAuth';
import type { HousingPost } from '@/lib/supabase/db';

interface ChatMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  senderName: string;
  senderEmail: string;
}

export default function HousingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useSupabaseAuth();
  const [post, setPost] = useState<HousingPost | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [contactExchanged, setContactExchanged] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ name: string; email: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && params.id) {
      loadPost();
      loadMessages();
      checkContactExchange();
    }
  }, [user, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/housing?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (err) {
      console.error('Error loading post:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat?postId=${params.id}&postType=housing`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const checkContactExchange = async () => {
    if (!post || !user) return;
    
    try {
      const response = await fetch(
        `/api/contact?other_user_id=${post.user_id}&post_id=${params.id}&post_type=housing`
      );
      if (response.ok) {
        const data = await response.json();
        setContactExchanged(data.exchanged);
        if (data.exchanged && data.contactInfo) {
          setContactInfo(data.contactInfo);
        }
      }
    } catch (err) {
      console.error('Error checking contact exchange:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !post || !user) return;

    setSending(true);
    try {
      // Determine receiver: if user is post owner, receiver is the other person in the conversation
      // Otherwise, receiver is the post owner
      let receiverId = post.user_id;
      if (post.user_id === user.id && messages.length > 0) {
        // If owner, find the other person from messages
        const otherMessage = messages.find(msg => msg.sender_id !== user.id);
        receiverId = otherMessage ? otherMessage.sender_id : post.user_id;
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: receiverId,
          post_id: post.id,
          post_type: 'housing',
          message: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleExchangeContact = async () => {
    if (!post || !user) return;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          other_user_id: post.user_id,
          post_id: post.id,
          post_type: 'housing',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContactExchanged(true);
        if (data.contactInfo) {
          setContactInfo(data.contactInfo);
        }
      }
    } catch (err) {
      console.error('Error exchanging contact:', err);
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

  if (!user || !post) return null;

  const isOwner = post.user_id === user.id;

  return (
    <div className="container">
      <nav className="main-nav">
        <Link href="/" className="nav-link">Messages</Link>
        <Link href="/carpool" className="nav-link">Carpool</Link>
        <Link href="/housing" className="nav-link active">Housing</Link>
        <span className="nav-user">{user.email}</span>
      </nav>

      <div className="posts-container">
        <Link href="/housing" style={{ textDecoration: 'none', color: '#4a90e2', marginBottom: '16px', display: 'block' }}>
          ← Back to Housing
        </Link>

        <div className="post-card">
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
          {post.contact_info && (
            <div className="post-meta">📞 {post.contact_info}</div>
          )}
          <div className="post-description">{post.description}</div>
          {isOwner && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                    try {
                      const response = await fetch(`/api/housing?id=${post.id}`, {
                        method: 'DELETE',
                      });
                      if (response.ok) {
                        router.push('/housing');
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

        {!isOwner && (
          <div className="form-container" style={{ marginTop: '20px' }}>
            {contactExchanged && contactInfo ? (
              <div>
                <h3>Contact Information</h3>
                <p><strong>Name:</strong> {contactInfo.name}</p>
                <p><strong>Email:</strong> {contactInfo.email}</p>
                {contactInfo.phone && (
                  <p><strong>Phone:</strong> {contactInfo.phone}</p>
                )}
                <p style={{ marginTop: '12px' }}>
                  <a href={`mailto:${contactInfo.email}`} style={{ color: '#4a90e2' }}>
                    Send Email
                  </a>
                  {contactInfo.phone && (
                    <>
                      {' • '}
                      <a href={`tel:${contactInfo.phone}`} style={{ color: '#4a90e2' }}>
                        Call
                      </a>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <button
                onClick={handleExchangeContact}
                className="submit-button"
                style={{ width: '100%' }}
              >
                Exchange Contact Information
              </button>
            )}
          </div>
        )}

        <div className="form-container" style={{ marginTop: '20px' }}>
          <h3>Chat</h3>
          <div className="chat-container">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                  >
                    <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                      {msg.senderName}
                    </div>
                    <div>{msg.message}</div>
                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-input"
                disabled={sending}
              />
              <button
                type="submit"
                className="chat-send-button"
                disabled={sending || !newMessage.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

