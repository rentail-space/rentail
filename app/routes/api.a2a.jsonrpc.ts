import { UserBuilder, jsonRpcHandler } from "@a2a-js/sdk/server/express";
import { captureException } from "@sentry/react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import requestHandler from "~/lib/a2a/requestHandler.server";

const handler = jsonRpcHandler({
  requestHandler,
  userBuilder: UserBuilder.noAuthentication,
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    return await handler(request);
  } catch (error) {
    captureException(error, { extra: { request } });
    throw new Response(null, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    return await handler(request);
  } catch (error) {
    captureException(error, { extra: { request } });
    throw new Response(null, { status: 500 });
  }
}
