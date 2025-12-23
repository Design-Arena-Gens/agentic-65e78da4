'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'

type CallState = 'idle' | 'ringing' | 'connected' | 'speaking' | 'listening' | 'ended'

interface Message {
  id: number
  text: string
  isAgent: boolean
  timestamp: Date
}

const agentResponses = [
  "Hello! I'm your AI agent. How can I assist you today?",
  "I understand. Let me think about that for a moment...",
  "That's a great question! Based on my analysis, I would recommend...",
  "I'm here to help you with anything you need. Feel free to ask me anything!",
  "Processing your request... I've found some interesting information for you.",
  "Is there anything else you'd like to know? I'm always happy to help!",
  "I've analyzed the data and here's what I found...",
  "Thank you for sharing that with me. Here's my perspective...",
]

export default function Home() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callState === 'connected' || callState === 'speaking' || callState === 'listening') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const playTone = (frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  const handleCall = async () => {
    if (callState === 'idle' || callState === 'ended') {
      setCallState('ringing')
      setCallDuration(0)
      setMessages([])
      
      // Play ringing tone
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playTone(440, 0.3), i * 600)
        setTimeout(() => playTone(480, 0.3), i * 600 + 300)
      }
      
      // Simulate connection after ringing
      setTimeout(() => {
        setCallState('connected')
        playTone(880, 0.1)
        
        // Agent greets
        setTimeout(() => {
          addAgentMessage("Hello! I'm your AI agent calling you. How can I assist you today?")
        }, 500)
      }, 2000)
    }
  }

  const handleEndCall = () => {
    setCallState('ended')
    playTone(220, 0.5)
    addAgentMessage("Thank you for speaking with me. Goodbye!")
  }

  const addAgentMessage = (text: string) => {
    setIsAgentTyping(true)
    setTimeout(() => {
      setIsAgentTyping(false)
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        isAgent: true,
        timestamp: new Date()
      }])
    }, 1500)
  }

  const handleSendMessage = () => {
    if (!currentMessage.trim() || callState === 'idle' || callState === 'ringing' || callState === 'ended') return
    
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: currentMessage,
      isAgent: false,
      timestamp: new Date()
    }])
    setCurrentMessage('')
    setCallState('listening')
    
    // Simulate agent response
    setTimeout(() => {
      setCallState('speaking')
      const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)]
      addAgentMessage(randomResponse)
      setTimeout(() => setCallState('connected'), 2000)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.agentAvatar}>
            <div className={styles.avatarInner}>
              <span className={styles.avatarIcon}>🤖</span>
            </div>
            {(callState === 'connected' || callState === 'speaking' || callState === 'listening') && (
              <div className={styles.statusDot} />
            )}
          </div>
          <div className={styles.agentInfo}>
            <h1 className={styles.agentName}>AI Agent</h1>
            <p className={styles.agentStatus}>
              {callState === 'idle' && 'Ready to call'}
              {callState === 'ringing' && 'Calling...'}
              {callState === 'connected' && 'Connected'}
              {callState === 'speaking' && 'Agent is speaking...'}
              {callState === 'listening' && 'Listening to you...'}
              {callState === 'ended' && 'Call ended'}
            </p>
          </div>
          {(callState === 'connected' || callState === 'speaking' || callState === 'listening') && (
            <div className={styles.duration}>{formatDuration(callDuration)}</div>
          )}
        </div>

        {/* Call Area */}
        <div className={styles.callArea}>
          {callState === 'idle' && (
            <div className={styles.idleState}>
              <div className={styles.phoneIcon}>📞</div>
              <h2>AI Agent Ready</h2>
              <p>Click the button below to have the AI agent call you</p>
            </div>
          )}

          {callState === 'ringing' && (
            <div className={styles.ringingState}>
              <div className={styles.ringingIcon}>📱</div>
              <h2>Connecting to Agent...</h2>
              <div className={styles.ringingPulse}>
                <div className={styles.pulseRing} />
                <div className={styles.pulseRing} />
                <div className={styles.pulseRing} />
              </div>
            </div>
          )}

          {(callState === 'connected' || callState === 'speaking' || callState === 'listening') && (
            <div className={styles.connectedState}>
              {/* Waveform visualization */}
              <div className={styles.waveform}>
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`${styles.waveBar} ${callState === 'speaking' ? styles.active : ''}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>

              {/* Messages */}
              <div className={styles.messagesContainer}>
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`${styles.message} ${msg.isAgent ? styles.agentMessage : styles.userMessage}`}
                  >
                    <div className={styles.messageContent}>
                      {msg.isAgent && <span className={styles.messageIcon}>🤖</span>}
                      <p>{msg.text}</p>
                      {!msg.isAgent && <span className={styles.messageIcon}>👤</span>}
                    </div>
                    <span className={styles.messageTime}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {isAgentTyping && (
                  <div className={`${styles.message} ${styles.agentMessage}`}>
                    <div className={styles.typingIndicator}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className={styles.input}
                />
                <button 
                  onClick={handleSendMessage}
                  className={styles.sendButton}
                  disabled={!currentMessage.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {callState === 'ended' && (
            <div className={styles.endedState}>
              <div className={styles.endedIcon}>✅</div>
              <h2>Call Ended</h2>
              <p>Duration: {formatDuration(callDuration)}</p>
              <p className={styles.endedSubtext}>Thank you for using AI Agent</p>
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className={styles.controls}>
          {(callState === 'idle' || callState === 'ended') ? (
            <button onClick={handleCall} className={styles.callButton}>
              <span className={styles.callIcon}>📞</span>
              <span>Start Call</span>
            </button>
          ) : callState === 'ringing' ? (
            <button onClick={handleEndCall} className={styles.endCallButton}>
              <span className={styles.callIcon}>❌</span>
              <span>Cancel</span>
            </button>
          ) : (
            <button onClick={handleEndCall} className={styles.endCallButton}>
              <span className={styles.callIcon}>📵</span>
              <span>End Call</span>
            </button>
          )}
        </div>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🎯</span>
            <span>Smart Responses</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>⚡</span>
            <span>Real-time Chat</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔒</span>
            <span>Secure Connection</span>
          </div>
        </div>
      </div>
    </main>
  )
}
