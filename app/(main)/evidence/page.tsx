"use client";

import { useState } from "react";
import EvidenceModal from "../../components/EvidenceModal";
import "./evidence.css";

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container">

      <div className="content">
        <h2 className="text-3xl font-bold mb-6">
            Detail
          </h2>

          <ul className="list-disc pl-6 space-y-2 mb-6 text-lg">
            <li>evidence 1</li>
            <li>evidence 2</li>
            <li>evidence 3</li>
          </ul>

          <p className="text-base leading-7 mb-8">
            Mauris vulputate ultrices nisi, ut scelerisque felis ornare eu...
          </p>
        <button className="add-btn" onClick={() => setOpen(true)}>
          Add file
        </button>
      </div>

      <EvidenceModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
}

