import { Link, type LoaderFunctionArgs } from "react-router";
import { Fragment } from "react/jsx-runtime";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/sessions.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { isBot: false },
  });
  return { users };
}

export default function UsersPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <section className="m-full overflow-x-auto">
      <table className="table-zebra table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>User Agent</th>
            <th>Referrer</th>
            <th>IP</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.users.map((user) => (
            <Fragment key={user.id}>
              <tr>
                <td title={`${user.name} (${user.id})`}>
                  <Link
                    className="link link-primary w-14 max-w-14 truncate"
                    to={`/admin/user/${user.id}`}
                  >
                    {user.isAnonymous ? user.id : (user.name ?? user.id)}
                  </Link>
                </td>
                <td className="max-w-24 truncate" title={user.email ?? ""}>
                  {user.email}
                </td>
                <td className="max-w-24 truncate" title={user.userAgent ?? ""}>
                  {user.userAgent}
                </td>
                <td className="max-w-24 truncate" title={user.referrer ?? ""}>
                  {user.referrer}
                </td>
                <td className="max-w-18 truncate" title={user.ip ?? ""}>
                  {user.ip}
                </td>
                <td className="max-w-8 whitespace-nowrap">
                  {user.createdAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
              <tr>
                <td />
                <td colSpan={6}>
                  <div className="items-top flex gap-2">
                    <span className="font-semibold">Note:</span>
                    <span className="text-sm">{user.note}</span>
                  </div>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}
