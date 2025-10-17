import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import privacy from "~/data/privacy.md?raw";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-12 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 prose">
      <Streamdown remarkPlugins={[remarkGfm]}>{privacy}</Streamdown>
    </div>
  );
}
