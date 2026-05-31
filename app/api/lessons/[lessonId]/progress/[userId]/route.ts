import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Progress, { IProgress } from "@/models/Progress";
import Chapter from "@/models/Chapter";


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; userId: string }> }
) {
  try {
    await connect()  // ← fixed
    const { lessonId, userId } = await params

    const progress = await Progress.create({ userID: userId, lessonId })  // ← fixed

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      data: {
        id: progress._id,
        type: "progress",
        attributes: {
          userID: progress.userID,
          lessonId: progress.lessonId,
        },
        relationships: {
          completedChapters: {
            data: progress.completedChapter.map((id: string) => ({ id, type: "chapter" }))
          }
        }
      }
    }, { status: 201 })
  } catch (err: any) {
    console.log(err)
      if (err.code === 11000) {
      return NextResponse.json(
        { errors: [{ status: "409", title: "Conflict", detail: "Progress already exists for this user and lesson" }] },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; userId: string }> }
) {
  try {
    await connect()
    const { lessonId, userId } = await params

    const progress = await Progress.findOne({ userID: userId, lessonId })

    if (!progress) {
      return NextResponse.json(
        { errors: [{ status: "404", title: "Not Found", detail: "Progress not found" }] },
        { status: 404 }
      )
    }

    const nextOrder = progress.completedChapter.length + 1

    const nextChapter = await Chapter.findOne({ lessonId, order: nextOrder })

    if (!nextChapter) {
      return NextResponse.json(
        { errors: [{ status: "404", title: "Not Found", detail: "No more chapters to complete" }] },
        { status: 404 }
      )
    }

    progress.completedChapter.push(nextChapter._id)
    await progress.save()

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      data: {
        id: progress._id,
        type: "progress",
        attributes: {
          userID: progress.userID,
          lessonId: progress.lessonId,
        },
        relationships: {
          completedChapters: {
            data: progress.completedChapter.map((id: string) => ({ id, type: "chapter" }))
          }
        }
      }
    }, { status: 200 })

  } catch (err: any) {
    console.log(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; userId: string }> }  // ← type params as Promise
) {
  await connect()
    const { lessonId, userId } = await params


    const progress = await Progress.findOne({ userID: userId, lessonId })  // ← fixed

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: `/api/lessons/${lessonId}/progress/${userId}` },
    data: {
      id: progress._id,
      type: "progress",
      attributes: {
        userID: progress.userID,
        lessonId: progress.lessonId,
        completedChapter:   progress.completedChapter,
      },
      // relationships: {
      //   lesson: {
      //     links: { related: `/api/lessons/${chapter.lessonId}` },
      //     data: {id : chapter.lessonId , type:"lesson"}
      //   }
      // }
    }
  })
}