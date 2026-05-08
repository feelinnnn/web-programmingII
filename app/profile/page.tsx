import Navbar from "../components/Navbar";
import './profile.css'; 

export default function ProfilePage() {
  return (
    <div className="layout-container">
      <Navbar />
      
      <main className="main-content">
        <header className="profile-header">
          <div className="profile-info-top">
            <div className="profile-user-left">
              <img src="/avatar/Avatar.png" alt="Sense Seeya" className="large-avatar" />
              <div className="user-details">
                <h1>Sense Seeya</h1>
                <p className="subtitle">Home cook 
                  <span className="social-icons">
                    <span><img src="/icon/x-icon.png" alt="x-icon" /></span>
                    <span><img src="/icon/instragram-icon.png" alt="instagram-icon" /></span>
                    <span><img src="/icon/facebook-icon.png" alt="facebook-icon" /></span>
                    <span><img src="/icon/email-icon.png" alt="email-icon" /></span>
                    <span><img src="/icon/other-icon.png" alt="other-icon" /></span>
                    </span>
                </p>
              </div>
            </div>
            <button className="edit-btn">Edit profile</button>
          </div>
          
          <div className="stats-row">
            <div className="stat-box"><strong>6k</strong><span>Follower</span></div>
            <div className="stat-box"><strong>180</strong><span>Following</span></div>
            <div className="stat-box"><strong>20</strong><span>Badge</span></div>
            <div className="stat-box"><strong>16</strong><span>Lesson complete</span></div>
            <div className="stat-box"><strong>80</strong><span>Cooking recipe</span></div>
          </div>
        </header>

        <section className="showcase-section">
          <div className="showcase-controls">
            <div className="left-controls">
              <h2 className="showcase-title">Showcase</h2>
              <div className="toggle-group">
                <button className="active">All</button>
                <button>Select</button>
              </div>
            </div>
            <div className="right-controls">
              <button className="select-showcase-btn">Select Showcase</button>
              <button className="add-btn">+ Add</button>
            </div>
          </div>

          <div className="filter-tags">
            <span className="tag tag-all">All <span className="count">12</span></span>
            <span className="tag tag-green">Badge <span className="count">12</span></span>
            <span className="tag tag-red">Badge <span className="count">12</span></span>
            <span className="tag tag-orange">Badge <span className="count">12</span></span>
            <span className="tag tag-yellow">Badge <span className="count">12</span></span>
          </div>

          <div className="card-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card">
                <div className="card-image-area">
                  <span className="card-badge">Badge</span>
                </div>
                <div className="card-footer">Name</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}