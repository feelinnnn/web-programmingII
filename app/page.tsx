"use client"

import Image from "next/image";
import { useEffect, useState } from "react";


export default function Home() {
      useEffect(() => {
        const createProgress = async () => {
          const response = await fetch("/api/lessons/lesson001/progress/105256076861365261411", {
            method: "POST",
            headers: {
              "Content-Type": "application/vnd.api+json"
            },
          })
          const data = await response.json()
          console.log(data)
        }

        createProgress()
}, [])
useEffect(() => {
        const createProgress = async () => {
          const response = await fetch("/api/lessons/lesson001/progress/105256076861365261411", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/vnd.api+json"
            },
          })
          const data = await response.json()
          console.log(data)
        }

        createProgress()
}, [])
useEffect(() => {
        const createProgress = async () => {
          const response = await fetch("/api/lessons/continue/105256076861365261411", {
            method: "GET",
            headers: {
              "Content-Type": "application/vnd.api+json"
            },
          })
          const data = await response.json()
          console.log(data)
        }

        createProgress()
}, [])
  return <h1>Hello World 🔥</h1>
}
