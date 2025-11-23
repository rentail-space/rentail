import type { TextUIPart } from "ai";
import { CircleCheck, NotepadTextIcon } from "lucide-react";
import type { Messages, User } from "prisma/generated/client";
import type { ChatGetPayload } from "prisma/generated/models";
import { useFetcher } from "react-router";
import { Fragment } from "react/jsx-runtime";
import { Streamdown } from "streamdown";
import { twMerge } from "tailwind-merge";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import { verifyAdmin } from "~/sessions.server";
import type { Route } from "./+types/admin.user.$userId";

export async function loader({ params, request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  const user = await prisma.user.findUnique({
    include: {
      chats: { include: { messages: { orderBy: { createdAt: "asc" } } } },
    },
    where: { id: params.userId },
  });
  if (!user) throw new Response("Not Found", { status: 404 });
  return { user };
}

export async function action({ params, request }: Route.ActionArgs) {
  await verifyAdmin(request.headers);

  const formData = await request.formData();
  const note = formData.get("note") as string;
  console.log(note);
  console.log(params.userId);
  const user = await prisma.user.update({
    data: { note },
    where: { id: params.userId },
  });
  return user;
}

export default function UserPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const { user } = loaderData;

  return (
    <div className="prose mx-auto space-y-4">
      <UserInfoCard user={user} />
      <EditNote user={user} />
      <WorkingMemory user={user} />
      {user.chats.map((chat) => (
        <ChatMessages key={chat.id} chat={chat} />
      ))}
    </div>
  );
}

function UserInfoCard({ user }: { user: User }) {
  return (
    <details className="collapse border border-gray-200" open>
      <summary className="collapse-title font-semibold">{user.name}</summary>
      <table className="table-bordered collapse-content table">
        <tbody>
          <tr>
            <th>Email</th>
            <td className="truncate" title={user.email ?? ""}>
              {user.email}
            </td>
          </tr>
          <tr>
            <th className="whitespace-nowrap">User Agent</th>
            <td className="truncate" title={user.userAgent ?? ""}>
              {user.userAgent}
            </td>
          </tr>
          <tr>
            <th>Referrer</th>
            <td className="truncate" title={user.referrer ?? ""}>
              {user.referrer}
            </td>
          </tr>
          <tr>
            <th>Created</th>
            <td>
              {user.createdAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}

function EditNote({ user }: { user: User }) {
  const fetcher = useFetcher<typeof action>();
  return (
    <fetcher.Form
      onSubmit={(event) => {
        event.preventDefault();
        fetcher.submit(event.currentTarget, {
          method: "post",
        });
      }}
    >
      <fieldset className="fieldset">
        <div className="items-top flex gap-2">
          <NotepadTextIcon />
          <textarea
            className="textarea textarea-bordered min-h-12 w-full"
            defaultValue={user.note ?? ""}
            name="note"
          />
        </div>

        <div className="flex justify-end">
          <button
            className={twMerge(
              "btn btn-primary btn-sm",
              fetcher.data?.name ? "btn-success" : "btn-primary",
            )}
            type="submit"
            disabled={fetcher.state !== "idle"}
          >
            {fetcher.state !== "idle" ? (
              <span className="loading loading-spinner" />
            ) : fetcher.data ? (
              <CircleCheck className="h-6 w-6 shrink-0 stroke-current" />
            ) : null}
            {fetcher.state !== "idle" ? "Saving..." : "Save"}
          </button>
        </div>
      </fieldset>
    </fetcher.Form>
  );
}

function WorkingMemory({ user }: { user: User }) {
  const workingMemory = cleanParseProfile(user.workingMemory);
  return (
    <details className="collapse border border-gray-200">
      <summary className="collapse-title semibold">
        Click to show/hide working memory
      </summary>
      <pre className="collapse-content text-sm">
        {JSON.stringify(workingMemory, null, 2)}
      </pre>
    </details>
  );
}

function ChatMessages({
  chat,
}: {
  chat: ChatGetPayload<{ include: { messages: true } }>;
}) {
  return (
    <details className="collapse border border-gray-200" open>
      <summary className="collapse-title">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{chat.title || "Chat"}</span>
          <span className="font-normal text-gray-500">
            (
            {chat.createdAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            )
          </span>
        </div>
      </summary>

      <div className="collapse-content">
        {chat.messages.map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <div className="chat chat-end">
                <MessageTimestamp message={message} />
                <div className="chat-bubble prose prose-base max-w-10/12">
                  {getTextContent({ message })
                    .split("\n")
                    .map((line, index) => (
                      <p key={index.toString()}>{line}</p>
                    ))}
                </div>
              </div>
            ) : (
              <div className="chat chat-start">
                <MessageTimestamp message={message} />
                <Streamdown className="chat-bubble prose prose-base max-w-10/12">
                  {getTextContent({ message })}
                </Streamdown>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </details>
  );
}

function MessageTimestamp({ message }: { message: Messages }) {
  return (
    <div className="chat-header">
      {message.createdAt.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })}{" "}
      {message.createdAt.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </div>
  );
}

function getTextContent({ message }: { message: Messages }): string {
  return (message.content as TextUIPart[])
    .map((part) => (part.type === "text" ? part.text : null))
    .join("\n");
}
