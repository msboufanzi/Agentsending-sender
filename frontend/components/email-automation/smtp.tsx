"use client"

import { useState, useEffect, useRef } from "react"

// Extend the Window interface to include onOAuthCallback
declare global {
  interface Window {
    onOAuthCallback?: (success: boolean, email?: string, errorMsg?: string) => void;
  }
}
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail, Check, Save, SendHorizonal, Loader2, RefreshCw } from 'lucide-react'
import { SmtpConfig } from '@/types'
import { API_URL } from "@/lib/constants"
import { toast } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SmtpTabProps {
  smtpConfig: SmtpConfig
  setSmtpConfig: (config: SmtpConfig) => void
}

export default function SmtpTab({ smtpConfig, setSmtpConfig }: SmtpTabProps) {
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const [gmailUser, setGmailUser] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [activeTab, setActiveTab] = useState<"gmail" | "smtp">("gmail")
  const [showOAuthDialog, setShowOAuthDialog] = useState(false)
  const [oauthUrl, setOauthUrl] = useState("")
  const oauthWindowRef = useRef<Window | null>(null)
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  
  // Check if Gmail is connected on component mount
  useEffect(() => {
    checkGmailStatus()
  }, [])
  
  // Define a global callback function for the OAuth popup
  useEffect(() => {
    // Add a global function that the popup can call directly
    window.onOAuthCallback = (success: boolean, email?: string, errorMsg?: string) => {
      console.log("OAuth callback received via direct function call:", success, email, errorMsg);
      
      if (success && email) {
        handleOAuthSuccess(email);
      } else {
        handleOAuthError(errorMsg || "Authentication failed");
      }
    };
    
    // Listen for messages from the OAuth popup window
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event.data);
      
      // Accept messages from any origin for this demo
      if (event.data.type === 'oauth_callback') {
        if (event.data.success) {
          handleOAuthSuccess(event.data.email);
        } else {
          handleOAuthError(event.data.message || "Failed to connect to Gmail");
        }
      }
    }
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      // @ts-ignore
      window.onOAuthCallback = undefined;
    }
  }, []);
  
  const handleOAuthSuccess = (email: string) => {
    setIsGmailConnected(true);
    setGmailUser(email);
    setSmtpConfig({
      ...smtpConfig,
      use_gmail_oauth: true,
      gmail_user: email
    });
    setActiveTab("gmail");
    
    toast({
      title: "Success",
      description: `Connected to Gmail as ${email}`,
    });
    
    // Close the OAuth dialog
    setShowOAuthDialog(false);
    setIsConnecting(false);
  };
  
  const handleOAuthError = (errorMessage: string) => {
    setOauthError(errorMessage);
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    // Close the OAuth dialog
    setShowOAuthDialog(false);
    setIsConnecting(false);
  };
  
  const checkGmailStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/gmail-status?email=${smtpConfig.gmail_user || ''}`)
      const data = await response.json()
      
      if (data.connected) {
        setIsGmailConnected(true)
        setGmailUser(data.email)
        setSmtpConfig({
          ...smtpConfig,
          use_gmail_oauth: true,
          gmail_user: data.email
        })
        setActiveTab("gmail")
      }
    } catch (error) {
      console.error("Error checking Gmail status:", error)
    }
  }
  
  const handleConnectGmail = async () => {
    setIsConnecting(true)
    setOauthError(null)
    
    try {
      // Get the OAuth URL from the server
      const response = await fetch(`${API_URL}/get-oauth-url`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get OAuth URL")
      }
      
      const data = await response.json()
      
      if (data.url) {
        setOauthUrl(data.url)
        setShowOAuthDialog(true)
        
        // Open the OAuth URL in a popup window
        const width = 600
        const height = 700
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2
        
        oauthWindowRef.current = window.open(
          data.url,
          'OAuthPopup',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        )
        
        // Check if popup was blocked
        if (!oauthWindowRef.current || oauthWindowRef.current.closed) {
          toast({
            title: "Error",
            description: "Popup was blocked. Please allow popups for this site.",
            variant: "destructive",
          })
          setShowOAuthDialog(false)
          setIsConnecting(false)
        }
        
        // Set up an interval to check if the popup was closed
        const checkPopupClosed = setInterval(() => {
          if (oauthWindowRef.current && oauthWindowRef.current.closed) {
            clearInterval(checkPopupClosed)
            setShowOAuthDialog(false)
            setIsConnecting(false)
            
            // If we didn't get a callback message, show an error
            if (!isGmailConnected) {
              toast({
                title: "Warning",
                description: "OAuth window was closed. Please try again if you didn't complete the authentication.",
                variant: "destructive",
              })
            }
          }
        }, 1000)
      } else {
        throw new Error("Failed to get OAuth URL")
      }
    } catch (error) {
      console.error("Error getting OAuth URL:", error)
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
      setIsConnecting(false)
    }
  }
  
  const handleRetryOAuth = () => {
    setIsRetrying(true)
    handleConnectGmail()
    setIsRetrying(false)
  }
  
  const handleDisconnectGmail = async () => {
    try {
      // Call the server to revoke the token
      await fetch(`${API_URL}/revoke-oauth?email=${gmailUser}`, {
        method: 'POST'
      })
      
      setIsGmailConnected(false)
      setGmailUser("")
      setSmtpConfig({
        ...smtpConfig,
        use_gmail_oauth: false,
        gmail_user: ""
      })
      
      toast({
        title: "Disconnected",
        description: "Gmail account disconnected",
      })
    } catch (error) {
      console.error("Error disconnecting Gmail:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect Gmail account",
        variant: "destructive",
      })
    }
  }
  
  const handleTabChange = (value: string) => {
    if (value === "gmail") {
      setActiveTab("gmail")
      if (isGmailConnected) {
        setSmtpConfig({
          ...smtpConfig,
          use_gmail_oauth: true
        })
      }
    } else {
      setActiveTab("smtp")
      setSmtpConfig({
        ...smtpConfig,
        use_gmail_oauth: false
      })
    }
  }
  
  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      // Validate the configuration
      if (activeTab === "smtp") {
        if (!smtpConfig.smtp_host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password) {
          throw new Error("All SMTP fields are required")
        }
      } else if (activeTab === "gmail" && !isGmailConnected) {
        throw new Error("Please connect with Gmail first")
      }
      
      // Save the configuration to the server
      const response = await fetch(`${API_URL}/save-smtp-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...smtpConfig,
          use_gmail_oauth: activeTab === "gmail" && isGmailConnected
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to save configuration")
      }
      
      toast({
        title: "Success",
        description: "SMTP configuration saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleTestSender = () => {
    setTestEmailAddress("")
    setShowTestDialog(true)
  }
  
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }
    
    setIsTesting(true)
    try {
      // Validate the configuration
      if (activeTab === "smtp") {
        if (!smtpConfig.smtp_host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password) {
          throw new Error("All SMTP fields are required")
        }
      } else if (activeTab === "gmail" && !isGmailConnected) {
        throw new Error("Please connect with Gmail first")
      }
      
      // Send a test email
      const response = await fetch(`${API_URL}/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...smtpConfig,
          use_gmail_oauth: activeTab === "gmail" && isGmailConnected,
          test_email: testEmailAddress
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send test email")
      }
      
      toast({
        title: "Success",
        description: "Test email sent successfully",
      })
      
      setShowTestDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>
            Configure your SMTP server settings for sending emails or connect with Gmail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="gmail">Gmail</TabsTrigger>
              <TabsTrigger value="smtp">SMTP Server</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gmail" className="space-y-4">
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-2">Connect with Gmail</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Connect your Gmail account to send emails using Google's servers.
                </p>
                
                {isGmailConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                      <Check className="h-5 w-5" />
                      <span>Connected as <strong>{gmailUser}</strong></span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleDisconnectGmail}
                      className="w-full"
                    >
                      Disconnect Gmail
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleConnectGmail} 
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Connect with Gmail
                      </>
                    )}
                  </Button>
                )}
                
                {oauthError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{oauthError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryOAuth} 
                      disabled={isRetrying}
                      className="mt-2"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Retry Connection
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  Gmail OAuth is the recommended method for sending emails as it's more secure and doesn't require storing your password.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="smtp" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="smtp_host">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center">
                            SMTP Host
                            <AlertCircle className="ml-1 h-3 w-3 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The address of your email server (e.g., smtp.gmail.com)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input 
                    id="smtp_host" 
                    value={smtpConfig.smtp_host}
                    onChange={(e) => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})}
                    placeholder="e.g., smtp.gmail.com"
                  />
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="port">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center">
                            Port
                            <AlertCircle className="ml-1 h-3 w-3 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input 
                    id="port" 
                    type="number"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({...smtpConfig, port: Number(e.target.value)})}
                    placeholder="e.g., 587"
                  />
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center">
                            Username
                            <AlertCircle className="ml-1 h-3 w-3 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Usually your full email address</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input 
                    id="username" 
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig({...smtpConfig, username: e.target.value})}
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center">
                            Password
                            <AlertCircle className="ml-1 h-3 w-3 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>For Gmail, use an App Password instead of your regular password</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({...smtpConfig, password: e.target.value})}
                    placeholder="Your password or app password"
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
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  For Gmail, you may need to use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="underline">app password</a> instead of your regular password if not using OAuth.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button 
            onClick={handleSaveConfig} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleTestSender} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            <SendHorizonal className="mr-2 h-4 w-4" />
            Test Sender
          </Button>
        </CardFooter>
      </Card>
      
      {/* OAuth Dialog */}
      <Dialog open={showOAuthDialog} onOpenChange={setShowOAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with Gmail</DialogTitle>
            <DialogDescription>
              A popup window has been opened to connect your Gmail account. Please complete the authentication process in the popup.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowOAuthDialog(false)
                setIsConnecting(false)
                if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
                  oauthWindowRef.current.close()
                }
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter an email address to send a test email and verify your configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="test-email">Recipient Email</Label>
              <Input 
                id="test-email" 
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTestDialog(false)}
              disabled={isTesting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isTesting || !testEmailAddress}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizonal className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}