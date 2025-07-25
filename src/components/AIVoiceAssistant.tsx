import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Pause
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
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([
    {
      id: "1",
      command: "Add iPhone 15 Pro to cart",
      response: "Added iPhone 15 Pro ($999.99) to cart successfully",
      timestamp: "14:32:15",
      confidence: 95
    },
    {
      id: "2", 
      command: "Show today's sales report",
      response: "Today's sales: $12,750.80 from 156 transactions",
      timestamp: "14:15:22",
      confidence: 92
    },
    {
      id: "3",
      command: "Check inventory for Samsung Galaxy",
      response: "Samsung Galaxy S24: 8 units in stock - below minimum threshold",
      timestamp: "13:45:11",
      confidence: 98
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
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

  const handleVoiceCommand = (command: string, confidence: number) => {
    setCurrentCommand(command);
    
    // AI command processing logic
    let response = "";
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes("add") && lowerCommand.includes("cart")) {
      response = `Added ${command.split("add")[1].split("to cart")[0].trim()} to cart successfully`;
    } else if (lowerCommand.includes("sales") && lowerCommand.includes("report")) {
      response = "Today's sales: $12,750.80 from 156 transactions. Revenue up 12% from yesterday.";
    } else if (lowerCommand.includes("inventory") || lowerCommand.includes("stock")) {
      response = "Current inventory levels: 23 iPhone 15 Pro, 8 Samsung Galaxy S24 (low stock alert), 45 AirPods Pro";
    } else if (lowerCommand.includes("customer") && lowerCommand.includes("search")) {
      response = "Found 3 customers matching your search criteria. Displaying results now.";
    } else if (lowerCommand.includes("print") && lowerCommand.includes("receipt")) {
      response = "Printing receipt for transaction TX-2024-001234. Please wait.";
    } else if (lowerCommand.includes("help")) {
      response = "I can help you with sales, inventory, reports, customer lookup, and system commands. What would you like to do?";
    } else {
      response = "I understand your request. Processing command through AI system.";
    }

    const newCommand: VoiceCommand = {
      id: Date.now().toString(),
      command,
      response,
      timestamp: new Date().toLocaleTimeString(),
      confidence
    };

    setCommandHistory(prev => [newCommand, ...prev].slice(0, 10));
    speakResponse(response);
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

  const quickCommands = [
    "Show today's sales",
    "Check low stock items", 
    "Add customer to database",
    "Print daily report",
    "Search customer by phone",
    "Process return transaction"
  ];

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