import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import transport from "~/lib/mcpServer";

export async function loader({ request }: LoaderFunctionArgs) {
  return await transport.handleRequest(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return await transport.handleRequest(request);
}
