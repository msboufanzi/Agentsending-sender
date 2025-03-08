"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Upload } from 'lucide-react'
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"

interface ContactsTabProps {
  setContactsUploaded: (uploaded: boolean) => void
  contactsUploaded: boolean
}

export default function ContactsTab({ setContactsUploaded, contactsUploaded }: ContactsTabProps) {
  const [contactsFile, setContactsFile] = useState<File | null>(null)

  // Handle contacts file upload
  const handleContactsUpload = async () => {
    if (!contactsFile) {
      toast({
        title: "Error",
        description: "Please select a contacts file first",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("file", contactsFile)

    try {
      const response = await fetch(`${API_URL}/upload-contacts`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setContactsUploaded(true)
        toast({
          title: "Success",
          description: "Contacts uploaded successfully",
        })
      } else {
        throw new Error("Failed to upload contacts")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload contacts file",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Contacts</CardTitle>
        <CardDescription>
          Upload a CSV file with your contacts. The file should have columns for email, name, and language (optional).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="contacts">Contacts CSV File</Label>
            <Input 
              id="contacts" 
              type="file" 
              accept=".csv" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setContactsFile(e.target.files[0])
                  setContactsUploaded(false)
                }
              }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {contactsUploaded && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Contacts uploaded</span>
            </div>
          )}
        </div>
        <Button onClick={handleContactsUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Contacts
        </Button>
      </CardFooter>
    </Card>
  )
}