import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

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
  const id = useId();
  const fetcher = useFetcher();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget);
  }

  useEffect(() => {
    if (fetcher.data?.error)
      console.error("Error joining waitlist: %s", fetcher.data.error);
    setEmail("");
  }, [fetcher.data]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
      <form
        action="/api/waitlist"
        method="POST"
        onSubmit={onSubmit}
        className="flex w-full flex-col gap-4"
      >
        {fetcher.data?.error ? (
          <div role="alert" className="alert alert-error">
            <AlertCircle className="h-6 w-6 shrink-0 stroke-current" />
            <span>Something went wrong. Please try again.</span>
          </div>
        ) : fetcher.data?.success ? (
          <div role="alert" className="alert alert-success">
            <CheckCircle className="h-6 w-6 shrink-0 stroke-current" />
            <span>Thank you for joining our waitlist! 🚀</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor={id}>
            Email address
          </label>
          <Input
            autoComplete="email"
            className="h-14 w-full px-6 text-white text-xl! placeholder-white/60! focus:ring-2"
            id={id}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
            placeholder="your.email@example.com"
            required
            type="email"
            value={email}
          />
          <Button
            className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl px-8 transition-all hover:shadow-lg disabled:opacity-50"
            disabled={fetcher.state !== "idle"}
            size="xl"
            type="submit"
            variant="secondary"
          >
            <span>Join Waitlist</span>
          </Button>
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
