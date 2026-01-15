import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Brain,
  Sparkles,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Loader2
} from "lucide-react";

interface VoiceCommand {
  id: string;
  command: string;
  response: string;
  timestamp: string;
  confidence: number;
}

const AIVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [quickCommands, setQuickCommands] = useState<string[]>([]);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Load voice commands from database
  const loadVoiceCommands = async () => {
    try {
      const { data: commands } = await supabase
        .from('voice_commands')
        .select('command')
        .eq('is_active', true)
        .order('display_order')
        .limit(6);

      if (commands) {
        setQuickCommands(commands.map(c => c.command));
      }
    } catch (error) {
      console.error('Error loading voice commands:', error);
    }
  };

  useEffect(() => {
    loadVoiceCommands();

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const command = event.results[0][0].transcript;
        const confidence = Math.round(event.results[0][0].confidence * 100);
        handleVoiceCommand(command, confidence);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleVoiceCommand = async (command: string, confidence: number) => {
    setCurrentCommand(command);
    setIsProcessing(true);
    
    try {
      // Call AI via edge function
      const { data, error } = await supabase.functions.invoke('voice-chat', {
        body: { message: command }
      });

      let response: string;
      
      if (error) {
        console.error('Edge function error:', error);
        response = "I'm having trouble connecting to the AI service. Please try again.";
      } else if (data?.error) {
        console.warn('AI service warning:', data.error);
        response = data.response || "I couldn't process that command.";
      } else {
        response = data?.response || "I couldn't process that command.";
      }

      const newCommand: VoiceCommand = {
        id: Date.now().toString(),
        command,
        response,
        timestamp: new Date().toLocaleTimeString(),
        confidence
      };

      setCommandHistory(prev => [newCommand, ...prev].slice(0, 10));
      
      if (!data?.error) {
        speakResponse(response);
      }
      
      if (data?.error) {
        toast({
          title: "Notice",
          description: data.error,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      
      const fallbackResponse = "I encountered an error. Please try again in a moment.";
      const newCommand: VoiceCommand = {
        id: Date.now().toString(),
        command,
        response: fallbackResponse,
        timestamp: new Date().toLocaleTimeString(),
        confidence
      };
      setCommandHistory(prev => [newCommand, ...prev].slice(0, 10));
      
      toast({
        title: "Connection Error",
        description: "Failed to process voice command. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if (synthRef.current && isEnabled) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleSpeech = () => {
    setIsEnabled(!isEnabled);
    if (!isEnabled && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };


  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "success";
    if (confidence >= 70) return "warning";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Voice Assistant
          </h1>
          <p className="text-muted-foreground">Hands-free POS control with natural language</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isEnabled ? "default" : "secondary"} className="bg-gradient-accent">
            <Brain className="w-3 h-3 mr-1 animate-pulse" />
            AI Active
          </Badge>
        </div>
      </div>

      {/* Voice Control Panel */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            Voice Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <Button
                size="lg"
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full ${
                  isListening 
                    ? "bg-destructive hover:bg-destructive/80 animate-pulse" 
                    : "bg-gradient-primary"
                }`}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </Button>
              <p className="text-sm mt-2 font-medium">
                {isListening ? "Listening..." : "Click to speak"}
              </p>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                variant="outline"
                onClick={toggleSpeech}
                className={`w-16 h-16 rounded-full ${!isEnabled ? "opacity-50" : ""}`}
              >
                {isEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
              <p className="text-sm mt-2 font-medium">
                {isEnabled ? "Voice On" : "Voice Off"}
              </p>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                variant="outline"
                className="w-16 h-16 rounded-full"
              >
                <Settings className="w-6 h-6" />
              </Button>
              <p className="text-sm mt-2 font-medium">Settings</p>
            </div>
          </div>

          {/* Current Command Display */}
          {currentCommand && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-sm text-accent font-medium mb-1">Last Command:</p>
              <p className="text-foreground">{currentCommand}</p>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-primary font-medium">AI Processing...</span>
            </div>
          )}

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <span className="ml-2 text-primary font-medium">AI Speaking...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Commands */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Quick Voice Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickCommands.map((command, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start hover:border-primary/50"
                onClick={() => handleVoiceCommand(command, 95)}
              >
                <div>
                  <p className="font-medium text-sm">{command}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click or say this command</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            Voice Command History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commandHistory.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
              >
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Mic className="w-4 h-4 text-accent" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium">{cmd.command}</p>
                    <Badge 
                      variant="outline" 
                      className={`border-${getConfidenceColor(cmd.confidence)} text-${getConfidenceColor(cmd.confidence)}`}
                    >
                      {cmd.confidence}% confidence
                    </Badge>
                    <span className="text-xs text-muted-foreground">{cmd.timestamp}</span>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-3 h-3 text-accent" />
                      <span className="text-xs font-medium text-accent">AI Response:</span>
                    </div>
                    <p className="text-sm">{cmd.response}</p>
                  </div>
                </div>

                <Button size="sm" variant="outline" onClick={() => speakResponse(cmd.response)}>
                  {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Commands Guide */}
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Voice Commands Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-success">Sales Commands</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• "Add [product] to cart"</li>
                <li>• "Remove [product] from cart"</li>
                <li>• "Apply [discount] percent discount"</li>
                <li>• "Process payment by [method]"</li>
                <li>• "Print receipt"</li>
                <li>• "Void transaction"</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-accent">Inventory Commands</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• "Check inventory for [product]"</li>
                <li>• "Show low stock items"</li>
                <li>• "Update stock for [product]"</li>
                <li>• "Create reorder for [product]"</li>
                <li>• "Show expiring products"</li>
                <li>• "Generate inventory report"</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-warning">Customer Commands</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• "Search customer by [name/phone]"</li>
                <li>• "Add new customer"</li>
                <li>• "Show customer history"</li>
                <li>• "Apply loyalty points"</li>
                <li>• "Send promotional offer"</li>
                <li>• "Update customer information"</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-primary">Reports & Analytics</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• "Show today's sales report"</li>
                <li>• "Generate weekly analytics"</li>
                <li>• "Display top products"</li>
                <li>• "Show customer analytics"</li>
                <li>• "Export sales data"</li>
                <li>• "AI insights summary"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIVoiceAssistant;