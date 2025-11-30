import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import ChatWidget from '../components/chat/ChatWidget';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#eaeaea] to-[#f5f5f5] dark:from-[#26282b] dark:to-[#383b3e] overflow-hidden">
      <div className="flex-shrink-0 pt-4 md:pt-6 px-4 md:px-6">
        <div className="container mx-auto">
          <h1 className="text-[68px] font-bold text-[#26282b] dark:text-[#eaeaea]">Chatbox</h1>
          <p className="text-[#26282b]/70 dark:text-[#eaeaea]/70 my-2">
            See what the team is up to
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 container mx-auto px-4 md:px-6 pb-4 md:pb-6">
        <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl h-full flex flex-col">
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
            <ChatWidget />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
