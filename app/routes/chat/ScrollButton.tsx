import { useStickToBottomContext } from "use-stick-to-bottom";

export default function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <button
      className="fixed right-6 bottom-24 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
      onClick={() => scrollToBottom()}
      type="button"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-600"
      >
        <title>Scroll to bottom</title>
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </button>
  );
}
