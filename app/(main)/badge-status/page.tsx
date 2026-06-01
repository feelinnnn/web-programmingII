"use client";

import './badge.css';

export default function BadgesPage() {
  const verifiedBadges = [
    { id: 1, name: "Name", status: "verified", pillColor: "white" },
    { id: 2, name: "Name", status: "verified", pillColor: "yellow" },
    { id: 3, name: "Name", status: "verified", pillColor: "orange" },
    { id: 4, name: "Name", status: "verified", pillColor: "red" },
    { id: 5, name: "Name", status: "verified", pillColor: "green" },
    { id: 6, name: "Name", status: "verified", pillColor: "white" },
  ];

  const pendingBadges = [
    { id: 7, name: "Name", status: "pending", pillColor: "green" },
    { id: 8, name: "Name", status: "pending", pillColor: "red" },
    { id: 9, name: "Name", status: "pending", pillColor: "white" },
    { id: 10, name: "Name", status: "pending", pillColor: "yellow" },
    { id: 11, name: "Name", status: "pending", pillColor: "green" },
    { id: 12, name: "Name", status: "pending", pillColor: "orange" },
  ];

  const declinedBadges = [
    { id: 13, name: "Name", status: "declined", pillColor: "red" },
    { id: 14, name: "Name", status: "declined", pillColor: "red" },
    { id: 15, name: "Name", status: "declined", pillColor: "green" },
  ];

  return (
    <div className="layout-container">

      <main className="main-content">
        <div className="badges-page">
          <h1 className="page-title">Badges Status</h1>

          <section className="badges-section">
            <div className="section-header">
              <div className="header-left">
                <span className="section-title">Verified</span>
                <span className="status-dot verified"></span>
                <span className="total-count">Total: {verifiedBadges.length}</span>
              </div>
              <div className="section-right">
                <button className="see-all-btn">
                  See all verified &gt;
                </button>
              </div>
            </div>
            <div className="badges-grid">
              {verifiedBadges.map((badge) => (
                <div key={badge.id} className="badge-card">
                  <div className="badge-content">
                    <span className={`badge-pill pill-${badge.pillColor}`}>Badge</span>
                  </div>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="badges-section">
            <div className="section-header">
              <div className="header-left">
                <span className="section-title">Pending</span>
                <span className="status-dot pending"></span>
                <span className="total-count">Total: {pendingBadges.length}</span>
              </div>
              <div className="section-right">
                <button className="see-all-btn">
                  See all pending &gt;
                </button>
              </div>
            </div>
            <div className="badges-grid">
              {pendingBadges.map((badge) => (
                <div key={badge.id} className="badge-card">
                  <div className="badge-content">
                    <span className={`badge-pill pill-${badge.pillColor}`}>Badge</span>
                  </div>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="badges-section">
            <div className="section-header">
              <div className="header-left">
                <span className="section-title">Declined</span>
                <span className="status-dot declined"></span>
                <span className="total-count">Total: {declinedBadges.length}</span>
              </div>
              <div className="section-right">
                <button className="see-all-btn">
                  See all declined &gt;
                </button>
              </div>
            </div>
            <div className="badges-grid">
              {declinedBadges.map((badge) => (
                <div key={badge.id} className="badge-card">
                  <div className="badge-content">
                    <span className={`badge-pill pill-${badge.pillColor}`}>Badge</span>
                  </div>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}