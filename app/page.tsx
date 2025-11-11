'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_MAPPINGS } from '@/config';

export default function Home() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update message with default greeting when category changes
  useEffect(() => {
    if (category && !message.trim()) {
      const selectedCategory = CATEGORY_MAPPINGS.find(c => c.label === category);
      if (selectedCategory) {
        const greeting = `Dear ${selectedCategory.recipientName},\n\nI hope this message finds you well. I am writing to you regarding:\n\n`;
        setMessage(greeting);
      }
    }
  }, [category]);

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

    // Check if anonymous feedback is selected
    const isAnonymousFeedback = category === 'Anonymous Company Feedback' || isAnonymous;
    
    // Require name and email for non-anonymous submissions
    if (!isAnonymousFeedback && !workerName.trim()) {
      setError('Your name is required for this category. Use "Anonymous Company Feedback" category for anonymous submissions.');
      setIsSubmitting(false);
      return;
    }

    // Require email for non-anonymous submissions (so recipient can reply)
    if (!isAnonymousFeedback && !workerEmail.trim()) {
      setError('Your email address is required so the recipient can reply to your message.');
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    if (!isAnonymousFeedback && workerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(workerEmail.trim())) {
        setError('Please enter a valid email address.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          topic: topic.trim(),
          message: message.trim(),
          workerName: isAnonymousFeedback ? null : workerName.trim() || null,
          workerEmail: isAnonymousFeedback ? null : workerEmail.trim() || null,
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

      // Redirect to success page
      router.push('/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1>EVP Evening Shift Message</h1>
        <p className="subtitle">Communicate with office staff after hours</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">
              Category <span className="optional">(required)</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                const selectedCategory = e.target.value;
                setCategory(selectedCategory);
                // Auto-enable anonymous for Anonymous Company Feedback
                if (selectedCategory === 'Anonymous Company Feedback') {
                  setIsAnonymous(true);
                  setWorkerName('');
                  setWorkerEmail('');
                  setMessage(''); // Clear message for anonymous
                } else if (isAnonymous && selectedCategory !== 'Anonymous Company Feedback') {
                  // Keep anonymous state if user manually checked it
                  // Only clear if switching away from anonymous category
                }
                // Message will be updated by useEffect when category changes
              }}
              required
            >
              <option value="">Select a category...</option>
              <optgroup label="Departments">
                {CATEGORY_MAPPINGS.slice(0, 5).map((cat) => (
                  <option key={cat.label} value={cat.label}>
                    {cat.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Individuals">
                {CATEGORY_MAPPINGS.slice(5).map((cat) => (
                  <option key={cat.label} value={cat.label}>
                    {cat.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="topic">
              Topic <span className="optional">(required)</span>
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
              Message <span className="optional">(required)</span>
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
                  Your Name <span className="optional">(required)</span>
                </label>
                <input
                  type="text"
                  id="workerName"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="Enter your full name"
                  required={!isAnonymous}
                />
              </div>

              <div className="form-group">
                <label htmlFor="workerEmail">
                  Your Email Address <span className="optional">(required)</span>
                </label>
                <input
                  type="email"
                  id="workerEmail"
                  value={workerEmail}
                  onChange={(e) => setWorkerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required={!isAnonymous}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '14px' }}>
                  This allows the recipient to reply directly to your email.
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

