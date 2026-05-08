"use client"; 
import { useState } from 'react';
import './Navbar.css'; 

export default function Navbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <nav className={`navbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="logo-container">
        {isExpanded ? (
          <img src="/logo/cookcult-logo.png" alt="Logo" className="logo-full" />
        ) : (
          <p className='logo-c'>C</p>
        )}
        <img src="/picture-navbar/hidemenu.png" alt="Toggle Menu" className="hidemenu"onClick={() => setIsExpanded(!isExpanded)} />
      </div>
      {isExpanded && <div className="line"></div>}
      <div className="menu-items">
        <div className="menu-item">
          <img src="/picture-navbar/home.png" alt="Home" className="pic" />
          {isExpanded && <span className="menu-text">Home</span>}
        </div>
        <div className="menu-item">
          <img src="/picture-navbar/lesson.png" alt="Lessons" className="pic" />
          {isExpanded && <span className="menu-text">Lessons</span>}
        </div>
        <div className="menu-item">
          <img src="/picture-navbar/history.png" alt="History" className="pic" />
          {isExpanded && <span className="menu-text">History</span>}
        </div>
        <div className="menu-item">
          <img src="/picture-navbar/bookmark.png" alt="Bookmark" className="pic" />
          {isExpanded && <span className="menu-text">Bookmark</span>}
        </div>
      </div>
      <div className="profile-bottom">
        <img src="/avatar/Avatar.png" alt="Profile" className="profile-pic-bottom" />
        {isExpanded && <span className="profile-name">Sense Seeya</span>}
      </div>
    </nav>
  );
}