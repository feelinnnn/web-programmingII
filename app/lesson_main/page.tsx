// app/page.tsx
"use client";

import "./lesson_main.css";
import Navbar from "../components/Navbar";

const lessons = Array.from({ length: 12 });

function LessonCard({ large = false }: { large?: boolean }) {
  return (
    <div className={`lesson-card ${large ? "large" : ""}`}>
      <div className="card-image" />

      <div className="card-content">
        <h3>Lorem Ipsum</h3>

        {large && (
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Suspendisse ac nunc ex.
          </p>
        )}

        <div className="arrow">→</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="page">
      {/* Sidebar */}
      <Navbar></Navbar>

      {/* Main */}
      <main className="main-content">
        {/* Latest */}
        <section className="section">
          <h2 className="script-title">Latest lesson</h2>
          <p className="subtitle">Freshly made</p>

          <div className="horizontal-scroll">
            <LessonCard large />
            <LessonCard large />
            <LessonCard large />
          </div>
        </section>

        {/* Continue */}
        <section className="section">
          <h2 className="script-title">Continue</h2>

          <div className="horizontal-scroll small-cards">
            <LessonCard />
            <LessonCard />
            <LessonCard />
            <LessonCard />
            <LessonCard />
          </div>
        </section>

        {/* All lessons */}
        <section className="section">
          <h2 className="normal-title">All lessons</h2>

          <div className="lesson-grid">
            {lessons.map((_, index) => (
              <LessonCard key={index} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <button className="lang-btn">ดูหลักสูตรทั้งหมด</button>

          <div className="footer-line" />
        </footer>
      </main>
    </div>
  );
}