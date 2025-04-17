import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send, AlertTriangle, Loader2, RotateCw } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { streamResponseFromLLM } from "@/services/llmService";
import { ChatMessage, ContextualData } from "@/types";

interface ChatbotProps {
  contextData?: ContextualData;
}

// Define the initial welcome message
const initialWelcomeMessage: ChatMessage = {
  id: uuidv4(),
  role: 'assistant',
  content: "Hello! I'm your CNC Insight Navigator assistant. What would you like to know today?",
  timestamp: new Date()
};

const Chatbot = ({ contextData }: ChatbotProps) => {
  // Initialize messages with the welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [llmStatus, setLlmStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize LLM (Keep only LLM status logic, welcome message is now handled by state initialization)
  useEffect(() => {
    const loadLLM = async () => {
      try {
        const success = true; // Replace with actual LLM init check if available
        setLlmStatus(success ? 'ready' : 'error');
        // Welcome message is now added via initial state
      } catch (error) {
        console.error("Failed to initialize LLM:", error);
        setLlmStatus('error');
      }
    };
    
    loadLLM();
  }, []);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };
    
    // Get current messages + new user message for the API call
    const messagesForApi = [...messages, userMessage];
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);
    
    // Create a placeholder for the assistant response
    const assistantMessageId = uuidv4();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Stream the response using the history *up to the point before the assistant placeholder*
    await streamResponseFromLLM(
      messagesForApi, // Pass the history including the latest user message
      contextData,
      (text, done) => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId
            ? { ...msg, content: msg.content + text }
            : msg
        ));
        
        if (done) {
          setIsTyping(false);
        }
      }
    );
  };
  
  // Function to clear the chat messages back to the welcome message
  const handleClearChat = () => {
    setMessages([initialWelcomeMessage]);
    setIsTyping(false); // Stop any active typing indicator
    // Optionally, you might want to cancel any ongoing LLM stream here if applicable
  };
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg font-bold">
            CNC Insight Assistant
          </CardTitle>
          {llmStatus === 'loading' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {llmStatus === 'error' && (
            <div className="flex items-center text-xs text-cnc-error">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Using fallback mode</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleClearChat} title="Clear Chat">
          <RotateCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-grow overflow-y-auto py-4 px-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isTyping && messages[messages.length - 1]?.content === '' && (
            <div className="flex justify-start">
              <div className="chat-message-assistant">
                <span className="flex gap-1">
                  <span className="animate-pulse">•</span>
                  <span className="animate-pulse delay-100">•</span>
                  <span className="animate-pulse delay-200">•</span>
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type your question..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            disabled={isTyping}
            className="flex-grow"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isTyping || !newMessage.trim()}
            className="bg-cnc-blue hover:bg-cnc-darkBlue"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Chatbot;
