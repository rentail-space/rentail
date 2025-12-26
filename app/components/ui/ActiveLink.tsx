import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

const activeLinkVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold text-sm transition-all duration-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-blue-500 hover:underline underline-offset-4 !p-0",
        silent: "hover:text-blue-500 hover:underline underline-offset-4 !p-0",
        button: 
          "rounded-base border-2 border-black bg-[hsl(120,100%,97%)] text-black shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] py-2 px-4",
        highlight: "font-medium text-black text-xl hover:text-[hsl(37,92%,65%)] !p-0",
      },
    size: {
      default: "text-base px-4 py-2",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg px-6 py-3",
      xl: "text-xl px-8 py-4",
    },
    disabled: {
      true: "pointer-events-none text-gray-400 opacity-50"
    },
    bg: {
      yellow: "bg-[hsl(37,92%,65%)]",
      white: "bg-white"
    },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      bg: null,
      disabled: false,
    },
  },
);

export interface ActiveLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof activeLinkVariants> {
  to: string;
}

const ActiveLink = React.forwardRef<HTMLAnchorElement, ActiveLinkProps>(
  ({ className, disabled, variant, size, bg, to, ...props }, ref) => {
    return (
      <Link
        className={cn(activeLinkVariants({ variant, size, disabled, className, bg }))}
        to={to}
                    rel="noopener noreferrer"
        {...props}
      />
    );
  },
);
ActiveLink.displayName = "ActiveLink";

export { ActiveLink, activeLinkVariants };
