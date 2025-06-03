"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadImageToCloudinary } from "@/lib/firebase"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"

export default function CloudinaryTest() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError("")
      setUploadedUrl("")
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError("")

    try {
      console.log("🧪 Testing upload with file:", file.name)
      const url = await uploadImageToCloudinary(file)
      setUploadedUrl(url)
      console.log("✅ Upload successful:", url)
    } catch (err) {
      console.error("❌ Upload failed:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Cloudinary Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        </div>

        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          {uploading ? "Uploading..." : "Test Upload"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {uploadedUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Upload successful!
            </div>
            <img
              src={uploadedUrl || "/placeholder.svg"}
              alt="Uploaded"
              className="w-full h-32 object-cover rounded border"
            />
            <p className="text-xs text-gray-500 break-all">{uploadedUrl}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Cloud Name:</strong> dxlry29hz
          </p>
          <p>
            <strong>Upload Preset:</strong> innovacart
          </p>
          <p>
            <strong>Status:</strong> {uploadedUrl ? "✅ Working" : "⏳ Not tested"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
