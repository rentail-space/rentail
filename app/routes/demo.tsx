import { type Dispatch, type SetStateAction, useState } from "react";
import Markdown from "react-markdown";

type Message = {
	id: string;
	text: string;
	isUser: boolean;
	timestamp: Date;
};

export default function () {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			text: intro,
			isUser: false,
			timestamp: new Date(),
		},
	]);
	const [isTyping, setIsTyping] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Header />
			<Message isTyping={isTyping} messages={messages} />
			<InputMessage
				isTyping={isTyping}
				setMessages={setMessages}
				setIsTyping={setIsTyping}
			/>
		</div>
	);
}

function Header() {
	return (
		<header className="bg-white border-b px-6 py-4">
			<h1 className="text-2xl font-bold text-gray-900">
				<span className="text-blue-600">rentail</span>.space
			</h1>
		</header>
	);
}

function Message({
	isTyping,
	messages,
}: {
	isTyping: boolean;
	messages: Message[];
}) {
	return (
		<div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
			{/* Messages Container  */}
			<div className="flex-1 overflow-y-auto p-6 space-y-4">
				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
								message.isUser
									? "bg-blue-600 text-white ml-auto"
									: "bg-white border shadow-sm"
							}`}
						>
							{message.isUser ? (
								<p className="whitespace-pre-wrap">{message.text}</p>
							) : (
								<Markdown>{message.text}</Markdown>
							)}
							<div
								className={`text-xs mt-1 ${
									message.isUser ? "text-blue-100" : "text-gray-500"
								}`}
							>
								{message.timestamp.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</div>
						</div>
					</div>
				))}

				{isTyping && (
					<div className="flex justify-start">
						<div className="bg-white border shadow-sm px-4 py-2 rounded-lg">
							<div className="flex space-x-1">
								<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
								<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
								<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function InputMessage({
	isTyping,
	setIsTyping,
	setMessages,
}: {
	isTyping: boolean;
	setIsTyping: Dispatch<SetStateAction<boolean>>;
	setMessages: Dispatch<SetStateAction<Message[]>>;
}) {
	const [input, setInput] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			text: input.trim(),
			isUser: true,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsTyping(true);

		// Simulate bot response after a delay
		setTimeout(
			() => {
				const botResponse = generateBotResponse(input.trim());
				const botMessage: Message = {
					id: (Date.now() + 1).toString(),
					text: botResponse,
					isUser: false,
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, botMessage]);
				setIsTyping(false);
			},
			1000 + Math.random() * 2000,
		); // Random delay between 1-3 seconds
	};

	return (
		<div className="bg-white border-t p-4">
			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Ask about retail spaces..."
					className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={isTyping}
				/>
				<button
					type="submit"
					disabled={isTyping || !input.trim()}
					className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Send
				</button>
			</form>
		</div>
	);
}

const intro = `Welcome to **rentail.space**!
I'm your virtual assistant here to help you find the perfect retail space for your business needs.
How can I assist you today?
`;
const spaces = `Here are some of the retail spaces we offer:

**Premium Mall Location**
- Size: 10' x 12'
- Weekly Rate: $1,200
- Foot Traffic: ~4,000 daily visitors
- Available: Weekends

**Strip Mall Space**
- Size: 8' x 10'
- Weekly Rate: $800
- Foot Traffic: ~2,500 daily visitors
- Available: All week

Would you like more details about any of these locations?
You can also ask about pricing, locations, or specific business types. I'm here to help!`;

const pricing = `Our pricing varies based on location and size:

**Mall Locations:** $800 - $1,500/week

**Strip Centers:** $500 - $1,000/week

**Pop-up Spaces:** $200 - $600/week

Prices include:
- ✅ Basic utilities
- ✅ Security
- ✅ Maintenance
- ✅ Parking access
What's your budget range?`;

const locations = `We have retail spaces available in the following areas:

**San Francisco:**
- Union Square
- Mission District

**East Bay:**
- Hayward
- Alameda

**Peninsula:**
- San Mateo
- Redwood City

If you have a specific area in mind, let me know and I can provide more details!`;

function generateBotResponse(userInput: string): string {
	const input = userInput.toLowerCase();
	if (input.includes("hello") || input.includes("hi")) return intro;
	if (input.includes("space") || input.includes("retail")) return spaces;
	if (input.includes("price") || input.includes("cost")) return pricing;
	if (input.includes("location") || input.includes("where")) return locations;

	// Default response
	return `I understand you're interested in: "${userInput}"

Let me help you with that! Our platform specializes in **short-term retail space rentals** perfect for:

- 🛍️ Pop-up shops
- 📱 Electronics sales  
- 👕 Fashion boutiques
- 🎨 Art exhibitions
- 🍕 Food vendors

What type of business are you planning to run?`;
}
