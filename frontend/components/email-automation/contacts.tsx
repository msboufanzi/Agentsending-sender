"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Upload, FileText, Plus, Trash, Save } from 'lucide-react'
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"

interface ContactsTabProps {
  setContactsUploaded: (uploaded: boolean) => void
  contactsUploaded: boolean
}

interface Contact {
  email: string
  name: string
  language: string
}

export default function ContactsTab({ setContactsUploaded, contactsUploaded }: ContactsTabProps) {
  const [contactsFile, setContactsFile] = useState<File | null>(null)
  const [totalContacts, setTotalContacts] = useState<number>(0)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Load contacts on component mount
  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_URL}/get-contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
        if (data.contacts && data.contacts.length > 0) {
          setContactsUploaded(true)
          setTotalContacts(data.contacts.length)
        }
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

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

    setIsLoading(true)
    const formData = new FormData()
    formData.append("file", contactsFile)

    try {
      const response = await fetch(`${API_URL}/upload-contacts`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setContactsUploaded(true)
        setTotalContacts(data.total || 0)
        
        // Refresh contacts list
        await fetchContacts()
        
        toast({
          title: "Success",
          description: `${data.total} contacts uploaded successfully`,
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContact = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    const newContact: Contact = {
      email: newEmail,
      name: "",
      language: "FR"
    }

    setContacts([...contacts, newContact])
    setNewEmail("")
  }

  const handleRemoveContact = (index: number) => {
    const updatedContacts = [...contacts]
    updatedContacts.splice(index, 1)
    setContacts(updatedContacts)
  }

  const handleUpdateContact = (index: number, field: keyof Contact, value: string) => {
    const updatedContacts = [...contacts]
    updatedContacts[index][field] = value
    setContacts(updatedContacts)
  }

  const handleSaveContacts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/save-contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contacts }),
      })

      if (response.ok) {
        const data = await response.json()
        setContactsUploaded(true)
        setTotalContacts(data.total || 0)
        
        toast({
          title: "Success",
          description: `${data.total} contacts saved successfully`,
        })
      } else {
        throw new Error("Failed to save contacts")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contacts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualInput(e.target.value)
  }

  const handleProcessManualInput = () => {
    if (!manualInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive",
      })
      return
    }

    const lines = manualInput.split('\n')
    const newContacts: Contact[] = []
    
    lines.forEach(line => {
      const email = line.trim()
      if (email && email.includes('@')) {
        newContacts.push({
          email,
          name: "",
          language: "FR"
        })
      }
    })

    if (newContacts.length === 0) {
      toast({
        title: "Error",
        description: "No valid email addresses found",
        variant: "destructive",
      })
      return
    }

    setContacts([...contacts, ...newContacts])
    setManualInput("")
    
    toast({
      title: "Success",
      description: `${newContacts.length} contacts added`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Contacts</CardTitle>
        <CardDescription>
          Upload a CSV/TXT file with your contacts or add them manually. Only email is required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-6">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="contacts">Contacts File (CSV or TXT)</Label>
            <div className="flex gap-2">
              <Input 
                id="contacts" 
                type="file" 
                accept=".csv,.txt" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setContactsFile(e.target.files[0])
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleContactsUpload}
                disabled={isLoading || !contactsFile}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              CSV Format Example
            </h3>
            <div className="bg-white p-2 rounded border text-xs font-mono">
              email,name,language<br />
              user@example.com,John Doe,EN<br />
              another@example.com,Jane Smith,ES<br />
              third@example.com,,FR<br />
              fourth@example.com
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Only the email column is required. Name and language are optional.
            </p>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Add Contacts Manually</h3>
            
            <div className="mb-4">
              <Label htmlFor="manual-input" className="mb-2 block">Paste multiple emails (one per line)</Label>
              <Textarea 
                id="manual-input"
                placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                value={manualInput}
                onChange={handleManualInputChange}
                rows={4}
                className="mb-2"
              />
              <Button 
                variant="outline" 
                onClick={handleProcessManualInput}
                disabled={!manualInput.trim()}
                size="sm"
              >
                Process Emails
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Add single email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddContact}
                disabled={!newEmail || !newEmail.includes('@')}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {contacts.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.slice(0, 10).map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={contact.email}
                          onChange={(e) => handleUpdateContact(index, 'email', e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={contact.name}
                          onChange={(e) => handleUpdateContact(index, 'name', e.target.value)}
                          className="h-8"
                          placeholder="(Optional)"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={contact.language}
                          onChange={(e) => handleUpdateContact(index, 'language', e.target.value)}
                          className="h-8 w-16"
                          placeholder="FR"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveContact(index)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {contacts.length > 10 && (
                <div className="p-2 text-center text-sm text-gray-500">
                  Showing 10 of {contacts.length} contacts
                </div>
              )}
            </div>
          )}
          
          {contacts.length > 0 && (
            <Button 
              onClick={handleSaveContacts}
              disabled={isLoading}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              Save {contacts.length} Contacts
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {contactsUploaded && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Contacts ready ({totalContacts} contacts)</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}