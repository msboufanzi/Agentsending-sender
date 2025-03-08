"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Upload } from 'lucide-react'
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"

interface AttachmentsTabProps {
  setAttachmentsUploaded: (uploaded: boolean) => void
  attachmentsUploaded: boolean
}

export default function AttachmentsTab({ setAttachmentsUploaded, attachmentsUploaded }: AttachmentsTabProps) {
  const [attachments, setAttachments] = useState<File[]>([])

  // Handle attachment upload
  const handleAttachmentUpload = async () => {
    if (attachments.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one attachment",
        variant: "destructive",
      })
      return
    }

    try {
      for (const file of attachments) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`${API_URL}/upload-attachment`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }

      setAttachmentsUploaded(true)
      toast({
        title: "Success",
        description: "Attachments uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Attachments</CardTitle>
        <CardDescription>
          Upload files to attach to your emails.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="attachments">Select Files</Label>
            <Input 
              id="attachments" 
              type="file" 
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setAttachments(Array.from(e.target.files))
                  setAttachmentsUploaded(false)
                }
              }}
            />
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-col space-y-1.5">
              <Label>Selected Files</Label>
              <div className="border rounded-md p-2">
                <ul className="list-disc list-inside">
                  {Array.from(attachments).map((file, index) => (
                    <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {attachmentsUploaded && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Attachments uploaded</span>
            </div>
          )}
        </div>
        <Button onClick={handleAttachmentUpload} disabled={attachments.length === 0}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Attachments
        </Button>
      </CardFooter>
    </Card>
  )
}