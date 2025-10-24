import { captureException } from "@sentry/react-router";
import { IconCircleInfoFill } from "obra-icons-react";
import { useId, useState } from "react";
import { toast } from "sonner";

export default function JoinWaitlist() {
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(false);
  const id = useId();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsActive(true);
      const response = await fetch("/api/waitlist", {
        body: JSON.stringify({ email: email.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (response.ok) toast.success("Thank you for joining our waitlist! 🚀");
      else toast.error("Oops! Something went wrong!");
    } catch (error) {
      captureException(error, { extra: { email } });
    }

    setEmail("");
    setIsActive(false);
  };

  return (
    <section className="mx-auto flex flex-col items-start gap-4 text-xl">
      <form onSubmit={handleSubmit} className="mt-2 w-full md:w-xl">
        <div className="flex flex-col gap-2 md:flex-row">
          <label className="sr-only" htmlFor={id}>
            Email address
          </label>
          <input
            autoComplete="email"
            className="block h-10 w-full appearance-none rounded-lg border-2 border-slate-300 px-4 py-2 text-accent-500 placeholder-zinc-400 duration-200 focus:outline-none focus:ring-zinc-300 focus:invalid:border-red-400 focus:invalid:text-red-500 focus:invalid:ring-red-500"
            id={id}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
            placeholder="johndoe@example.com"
            required
            type="email"
            value={email}
          />
          <button
            disabled={isActive}
            className="flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-700 active:bg-gray-400"
            type="submit"
          >
            <span>Join the waitlist</span>
          </button>
        </div>
      </form>

      <div className="flex items-start gap-2 text-gray-500 text-sm">
        <IconCircleInfoFill className="inline-block h-4 w-4" />
        <p className="-mt-1 max-w-sm">
          No worries! your data is completely safe and will only be utilized to
          provide you with updates about our product.
        </p>
      </div>
    </section>
  );
}
