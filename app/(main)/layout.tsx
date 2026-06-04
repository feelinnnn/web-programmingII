"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '../components/navbar/Navbar';
import { usePathname, useRouter } from 'next/navigation';

export default function MainGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: any = { "Content-Type": "application/vnd.api+json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/profile", { headers });
        if (res.ok) {
          const json = await res.json();
          const p = json.data.attributes;
          setProfile(p);

          // Admin lockdown logic
          if ((p.role === "admin" || p.email === "admin@cookcult.com") && !pathname.startsWith("/admin")) {
            router.push("/admin/panel");
          }
        }
      } catch (err) {}
    };
    fetchProfile();
  }, [pathname, router]);

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
          margin-left: 80px;
        }

        .navbar.expanded + .main-content-wrapper {
          margin-left: 280px;
        }

        .navbar.collapsed + .main-content-wrapper {
          margin-left: 80px;
        }

        @media (max-width: 768px) {
          .main-content-wrapper {
            margin-left: 80px !important;
            min-height: 100vh;
          }
        }
      `}</style>

    </div>
  );
}