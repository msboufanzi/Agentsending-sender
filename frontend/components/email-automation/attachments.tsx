"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Upload, Paperclip, Trash } from 'lucide-react'
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"

interface AttachmentsTabProps {
  setAttachmentsUploaded: (uploaded: boolean) => void
  attachmentsUploaded: boolean
}

interface Attachment {
  filename: string
  size: number
}

export default function AttachmentsTab({ setAttachmentsUploaded, attachmentsUploaded }: AttachmentsTabProps) {
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load attachments on component mount
  useEffect(() => {
    fetchAttachments()
  }, [])

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`${API_URL}/get-attachments`)
      if (response.ok) {
        const data = await response.json()
        setUploadedAttachments(data.attachments || [])
        if (data.attachments && data.attachments.length > 0) {
          setAttachmentsUploaded(true)
        }
      }
    } catch (error) {
      console.error("Error fetching attachments:", error)
    }
  }

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

    setIsLoading(true)
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
      setAttachments([])
      await fetchAttachments()
      
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAttachment = async (filename: string) => {
    try {
      const response = await fetch(`${API_URL}/delete-attachment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
      })

      if (response.ok) {
        await fetchAttachments()
        toast({
          title: "Success",
          description: `${filename} deleted successfully`,
        })
      } else {
        throw new Error("Failed to delete attachment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
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
            <div className="flex gap-2">
              <Input 
                id="attachments" 
                type="file" 
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setAttachments(Array.from(e.target.files))
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleAttachmentUpload} 
                disabled={isLoading || attachments.length === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
          
          {attachments.length > 0 && (
            <div className="flex flex-col space-y-1.5">
              <Label>Selected Files</Label>
              <div className="border rounded-md p-2">
                <ul className="list-disc list-inside">
                  {Array.from(attachments).map((file, index) => (
                    <li key={index} className="text-sm py-1">
                      {file.name} ({formatFileSize(file.size)})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {uploadedAttachments.length > 0 && (
            <div className="flex flex-col space-y-1.5 mt-4">
              <Label>Uploaded Attachments</Label>
              <div className="border rounded-md divide-y">
                {uploadedAttachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2">
                    <div className="flex items-center">
                      <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{file.filename}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteAttachment(file.filename)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {attachmentsUploaded && uploadedAttachments.length > 0 && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>{uploadedAttachments.length} attachments ready</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}