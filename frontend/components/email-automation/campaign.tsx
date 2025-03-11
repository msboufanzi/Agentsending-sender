"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, RefreshCw, CheckCircle } from 'lucide-react'
import { toast } from "@/lib/utils"
import { API_URL } from "@/lib/constants"
import { CampaignSettings, SmtpConfig, CampaignStatus } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false)
  
  // Poll campaign status
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    
    if (campaignStatus.isRunning) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/campaign-status`)
          const data = await response.json()
          
          setCampaignStatus({
            isRunning: data.isRunning,
            remaining: data.remaining,
            status: data.status,
            completed: data.completed
          })
          
          // Show completion dialog when campaign finishes
          if (data.completed && !isCompletionDialogOpen) {
            setIsCompletionDialogOpen(true)
          }
          
          if (!data.isRunning) {
            clearInterval(intervalId)
          }
        } catch (error) {
          console.error("Error polling campaign status:", error)
        }
      }, 2000)
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

    if (!smtpConfig.use_gmail_oauth && (smtpConfig.username === "" || smtpConfig.password === "")) {
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
          completed: false
        })
        
        // Start polling for status
        pollCampaignStatus()
        
        toast({
          title: "Success",
          description: "Email campaign started successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to start campaign")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    }
  }
  
  // Reset campaign to start a new one
  const resetCampaign = async () => {
    try {
      const response = await fetch(`${API_URL}/reset-campaign`, {
        method: "POST",
      })
      
      if (response.ok) {
        setCampaignStatus({
          isRunning: false,
          remaining: 0,
          status: "idle",
          completed: false
        })
        
        setIsCompletionDialogOpen(false)
        
        toast({
          title: "Success",
          description: "Campaign reset successfully",
        })
      }
    } catch (error) {
      console.error("Error resetting campaign:", error)
    }
  }

  return (
    <>
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
            {campaignStatus.isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending Emails ({campaignStatus.remaining} remaining)
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Start Email Campaign
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Campaign Completion Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Campaign Completed
            </DialogTitle>
            <DialogDescription>
              Your email campaign has been completed successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>All emails have been sent. You can now start a new campaign or make changes to your settings.</p>
            {campaignStatus.errors && campaignStatus.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="font-medium text-red-800">There were some errors:</p>
                <ul className="list-disc list-inside mt-2 text-sm text-red-700">
                  {campaignStatus.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={resetCampaign}>Start New Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}