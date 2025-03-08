"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { SmtpConfig } from '@/types'

interface SmtpTabProps {
  smtpConfig: SmtpConfig
  setSmtpConfig: (config: SmtpConfig) => void
}

export default function SmtpTab({ smtpConfig, setSmtpConfig }: SmtpTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Configuration</CardTitle>
        <CardDescription>
          Configure your SMTP server settings for sending emails.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input 
              id="smtp_host" 
              value={smtpConfig.smtp_host}
              onChange={(e) => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})}
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="port">Port</Label>
            <Input 
              id="port" 
              type="number"
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig({...smtpConfig, port: Number(e.target.value)})}
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              value={smtpConfig.username}
              onChange={(e) => setSmtpConfig({...smtpConfig, username: e.target.value})}
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={smtpConfig.password}
              onChange={(e) => setSmtpConfig({...smtpConfig, password: e.target.value})}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="use_ssl" 
              checked={smtpConfig.use_ssl}
              onCheckedChange={(checked) => setSmtpConfig({...smtpConfig, use_ssl: checked})}
            />
            <Label htmlFor="use_ssl">Use SSL</Label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            For Gmail, you may need to use an app password instead of your regular password.
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  )
}