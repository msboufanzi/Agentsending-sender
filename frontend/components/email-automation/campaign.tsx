"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect } from 'react'
import { Send } from 'lucide-react'
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"
import { CampaignSettings, SmtpConfig, CampaignStatus } from '@/types'

interface CampaignTabProps {
  campaignSettings: CampaignSettings
  setCampaignSettings: (settings: CampaignSettings) => void
  contactsUploaded: boolean
  smtpConfig: SmtpConfig
  campaignStatus: CampaignStatus
  pollCampaignStatus: () => Promise<void>
  setCampaignStatus: (status: CampaignStatus) => void
}

export default function CampaignTab({ 
  campaignSettings, 
  setCampaignSettings,
  contactsUploaded,
  smtpConfig,
  campaignStatus,
  pollCampaignStatus,
  setCampaignStatus
}: CampaignTabProps) {
  // Status polling effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (campaignStatus.isRunning) {
      intervalId = setInterval(pollCampaignStatus, 2000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [campaignStatus.isRunning])

  // Start email campaign
  const startCampaign = async () => {
    if (!contactsUploaded) {
      toast({
        title: "Error",
        description: "Please upload contacts first",
        variant: "destructive",
      })
      return
    }

    if (smtpConfig.username === "" || smtpConfig.password === "") {
      toast({
        title: "Error",
        description: "SMTP credentials are required",
        variant: "destructive",
      })
      return
    }

    if (campaignSettings.subject === "") {
      toast({
        title: "Error",
        description: "Email subject is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_URL}/send-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...smtpConfig,
          ...campaignSettings,
        }),
      })

      if (response.ok) {
        setCampaignStatus({
          isRunning: true,
          remaining: 0,
          status: "running",
        })
        
        // Start polling for status
        pollCampaignStatus()
        
        toast({
          title: "Success",
          description: "Email campaign started successfully",
        })
      } else {
        throw new Error("Failed to start campaign")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start email campaign",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Settings</CardTitle>
        <CardDescription>
          Configure your email campaign settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="subject">Email Subject</Label>
            <Input 
              id="subject" 
              value={campaignSettings.subject}
              onChange={(e) => setCampaignSettings({...campaignSettings, subject: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="pause_between_messages">Pause Between Messages (seconds)</Label>
              <Input 
                id="pause_between_messages" 
                type="number"
                value={campaignSettings.pause_between_messages}
                onChange={(e) => setCampaignSettings({...campaignSettings, pause_between_messages: Number(e.target.value)})}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="pause_between_blocks">Pause Between Blocks (seconds)</Label>
              <Input 
                id="pause_between_blocks" 
                type="number"
                value={campaignSettings.pause_between_blocks}
                onChange={(e) => setCampaignSettings({...campaignSettings, pause_between_blocks: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="messages_per_block">Messages Per Block</Label>
              <Input 
                id="messages_per_block" 
                type="number"
                value={campaignSettings.messages_per_block}
                onChange={(e) => setCampaignSettings({...campaignSettings, messages_per_block: Number(e.target.value)})}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="max_connections">Max Connections</Label>
              <Input 
                id="max_connections" 
                type="number"
                value={campaignSettings.max_connections}
                onChange={(e) => setCampaignSettings({...campaignSettings, max_connections: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="retries">Retries</Label>
            <Input 
              id="retries" 
              type="number"
              value={campaignSettings.retries}
              onChange={(e) => setCampaignSettings({...campaignSettings, retries: Number(e.target.value)})}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={startCampaign} 
          disabled={campaignStatus.isRunning}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          Start Email Campaign
        </Button>
      </CardFooter>
    </Card>
  )
}