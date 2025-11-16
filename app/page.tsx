export const dynamic = 'force-dynamic';

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_MAPPINGS } from '@/config';
import { useSupabaseAuth } from '@/lib/useSupabaseAuth';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-fill and lock verified user info (cannot be changed)
  useEffect(() => {
    if (user && !isAnonymous) {
      // Always use verified user info - cannot be changed
      setWorkerName(user.name);
      setWorkerEmail(user.email);
    }
  }, [user, isAnonymous]);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Update greeting automatically when category changes
  useEffect(() => {
    if (category) {
      const selectedCategory = CATEGORY_MAPPINGS.find(c => c.label === category);
      if (selectedCategory) {
        const newGreeting = `Dear ${selectedCategory.recipientName},\n\nI hope this message finds you well. I am writing to you regarding:\n\n`;
        
        if (!message.trim()) {
          setMessage(newGreeting);
        } else {
          const dearPattern = /^Dear\s+[^,\n]+,\s*\n\nI hope this message finds you well\. I am writing to you regarding:\s*\n\n/i;
          if (dearPattern.test(message)) {
            const actualMessage = message.replace(dearPattern, '');
            setMessage(newGreeting + actualMessage);
          } else if (message.startsWith('Dear ')) {
            const nameMatch = message.match(/^Dear\s+([^,\n]+),/i);
            if (nameMatch) {
              const restOfMessage = message.substring(message.indexOf(',') + 1);
              setMessage(`Dear ${selectedCategory.recipientName},${restOfMessage}`);
            }
          } else {
            setMessage(newGreeting + message);
          }
        }
      }
    }
  }, [category]);

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setIsDropdownOpen(false);
    if (selectedCategory === 'Anonymous Company Feedback') {
      setIsAnonymous(true);
      setWorkerName('');
      setWorkerEmail('');
      setMessage('');
    } else if (isAnonymous && selectedCategory !== 'Anonymous Company Feedback') {
      setIsAnonymous(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!category) {
      setError('Please select a category');
      setIsSubmitting(false);
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a topic');
      setIsSubmitting(false);
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      setIsSubmitting(false);
      return;
    }

    const isAnonymousFeedback = category === 'Anonymous Company Feedback' || isAnonymous;
    
    // Verify user is authenticated (name and email are locked to verified account)
    if (!isAnonymousFeedback && (!user?.name || !user?.email)) {
      setError('You must be verified with a Gmail account to send non-anonymous messages.');
      setIsSubmitting(false);
      return;
    }
    
    const greetingPattern = /^Dear\s+[^,\n]+,\s*\n\nI hope this message finds you well\. I am writing to you regarding:\s*\n\n/i;
    const messageWithoutGreeting = message.replace(greetingPattern, '').trim();
    if (!messageWithoutGreeting) {
      setError('Please enter your message content after the greeting.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Always use verified user info (cannot be spoofed)
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          topic: topic.trim(),
          message: message.trim(),
          workerName: isAnonymousFeedback ? null : (user?.name || null),
          workerEmail: isAnonymousFeedback ? null : (user?.email || null),
          workerPhone: isAnonymousFeedback ? null : (user?.phone || null),
          isAnonymous: isAnonymousFeedback,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server error: ${text.substring(0, 200)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      router.push('/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container">
        <div className="form-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /signin
  }

  return (
    <div className="container">
      <nav className="main-nav">
        <Link href="/" className="nav-link active">Messages</Link>
        <Link href="/carpool" className="nav-link">Carpool</Link>
        <Link href="/housing" className="nav-link">Housing</Link>
        <span className="nav-user">{user.email}</span>
      </nav>
      <div className="form-container">
        <h1>EVP Night Shift Message</h1>
        <p className="subtitle">Communicate with office staffs</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">
              Category <span style={{ color: '#c33' }}>*</span>
            </label>
            <div className="custom-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={`custom-dropdown-toggle ${!category ? 'placeholder' : ''} ${isDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <span>{category || 'Select a category...'}</span>
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                >
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  <div className="dropdown-group">
                    <div className="dropdown-group-label">Departments</div>
                    {CATEGORY_MAPPINGS.slice(0, 5).map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        className={`dropdown-option ${category === cat.label ? 'selected' : ''}`}
                        onClick={() => handleCategorySelect(cat.label)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="dropdown-group">
                    <div className="dropdown-group-label">Individuals</div>
                    {CATEGORY_MAPPINGS.slice(5).map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        className={`dropdown-option ${category === cat.label ? 'selected' : ''}`}
                        onClick={() => handleCategorySelect(cat.label)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                type="hidden"
                id="category"
                value={category}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="topic">
              Topic <span style={{ color: '#c33' }}>*</span>
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Brief topic or subject of your message..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Message <span style={{ color: '#c33' }}>*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="isAnonymous" className="checkbox-label">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => {
                  setIsAnonymous(e.target.checked);
                  if (e.target.checked) {
                    setWorkerName('');
                    setWorkerEmail('');
                  }
                }}
              />
              <span><strong>Submit as anonymous feedback</strong> (your identity will be protected)</span>
            </label>
            <small className="checkbox-help-text">
              Anonymous feedback is recommended for company-related concerns, suggestions, or sensitive matters. 
              When enabled, your name will not be included in the message.
            </small>
          </div>

          {!isAnonymous && (
            <>
              <div className="form-group">
                <label htmlFor="workerName">
                  Your Name <span style={{ color: '#c33' }}>*</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
                    (Locked to your account)
                  </span>
                </label>
                <input
                  type="text"
                  id="workerName"
                  value={user?.name || ''}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  required={!isAnonymous}
                />
              </div>

              <div className="form-group">
                <label htmlFor="workerEmail">
                  Your Email Address <span style={{ color: '#c33' }}>*</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
                    (Locked to your account)
                  </span>
                </label>
                <input
                  type="email"
                  id="workerEmail"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  required={!isAnonymous}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '14px' }}>
                  This is your verified email address. Recipients can reply directly to this email.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="workerPhone">
                  Your Phone Number <span style={{ color: '#c33' }}>*</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
                    (Locked to your account)
                  </span>
                </label>
                <input
                  type="tel"
                  id="workerPhone"
                  value={user?.phone || ''}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  required={!isAnonymous}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '14px' }}>
                  This is your verified phone number from sign up.
                </small>
              </div>
            </>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
