export interface SmtpConfig {
    smtp_host: string
    port: number
    username: string
    password: string
    use_ssl: boolean
  }
  
  export interface EmailTemplates {
    EN: string
    ES: string
    FR: string
    [key: string]: string
  }
  
  export interface CampaignSettings {
    subject: string
    pause_between_messages: number
    pause_between_blocks: number
    messages_per_block: number
    max_connections: number
    retries: number
  }
  
  export interface CampaignStatus {
    isRunning: boolean
    remaining: number
    status: string
  }