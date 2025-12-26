import type { TextUIPart } from "ai";
import { ArrowLeft, ArrowRight, CircleCheck, InfoIcon } from "lucide-react";
import { DateTime } from "luxon";
import type { User } from "prisma/generated/client";
import type {
  ChatGetPayload,
  PropertyGetPayload,
} from "prisma/generated/models";
import { Link, useFetcher } from "react-router";
import { StickToBottom } from "use-stick-to-bottom";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Button } from "~/components/ui/Button";
import { FieldSet } from "~/components/ui/FieldSet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "~/components/ui/Table";
import { Textarea } from "~/components/ui/Textarea";
import deviceDetection from "~/lib/deviceDetection";
import findNearbyCenters from "~/lib/findNearbyCenters";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
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

  const { centers } = await findNearbyCenters({ headers: new Headers(), user });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return { user, users, centers };
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
  return (
    <StickToBottom
      className="prose mx-auto space-y-4"
      initial="smooth"
      resize="smooth"
    >
      <UserInfoCard user={loaderData.user} />
      <WorkingMemory user={loaderData.user} />
      <Geocode user={loaderData.user} />
      <EditNote user={loaderData.user} />

      {loaderData.user.chats.map((chat) => (
        <FullChat key={chat.id} chat={chat} />
      ))}

      <Pagination user={loaderData.user} users={loaderData.users} />

      <Centers centers={loaderData.centers} />
    </StickToBottom>
  );
}

function UserInfoCard({ user }: { user: User }) {
  const workingMemory = cleanParseWorkingMemory(user.workingMemory);
  const timeZone = workingMemory.location?.timeZone ?? "UTC";
  const utm = user.utm ? JSON.parse(user.utm as string) : undefined;

  return (
    <details className="rounded-lg border-2 border-gray-400 p-4" open>
      <summary className="font-semibold">{user.name || user.id}</summary>
      <Table>
        <TableBody>
          {!user.isAnonymous && <Row title="Email" value={user.email} />}
          <Row title="User Agent" value={user.userAgent} />
          <Row title="Referrer" value={user.referrer} />
          <Row title="IP" value={user.ip} />
          <Row
            title="Location"
            value={workingMemory.location?.displayName ?? null}
          />
          <Row title="Device" value={deviceDetection(user.userAgent)} />
          <Row title="Viewport" value={user.viewport as string} />
          {utm &&
            Object.entries<string>(utm)
              .filter(
                ([key]) =>
                  key !== "ip" && key !== "userAgent" && key !== "referer",
              )
              .map(([key, value]) => (
                <Row key={key} title={`UTM ${key}`} value={value} />
              ))}
          <Row
            title="Created"
            value={DateTime.fromJSDate(user.createdAt)
              .setZone(timeZone)
              .toLocaleString(DateTime.DATETIME_FULL)}
          />
        </TableBody>
      </Table>
    </details>
  );
}

function Row({ title, value }: { title: string; value: string | null }) {
  return (
    <TableRow>
      <TableHead className="align-middle">{title}</TableHead>
      <TableCell
        className="max-w-120 truncate align-middle"
        title={value ?? undefined}
      >
        {value}
      </TableCell>
    </TableRow>
  );
}

function EditNote({ user }: { user: User }) {
  const fetcher = useFetcher<typeof action>();
  return (
    <details className="rounded-lg border-2 border-gray-400 p-4 print:hidden">
      <summary className="font-semibold">Note</summary>
      <fetcher.Form
        onSubmit={(event) => {
          event.preventDefault();
          fetcher.submit(event.currentTarget, {
            method: "post",
          });
        }}
      >
        <FieldSet className="mt-4">
          <Textarea id="note" defaultValue={user.note ?? ""} name="note" />

          <div className="flex justify-end">
            <Button
              disabled={fetcher.state !== "idle"}
              type="submit"
              variant={fetcher.data?.name ? "secondary" : "default"}
            >
              {fetcher.state !== "idle" ? (
                <span className="loading loading-spinner" />
              ) : fetcher.data ? (
                <CircleCheck className="h-6 w-6 shrink-0 stroke-current" />
              ) : null}
              {fetcher.state !== "idle" ? "Saving..." : "Save"}
            </Button>
          </div>
        </FieldSet>
      </fetcher.Form>
    </details>
  );
}

function WorkingMemory({ user }: { user: User }) {
  const workingMemory = cleanParseWorkingMemory(user.workingMemory);
  return (
    <details className="rounded-lg border-2 border-gray-400 p-4 print:hidden">
      <summary className="font-semibold">User's working memory</summary>
      <pre className="not-prose">{JSON.stringify(workingMemory, null, 2)}</pre>
    </details>
  );
}

function Geocode({ user }: { user: User }) {
  return (
    <details className="rounded-lg border-2 border-gray-400 p-4 print:hidden">
      <summary className="font-semibold">Original geocode</summary>
      <pre className="not-prose">{JSON.stringify(user.geocode, null, 2)}</pre>
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
    <details
      className="rounded-lg border-2 border-gray-400 p-4 print:break-before-page"
      open
    >
      <summary className="flex justify-between gap-2 font-semibold">
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

      <div className="flex w-full flex-col">
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
      </div>
    </details>
  );
}

function Pagination({ user, users }: { user: User; users: { id: string }[] }) {
  const index = users.findIndex((u) => u.id === user.id);
  const older = users[index - 1];
  const newer = users[index + 1];

  return (
    <div className="flex justify-between">
      <ActiveLink disabled={!older} to={`/admin/user/${older?.id}`}>
        <ArrowLeft className="h-5 w-5" />
        <span>Older</span>
      </ActiveLink>

      <ActiveLink disabled={!newer} to={`/admin/user/${newer?.id}`}>
        Newer
        <ArrowRight className="h-4 w-4" />
      </ActiveLink>
    </div>
  );
}

function Centers({
  centers,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  if (centers.length === 0) return null;

  return (
    <details className="rounded-lg border-2 border-gray-400 p-4 print:hidden">
      <summary className="font-semibold">Nearby Centers</summary>
      <Table>
        <TableBody>
          {centers
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((center) => (
              <TableRow key={center.id} className="hover:bg-gray-100">
                <TableHead className="max-w-48 truncate">
                  <Link
                    className="truncate text-blue-500 underline hover:decoration-[hsl(37,92%,65%)]"
                    target="_blank"
                    to={`/center/${center.id}`}
                  >
                    {center.name}
                  </Link>
                </TableHead>
                <TableHead className="w-48">{center.city}</TableHead>
                <TableHead className="w-6">{center.state}</TableHead>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <p className="flex items-center gap-2">
        <InfoIcon className="h-4 w-4" />
        These are the centers that were found nearby the user.
      </p>
    </details>
  );
}
