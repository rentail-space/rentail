import { captureException } from "@sentry/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";

export default function AddToWaitlist() {
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(false);
  const id = useId();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsActive(true);
      const response = await fetch("/api/waitlist", {
        body: JSON.stringify({ email: email.trim() }),
        headers: { "Content-Type": "application/json", },
        method: "POST",
      });

      if (response.ok) toast.success("Thank you for joining our waitlist! 🚀");
      else toast.error("Oops! Something went wrong!");
    } catch (error) {
      captureException(error);
    }

    setEmail("");
    setIsActive(false);
  };

  return (
    <section className="mx-auto flex flex-col items-start gap-4 text-xl">
      <form onSubmit={handleSubmit} className="mt-2 max-w-md">
        <div className="flex flex-col gap-2 lg:flex-row">
          <label className="sr-only" htmlFor={id}>
            Email address
          </label>
          <input
            autoComplete="email"
            className="text-accent-500 block h-10 w-full focus:invalid:border-red-400 focus:invalid:text-red-500 focus:invalid:ring-red-500 appearance-none rounded-lg border-2 border-slate-300 px-4 py-2 placeholder-zinc-400 duration-200 focus:outline-none focus:ring-zinc-300"
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
            className="flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg  bg-blue-600 active:bg-gray-400 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-700"
            type="submit"
          >
            <span>Join the waitlist</span>
          </button>
        </div>
      </form>

      <div className="flex items-start gap-2 text-gray-500 text-sm">
        <InfoCircledIcon />
        <p className="-mt-1 max-w-sm">
          No worries! your data is completely safe and will only be utilized to
          provide you with updates about our product.
        </p>
      </div>
    </section>
  );
}

function InfoCircledIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77618 5.99999 8.00003 6.22384 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.50003H6.00003V5.99999Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}
