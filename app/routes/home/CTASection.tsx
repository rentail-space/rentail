import { captureException } from "@sentry/react-router";
import { Info } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

export default function CTASection() {
  return (
    <section className="bg-linear-to-br from-blue-600 to-indigo-700 px-4 py-20">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="mb-6 font-bold text-4xl text-white md:text-5xl">
          Ready to find your perfect retail space?
        </h2>
        <p className="mb-8 text-blue-100 text-xl">
          Join the waitlist today and be the first to know when we launch in
          your area.
        </p>
        <JoinWaitlist />
      </div>
    </section>
  );
}

function JoinWaitlist() {
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
      console.error("Error joining waitlist: %s", error);
    }

    setEmail("");
    setIsActive(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor={id}>
            Email address
          </label>
          <input
            autoComplete="email"
            className="h-14 w-full appearance-none rounded-xl border-2 border-white/20 bg-white/10 px-6 text-lg text-white placeholder-white/60 backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            id={id}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
            placeholder="your.email@example.com"
            required
            type="email"
            value={email}
          />
          <button
            disabled={isActive}
            className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-8 font-semibold text-blue-600 text-lg transition-all hover:bg-blue-50 hover:shadow-lg disabled:opacity-50"
            type="submit"
          >
            <span>Join Waitlist</span>
          </button>
        </div>
      </form>

      <div className="flex items-start gap-2 text-blue-100 text-sm">
        <Info className="mt-0.5 inline-block h-4 w-4 shrink-0" />
        <p className="text-left">
          Your data is secure and will only be used to notify you about our
          launch. No spam, ever.
        </p>
      </div>
    </div>
  );
}
