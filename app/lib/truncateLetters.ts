export default function truncateLetters(
  text: string,
  letterCount: number,
): string {
  if (text.length <= letterCount) return text;
  return `${text.slice(0, letterCount - 8)}…${text.slice(-8)}`;
}
