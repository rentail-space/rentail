import { agentCardHandler } from "@a2a-js/sdk/server/express";
import type { LoaderFunctionArgs } from "react-router";
import requestHandler from "~/lib/a2a/requestHandler.server";

const handler = agentCardHandler({ agentCardProvider: requestHandler });

export async function loader({ request }: LoaderFunctionArgs) {
  return handler(request);
}
