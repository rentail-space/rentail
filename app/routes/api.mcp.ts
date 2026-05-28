import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import handleRequest from "~/lib/mcp/handleRequest.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error("MCP error: %s", error);
    throw new Response(null, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error("MCP error: %s", error);
    throw new Response(null, { status: 500 });
  }
}
