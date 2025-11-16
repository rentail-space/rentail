import type { TextUIPart } from "ai";
import type { Messages, User } from "prisma/generated/client";
import type { ChatGetPayload } from "prisma/generated/models";
import { Fragment } from "react/jsx-runtime";
import { Streamdown } from "streamdown";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import type { Route } from "./+types/admin.user.$userId";

export async function loader({ params }: Route.LoaderArgs) {
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

export default function UserPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div className="prose mx-auto space-y-4">
      <UserInfoCard user={loaderData.user} />
      {loaderData.user.chats.map((chat) => (
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
