import { useEffect, useState } from "react";

const collection = [
  "12 merchants are searching spaces right now",
  "8 new listings added in the last hour",
  "23 merchants browsing shopping centers today",
  "5 specialty leases signed this week",
  "34 active conversations with property managers",
  "16 merchants comparing kiosk prices",
  "19 pop-up shop inquiries received today",
  "7 new shopping centers joined this month",
  "41 merchants viewing available cart spaces",
  "14 seasonal lease applications in progress",
  "28 merchants exploring Los Angeles locations",
  "9 temporary retail spaces reserved today",
  "52 merchants checking availability this hour",
  "11 property managers responding to inquiries",
  "25 merchants interested in holiday season slots",
  "6 short-term leases starting next month",
  "38 merchants researching mall demographics",
  "15 kiosk spaces booked for Q4",
  "44 merchants viewing inline store options",
  "10 new merchant profiles created today",
  "31 specialty lease negotiations active",
  "13 merchants planning spring pop-ups",
];

export default function ActivityCounter() {
  const [messages, setMessages] = useState(
    collection.sort(() => Math.random() - 0.5),
  );
  const [message, setMessage] = useState<string | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: on first render
  useEffect(() => {
    setMessages((messages) => {
      setMessage(messages[0]);
      return messages.slice(1);
    });

    const timer = setInterval(() => {
      setMessages((messages) => {
        setMessage(messages[0]);
        return messages.slice(1);
      });
      if (messages.length === 0) clearInterval(timer);
    }, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (process.env.NODE_ENV === "test") return null;

  return (
    message && (
      <div className="fixed bottom-6 left-6 z-50 hidden lg:block">
        <div className="rounded-lg border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-opacity duration-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <p className="font-medium text-gray-900 text-sm">{message}</p>
          </div>
        </div>
      </div>
    )
  );
}
