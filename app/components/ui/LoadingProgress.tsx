import { useState } from "react";
import { useInterval } from "usehooks-ts";
import { Progress } from "@base-ui/react/progress";

export default function LoadingProgress() {
  const [value, setValue] = useState(0);
  useInterval(() => {
    setValue(value + 1);
  }, 100);
  return (
    <Progress.Root
      className="relative h-4 w-full overflow-hidden rounded-base border-2 border-border bg-secondary-background"
      value={value}
    >
      <Progress.Indicator
        className="h-full w-full flex-1 border-border border-r-2 bg-main transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </Progress.Root>
  );
}
