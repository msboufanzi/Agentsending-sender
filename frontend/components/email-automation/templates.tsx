"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash, Save } from 'lucide-react'
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"
import { EmailTemplates } from '@/types'

interface TemplatesTabProps {
  emailTemplates: EmailTemplates
  setEmailTemplates: (templates: EmailTemplates) => void
}

export default function TemplatesTab({ emailTemplates, setEmailTemplates }: TemplatesTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [newLanguageCode, setNewLanguageCode] = useState("")
  
  // Load templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])
  
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/get-templates`)
      if (response.ok) {
        const data = await response.json()
        if (data.templates && Object.keys(data.templates).length > 0) {
          setEmailTemplates(data.templates)
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  // Handle saving email templates
  const handleSaveTemplates = async () => {
    setIsLoading(true)
    try {
      // Ensure at least one template exists
      if (Object.keys(emailTemplates).length === 0) {
        toast({
          title: "Error",
          description: "At least one template is required",
          variant: "destructive",
        })
        return
      }
      
      const response = await fetch(`${API_URL}/save-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailTemplates),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email templates saved successfully",
        })
      } else {
        throw new Error("Failed to save templates")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email templates",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleUpdateTemplate = (language: string, content: string) => {
    setEmailTemplates({
      ...emailTemplates,
      [language]: content
    })
  }
  
  const handleDeleteTemplate = (language: string) => {
    const updatedTemplates = { ...emailTemplates }
    delete updatedTemplates[language]
    setEmailTemplates(updatedTemplates)
  }
  
  const handleAddTemplate = () => {
    if (!newLanguageCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a language code",
        variant: "destructive",
      })
      return
    }
    
    const languageCode = newLanguageCode.trim().toUpperCase()
    
    if (emailTemplates[languageCode]) {
      toast({
        title: "Error",
        description: `Template for ${languageCode} already exists`,
        variant: "destructive",
      })
      return
    }
    
    setEmailTemplates({
      ...emailTemplates,
      [languageCode]: `Hello [NAME],\n\nThis is your ${languageCode} email template.`
    })
    
    setNewLanguageCode("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
        <CardDescription>
          Create email templates for different languages. Use [NAME] as a placeholder for the recipient's name.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          {Object.keys(emailTemplates).map((language, index) => (
            <div key={language} className="space-y-2">
              {index > 0 && <Separator className="my-4" />}
              
              <div className="flex items-center justify-between">
                <Label htmlFor={`${language.toLowerCase()}_template`} className="text-base font-medium">
                  {language} Template
                </Label>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteTemplate(language)}
                  disabled={Object.keys(emailTemplates).length <= 1}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              
              <Textarea 
                id={`${language.toLowerCase()}_template`} 
                rows={6}
                value={emailTemplates[language]}
                onChange={(e) => handleUpdateTemplate(language, e.target.value)}
                placeholder={`Enter your ${language} template here. Use [NAME] for recipient's name.`}
              />
            </div>
          ))}
          
          <div className="border-t pt-4 mt-2">
            <Label className="mb-2 block">Add New Template</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Language code (e.g., EN, FR, ES)"
                value={newLanguageCode}
                onChange={(e) => setNewLanguageCode(e.target.value)}
                className="flex-1"
                maxLength={5}
              />
              <Button 
                onClick={handleAddTemplate}
                disabled={!newLanguageCode.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveTemplates} 
          disabled={isLoading || Object.keys(emailTemplates).length === 0}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Templates
        </Button>
      </CardFooter>
    </Card>
  )
}