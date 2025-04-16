
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send, AlertTriangle, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { initializeLLM, streamResponseFromLLM } from "@/services/llmService";
import { ChatMessage, ContextualData } from "@/types";

interface ChatbotProps {
  contextData?: ContextualData;
}

const Chatbot = ({ contextData }: ChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [llmStatus, setLlmStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize LLM
  useEffect(() => {
    const loadLLM = async () => {
      try {
        const success = await initializeLLM();
        setLlmStatus(success ? 'ready' : 'error');
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: "Hello! I'm your CNC Insight Navigator assistant. I can help you analyze machine data, troubleshoot issues, and provide insights about your CNC operations. What would you like to know today?",
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
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
    
    // Stream the response
    await streamResponseFromLLM(
      [...messages, userMessage],
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
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="py-3">
        <CardTitle className="text-lg font-bold flex items-center">
          <span>CNC Insight Navigator</span>
          {llmStatus === 'loading' && (
            <Loader2 className="h-4 w-4 ml-2 animate-spin text-muted-foreground" />
          )}
          {llmStatus === 'error' && (
            <div className="flex items-center text-xs text-cnc-error ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Using fallback mode</span>
            </div>
          )}
        </CardTitle>
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
