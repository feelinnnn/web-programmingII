"use client"

import "./all-lessons.css";
import Navbar from "../components/Navbar";
import Image from "next/image";
import { useEffect, useState } from "react";


type Lesson = string;

export default function AllLessons() {
  const lessons: Lesson[] = Array(64).fill("Lorem Ipsum");

  return (
    <div className="page">
      {/* Sidebar */}
      <Navbar />

      {/* Main Content */}
      <div className="main">
        {/* Top Bar */}
        <div className="topbar">
          <input
            type="text"
            placeholder="Search"
            id="search"
          />

          <div className="toggle">
            <span>Hide learned lesson</span>
            <div className="switch"></div>
          </div>

          <img src="/icon/filter.png" className="filter"/>
        </div>

        {/* Cards */}
        <div className="grid">
          {lessons.map((title: Lesson, i: number) => (
            <div className="card" key={i}>
              <div className="card-top"></div>
              <div className="card-bottom">
                <p>{title}</p>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}