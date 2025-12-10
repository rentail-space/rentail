import { Info } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useFetcher } from "react-router";
import { Alert, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

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
  const id = useId();
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
        {fetcher.data?.error ? (
          <div className="rounded-[5px] border-2 border-black bg-red-100 p-4 text-center font-bold text-black shadow-[2px_2px_0px_0px_black]">
            Something went wrong. Please try again.
          </div>
        ) : fetcher.data?.success ? (
          <div className="rounded-[5px] border-2 border-black bg-green-100 p-4 text-center font-bold text-black shadow-[2px_2px_0px_0px_black]">
            Thank you for joining our waitlist! 🚀
          </div>
        ) : null}

        <Label htmlFor={id} className="mb-8 font-medium text-black text-xl">
          Join the waitlist today and be the first to know when we launch in
          your area.
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            autoComplete="email"
            className="h-14 w-full rounded-[5px] border-2 border-black bg-white px-6 font-medium text-black text-lg shadow-[2px_2px_0px_0px_black] placeholder:text-gray-600 transition-all duration-100 focus-visible:shadow-[4px_4px_0px_0px_black] focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px]"
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
            className="h-14 shrink-0 px-8 font-bold text-lg"
            disabled={fetcher.state !== "idle"}
            type="submit"
            variant="default"
          >
            Join Waitlist
          </Button>
        </div>
      </form>

      <div className="flex items-start gap-2 rounded-[5px] border-2 border-black bg-white p-4 font-medium text-black text-sm shadow-[2px_2px_0px_0px_black]">
        <Info className="mt-0.5 inline-block h-4 w-4 shrink-0" />
        <p className="text-left">
          Your data is secure and will only be used to notify you about our
          launch. No spam, ever.
        </p>
      </div>
    </div>
  );
}
