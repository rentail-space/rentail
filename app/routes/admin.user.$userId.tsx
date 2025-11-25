import type { TextUIPart } from "ai";
import { CircleCheck, NotepadTextIcon } from "lucide-react";
import type { User } from "prisma/generated/client";
import type { ChatGetPayload } from "prisma/generated/models";
import { useFetcher } from "react-router";
import { twMerge } from "tailwind-merge";
import { StickToBottom } from "use-stick-to-bottom";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import { verifyAdmin } from "~/sessions.server";
import type { Route } from "./+types/admin.user.$userId";
import Messages from "./chat/Messages";

export async function loader({ params, request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  const user = await prisma.user.findUnique({
    include: {
      chats: {
        orderBy: { createdAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      },
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
    <StickToBottom
      className="prose mx-auto space-y-4"
      initial="smooth"
      resize="smooth"
    >
      <UserInfoCard user={user} />
      <WorkingMemory user={user} />
      <EditNote user={user} />
      {user.chats.map((chat) => (
        <FullChat key={chat.id} chat={chat} />
      ))}
    </StickToBottom>
  );
}

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

function UserInfoCard({ user }: { user: User }) {
  const table = useReactTable({
    data: [user],
    columns: [
      { header: "Email", accessorKey: "email" },
      { header: "User Agent", accessorKey: "userAgent" },
      { header: "Referrer", accessorKey: "referrer" },
      { header: "IP", accessorKey: "ip" },
      { header: "Location", accessorKey: "cityStateCountry" },
      { header: "Created", accessorKey: "createdAt" },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <details className="collapse border border-gray-200" open>
      <summary className="collapse-title font-semibold">{user.name}</summary>
      <table className="table-bordered collapse-content table">
        <tbody>
          <tr>
            <th className="align-middle">Email</th>
            <td className="truncate align-middle" title={user.email ?? ""}>
              {user.email}
            </td>
          </tr>
          <tr>
            <th className="whitespace-nowrap align-middle">User Agent</th>
            <td className="truncate align-middle" title={user.userAgent ?? ""}>
              {user.userAgent}
            </td>
          </tr>
          <tr>
            <th className="align-middle">Referrer</th>
            <td className="truncate align-middle" title={user.referrer ?? ""}>
              {user.referrer}
            </td>
          </tr>
          <tr>
            <th className="align-middle">IP</th>
            <td className="truncate align-middle" title={user.ip ?? ""}>
              {user.ip}
            </td>
          </tr>
          <tr>
            <th className="align-middle">Location</th>
            <td
              className="truncate align-middle"
              title={user.cityStateCountry ?? ""}
            >
              {user.cityStateCountry}
            </td>
          </tr>
          <tr>
            <th className="align-middle">Created</th>
            <td className="whitespace-nowrap align-middle">
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
    <details className="collapse border border-gray-200">
      <summary className="collapse-title font-semibold">Note</summary>
      <fetcher.Form
        className="collapse-content"
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
    </details>
  );
}

function WorkingMemory({ user }: { user: User }) {
  const workingMemory = cleanParseProfile(user.workingMemory);
  return (
    <details className="collapse border border-gray-200">
      <summary className="collapse-title font-semibold">
        User's working memory
      </summary>
      <pre className="collapse-content text-sm">
        {JSON.stringify(workingMemory, null, 2)}
      </pre>
    </details>
  );
}

function FullChat({
  chat,
}: {
  chat: ChatGetPayload<{ include: { messages: true } }>;
}) {
  const timestamp = chat.createdAt;
  return (
    <details className="collapse border border-gray-200" open>
      <summary className="collapse-title flex justify-between gap-2 font-semibold">
        <span>{chat.title ?? "Untitled chat"}</span>
        <span className="text-gray-500">
          {timestamp.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
          })}
        </span>
      </summary>

      <Messages
        key={chat.id}
        isAborted={false}
        error={undefined}
        isTyping={false}
        messages={chat.messages.map((message) => ({
          id: message.id,
          parts: message.content as TextUIPart[],
          role: message.role,
        }))}
        setQuery={() => {}}
      />
    </details>
  );
}
