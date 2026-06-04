import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(base64, {
        folder: 'evidence',
        resource_type: 'auto', 
        })
        console.log("file type:", file.type, "file size:", file.size);

    return NextResponse.json({ url: result.secure_url })
  } catch (err: any) {
    console.log("Cloudinary error:", err.message, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}