"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, Mail, Paperclip, Settings } from 'lucide-react'

import ContactsTab from './contacts'
import SmtpTab from './smtp'
import TemplatesTab from './templates'
import AttachmentsTab from './attachments'
import CampaignTab from './campaign'

import { API_URL } from '@/lib/constants'
import { CampaignStatus, SmtpConfig, EmailTemplates, CampaignSettings } from '@/types'

export default function EmailAutomation() {
  // State for contacts file
  const [contactsUploaded, setContactsUploaded] = useState(false)
  
  // State for attachments
  const [attachmentsUploaded, setAttachmentsUploaded] = useState(false)
  
  // State for SMTP configuration
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    smtp_host: "smtp.gmail.com",
    port: 587,
    username: "",
    password: "",
    use_ssl: false,
    use_gmail_oauth: false,
    gmail_user: ""
  })
  
  // State for email templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplates>({
    EN: "Hello [NAME],\n\nThis is your English email template.",
    ES: "Hola [NAME],\n\nEsta es tu plantilla de correo en español.",
    FR: "Bonjour [NAME],\n\nVoici votre modèle d'email en français.",
  })
  
  // State for campaign settings
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings>({
    subject: "",
    pause_between_messages: 5,
    pause_between_blocks: 30,
    messages_per_block: 100,
    max_connections: 5,
    retries: 1,
  })
  
  // State for campaign status
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>({
    isRunning: false,
    remaining: 0,
    status: "idle",
    completed: false,
    errors: []
  })

  // Poll campaign status
  const pollCampaignStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/campaign-status`)
      const data = await response.json()
      
      setCampaignStatus({
        isRunning: data.isRunning,
        remaining: data.remaining,
        status: data.status,
        completed: data.completed,
        errors: data.errors
      })
    } catch (error) {
      console.error("Error polling campaign status:", error)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Automation</h1>
            <p className="text-muted-foreground">
              Send personalized emails to your contacts with attachments
            </p>
          </div>
          {campaignStatus.isRunning && (
            <Badge variant="outline" className="px-3 py-1">
              Campaign Running - {campaignStatus.remaining} emails remaining
            </Badge>
          )}
        </div>

        <Tabs defaultValue="contacts">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="contacts">
              <FileText className="mr-2 h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="smtp">
              <Mail className="mr-2 h-4 w-4" />
              SMTP
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="mr-2 h-4 w-4" />
              Attachments
            </TabsTrigger>
            <TabsTrigger value="campaign">
              <Settings className="mr-2 h-4 w-4" />
              Campaign
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <ContactsTab 
              setContactsUploaded={setContactsUploaded} 
              contactsUploaded={contactsUploaded} 
            />
          </TabsContent>

          <TabsContent value="smtp">
            <SmtpTab 
              smtpConfig={smtpConfig} 
              setSmtpConfig={setSmtpConfig} 
            />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesTab 
              emailTemplates={emailTemplates} 
              setEmailTemplates={setEmailTemplates} 
            />
          </TabsContent>

          <TabsContent value="attachments">
            <AttachmentsTab 
              setAttachmentsUploaded={setAttachmentsUploaded} 
              attachmentsUploaded={attachmentsUploaded} 
            />
          </TabsContent>

          <TabsContent value="campaign">
            <CampaignTab 
              campaignSettings={campaignSettings} 
              setCampaignSettings={setCampaignSettings}
              contactsUploaded={contactsUploaded}
              smtpConfig={smtpConfig}
              campaignStatus={campaignStatus}
              pollCampaignStatus={pollCampaignStatus}
              setCampaignStatus={setCampaignStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}