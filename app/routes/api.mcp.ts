import { captureException } from "@sentry/react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import handleRequest from "~/lib/mcp/handleRequest";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    return await handleRequest(request);
  } catch (error) {
    captureException(error, { extra: { request } });
    throw new Response(null, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    return await handleRequest(request);
  } catch (error) {
    captureException(error, { extra: { request } });
    throw new Response(null, { status: 500 });
  }
}
