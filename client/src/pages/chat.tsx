import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import ChatWidget from '../components/chat/ChatWidget';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background-secondary to-background dark:from-background dark:to-background-secondary overflow-hidden">
      <div className="flex-shrink-0 pt-4 md:pt-6 px-4 md:px-6">
        <div className="container mx-auto">
          <h1 className="text-[68px] font-bold text-foreground">Chatbox</h1>
          <p className="text-foreground-secondary my-2">
            See what the team is up to
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 container mx-auto px-4 md:px-6 pb-4 md:pb-6">
        <Card className="bg-white/25 dark:bg-card/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl h-full flex flex-col">
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
            <ChatWidget />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
