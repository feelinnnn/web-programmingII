"use client"

import Image from "next/image";
import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { GetUserid } from "@/lib/useauth";


export default function Home() {
//       useEffect(() => {
//         const createProgress = async () => {
//           const response = await fetch("/api/lessons/lesson001/progress/105256076861365261411", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/vnd.api+json"
//             },
//           })
//           const data = await response.json()
//           console.log(data)
//         }

//         createProgress()
// }, [])
// useEffect(() => {
//         const createProgress = async () => {
//           const response = await fetch("/api/lessons/lesson001/progress/105256076861365261411", {
//             method: "PATCH",
//             headers: {
//               "Content-Type": "application/vnd.api+json"
//             },
//           })
//           const data = await response.json()
//           console.log(data)
//         }

//         createProgress()
// }, [])
// useEffect(() => {
//         const createProgress = async () => {
//           const response = await fetch("/api/lessons/continue/105256076861365261411", {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/vnd.api+json"
//             },
//           })
//           const data = await response.json()
//           console.log(data)
//         }

//         createProgress()
// }, [])
// useEffect(() => {
//   const test = async () => {
//     const response = await fetch("/api/user-badges", {
//       method: "POST",
//       headers: { "Content-Type": "application/vnd.api+json" },
//       body: JSON.stringify({
//         data: {
//           type: "user-badge",
//           attributes: {
//             userId: "testUser123",
//             badgeId: "badge003",        // lesson type badge to test auto-verify
//             badgeTypeSnapshot: "evidence-backed",
//             userNote: "test note",
//             evidenceUrls: []
//           }
//         }
//       })
//     })
//     const data = await response.json()
//     console.log(data)
//   }

//   test()
// }, [])
  return <h1>Hello World 🔥</h1>
}
