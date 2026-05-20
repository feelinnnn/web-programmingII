"use client"

import Image from "next/image";
import { useEffect, useState } from "react";


export default function Home() {
   useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => console.log(data));

    console.log("test");
  }, []);  

  return <h1>Hello World 🔥</h1>
}
