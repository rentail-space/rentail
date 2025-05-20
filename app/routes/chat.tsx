import Markdown from "react-markdown";

export default function Index() {
	return (
		<div className="py-20 max-w-1/2 mx-2 px-4 space-y-4">
			<Multiline
				className="ml-20 bg-gray-100"
				text={[
					"I'm in the east bay, looking for a place to sell my IPhone cases and chargers. My cart is 5' by 7'. I want to do fri+sat+sun for 4 weeks.  What you got?",
				]}
			/>

			<Multiline
				className="mr-20 bg-blue-600 text-white"
				text={[
					"We got a few places for you to consider:",
					`**Southland Mall in Hayward**
We have one spot 8' by 12' for $759/week
We have one spot 10' by 14' for $1,200/week
Estimated foot traffic 3,500 to 4,500 people a day`,
					`**South Shore Center in Alameda**
This is a strip mall
We have several spots 12' by 14' for $925/week
Estimated foot traffic 4,500 to 5,250 people a day`,
				]}
			/>
		</div>
	);
}

function Multiline({
	className,
	text,
}: {
	className: string;
	text: string[];
}) {
	return (
		<div
			className={`${className} px-4 py-2 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow space-y-2`}
		>
			{text.map((paragraph, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<div key={index}>
					{paragraph.split(/\n/).map((line, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<Markdown key={index}>{line}</Markdown>
					))}
				</div>
			))}
		</div>
	);
}
