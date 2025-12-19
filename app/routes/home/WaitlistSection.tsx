import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";

export default function WaitlistSection() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-4 py-20">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="mb-6 font-bold text-4xl text-black leading-tight md:text-5xl">
          Ready to find your perfect retail space?
        </h2>
        <JoinWaitlist />
      </div>
    </section>
  );
}

function JoinWaitlist() {
  const [email, setEmail] = useState("");
  const fetcher = useFetcher();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit({ email }, { action: "/api/waitlist", method: "POST" });
  }

  useEffect(() => {
    if (fetcher.data?.error)
      console.error("Error joining waitlist: %s", fetcher.data.error);
    setEmail("");
  }, [fetcher.data]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
      <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
        <Label htmlFor="email" className="mb-8 font-medium text-black text-xl">
          Join the waitlist today and be the first to know when we launch in
          your area.
        </Label>
        {fetcher.data?.error ? (
          <div className="rounded-base border-2 border-black bg-red-100 p-4 text-center font-bold text-black shadow-[2px_2px_0px_0px_black]">
            Something went wrong. Please try again.
          </div>
        ) : fetcher.data?.success ? (
          <div className="rounded-base border-2 border-black bg-green-100 p-4 text-center font-bold text-black shadow-[2px_2px_0px_0px_black]">
            Thank you for joining our waitlist! 🚀
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            autoComplete="email"
            className="h-14 w-full rounded-base border-2 border-black bg-white px-6 font-medium text-black text-lg shadow-[2px_2px_0px_0px_black] transition-all duration-100 placeholder:text-gray-600 focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] focus-visible:shadow-[4px_4px_0px_0px_black]"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
            placeholder="your.email@example.com"
            required
            type="email"
            value={email}
          />
          <Button
            className="h-14 shrink-0 px-8 font-bold text-lg"
            disabled={fetcher.state !== "idle"}
            type="submit"
            variant="default"
          >
            Join Waitlist
          </Button>
        </div>
      </form>

      <div className="flex flex-col items-center gap-2 text-gray-800">
        <p className="text-left">
          Your data is secure and will only be used to notify you about our
          launch.
        </p>
        <p>No spam, ever.</p>
      </div>
    </div>
  );
}
