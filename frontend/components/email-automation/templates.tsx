"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"
import { EmailTemplates } from '@/types'
import { useEffect, useCallback } from 'react'

interface TemplatesTabProps {
  emailTemplates: EmailTemplates
  setEmailTemplates: (templates: EmailTemplates) => void
}

export default function TemplatesTab({ emailTemplates, setEmailTemplates }: TemplatesTabProps) {
  // Handle saving email templates with debouncing
  const handleSaveTemplates = useCallback(async () => {
    try {
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
    }
  }, [emailTemplates])

  // Auto-save templates with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (emailTemplates.EN !== '') {  // Only save if English template exists
        handleSaveTemplates()
      }
    }, 500) // 500ms debounce time

    return () => clearTimeout(debounceTimer)
  }, [emailTemplates, handleSaveTemplates])

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
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="en_template">English Template (EN)</Label>
            <Textarea 
              id="en_template" 
              rows={5}
              value={emailTemplates.EN}
              onChange={(e) => setEmailTemplates({...emailTemplates, EN: e.target.value})}
              placeholder="Default English template. Hello [NAME]"
            />
          </div>
          <Separator />
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="es_template">Spanish Template (ES)</Label>
            <Textarea 
              id="es_template" 
              rows={5}
              value={emailTemplates.ES}
              onChange={(e) => setEmailTemplates({...emailTemplates, ES: e.target.value})}
              placeholder="Default Spanish template. Hola [NAME]"
            />
          </div>
          <Separator />
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="fr_template">French Template (FR)</Label>
            <Textarea 
              id="fr_template" 
              rows={5}
              value={emailTemplates.FR}
              onChange={(e) => setEmailTemplates({...emailTemplates, FR: e.target.value})}
              placeholder="Default French template. Bonjour [NAME]"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted-foreground">
          Templates are auto-saved when modified
        </div>
      </CardFooter>
    </Card>
  )
}