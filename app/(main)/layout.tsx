"use client";

import React from 'react';
import Navbar from '../components/Navbar';

export default function MainGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFF2D7' }}>
      
      <Navbar />
      <div className="main-content-wrapper">
        {children}
      </div>

      <style jsx global>{`
        .main-content-wrapper {
          flex-grow: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s ease;
          /* ตั้งค่าเริ่มต้นเผื่อไว้ */
          margin-left: 80px; 
        }

        .navbar.expanded + .main-content-wrapper {
          margin-left: 280px;
        }

        .navbar.collapsed + .main-content-wrapper {
          margin-left: 80px;
        }
      `}</style>

    </div>
  );
}