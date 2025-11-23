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
    where: { id: params.userId },
    include: {
      chats: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 10,
          },
        },
      },
    },
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
      {user.chats.map((chat) => (
        <ChatMessages key={chat.id} chat={chat} />
      ))}
    </div>
  );
}

function UserInfoCard({ user }: { user: User }) {
  return (
    <details className="collapse border border-gray-200">
      <summary className="collapse-title font-semibold">{user.name}</summary>
      <ul className="list">
        <li className="list-row">
          <span className="font-semibold">Email</span>
          <span>{user.email}</span>
        </li>
        <li className="list-row">
          <span className="font-semibold">User Agent</span>
          <span className="list-col-wrap">{user.userAgent}</span>
        </li>
        <li className="list-row">
          <span className="font-semibold">Referrer</span>
          <span className="list-col-wrap">{user.referrer}</span>
        </li>
        <li className="list-row">
          <span className="font-semibold">Working Memory</span>
          <span className="list-col-wrap">
            <WorkingMemory user={user} />
          </span>
        </li>
        <li className="list-row">
          <span className="font-semibold">Created</span>
          <span>
            {user.createdAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </li>
      </ul>
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

      <div className="m-4">
        {chat.messages.map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <div className="chat chat-end">
                <MessageTimestamp message={message} />
                <div className="chat-bubble prose prose-base">
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
                <Streamdown className="chat-bubble prose prose-base">
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
