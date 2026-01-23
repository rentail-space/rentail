import { useState } from "react";
import { useInterval } from "usehooks-ts";
import { Progress } from "./Progress";

export default function LoadingProgress() {
  const [value, setValue] = useState(0);
  useInterval(() => {
    setValue(value + 1);
  }, 100);
  return <Progress value={value} />;
}
