'use client';

import { useEffect, useState } from 'react';
import { REQUIRE_SUPERVISOR_APPROVAL } from '@/config';

interface Message {
  id: number;
  category: string;
  recipient_email: string;
  recipient_name: string;
  worker_name: string | null;
  topic: string;
  message: string;
  timestamp: string;
  status: string;
  created_at: string;
}

export default function SupervisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!REQUIRE_SUPERVISOR_APPROVAL) {
      setError('Supervisor approval is not enabled');
      setLoading(false);
      return;
    }

    fetchMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/supervisor/messages');
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (messageId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/supervisor/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          action,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Remove message from list
        setMessages(messages.filter(m => m.id !== messageId));
      } else {
        alert(data.error || 'Failed to process action');
      }
    } catch (err) {
      alert('Failed to process action');
    }
  };

  if (!REQUIRE_SUPERVISOR_APPROVAL) {
    return (
      <div className="container">
        <div className="form-container">
          <h1>Supervisor Approval</h1>
          <p className="subtitle">Supervisor approval is not enabled in the configuration.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <h1>Supervisor Approval</h1>
          <p className="subtitle">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <h1>Supervisor Approval</h1>
        <p className="subtitle">Review and approve pending messages</p>

        {error && <div className="error-message">{error}</div>}

        {messages.length === 0 ? (
          <div className="no-messages">No pending messages</div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className="message-card">
                <div className="message-header">
                  <div className="message-category">{msg.category}</div>
                  <div className="message-time">{msg.timestamp}</div>
                </div>
                <div className="message-from">
                  From: {msg.worker_name || 'Anonymous'}
                </div>
                <div style={{ marginBottom: '12px', fontWeight: '600', color: '#4a90e2' }}>
                  Topic: {msg.topic}
                </div>
                <div className="message-text">{msg.message}</div>
                <div className="message-actions">
                  <button
                    className="action-button approve-button"
                    onClick={() => handleAction(msg.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="action-button reject-button"
                    onClick={() => handleAction(msg.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

