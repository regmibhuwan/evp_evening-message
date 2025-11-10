import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="container">
      <div className="success-container">
        <div className="success-icon">✓</div>
        <div className="success-message">Your message has been sent.</div>
        <Link href="/" className="back-button">
          Send Another Message
        </Link>
      </div>
    </div>
  );
}

