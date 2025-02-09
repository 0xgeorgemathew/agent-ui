/* eslint-disable jsdoc/require-jsdoc */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, Name, Identity, EthBalance } from "@coinbase/onchainkit/identity";
import { Terminal, AlertCircle } from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState<Array<{ message: string; timestamp: number }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error">(
    "disconnected",
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource("/api/messages");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus("connected");
      };

      eventSource.onmessage = event => {
        try {
          const newMessages = JSON.parse(event.data);
          // Use functional update to ensure we're working with the latest state
          setMessages(newMessages);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus("error");
        eventSource.close();
        setTimeout(connectEventSource, 5000);
      };
    };

    connectEventSource();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
      <header className="py-2 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {connectionStatus === "error" && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Reconnecting...
              </div>
            )}
          </div>
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-[95%] h-full">
          <div className="h-[calc(100vh-6rem)]">
            <div className="bg-gray-900 rounded-lg p-4 shadow-lg h-full">
              <div className="flex items-center gap-2 mb-4 text-white">
                <Terminal className="h-6 w-6" />
                <h2 className="text-xl font-bold">Bidding Agent 47</h2>
              </div>
              <div className="bg-black rounded-lg p-4 h-[calc(100%-4rem)] overflow-y-auto font-mono text-sm">
                {messages.map((msg, i) => (
                  <div
                    key={`${msg.timestamp}-${i}`}
                    className="text-green-400 mb-2 break-words whitespace-pre-wrap"
                  >
                    <span className="text-gray-500">
                      [{new Date(msg.timestamp).toLocaleTimeString()}]
                    </span>{" "}
                    {msg.message}
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {messages.length === 0 && (
                  <div className="text-gray-500 text-center mt-4">
                    {connectionStatus === "connected"
                      ? "Waiting for agent messages..."
                      : "Connecting to agent..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
