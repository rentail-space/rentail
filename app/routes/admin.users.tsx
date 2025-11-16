import { Link } from "react-router";
import prisma from "~/lib/prisma";

export async function loader() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
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
          <tr key={user.id}>
            <td valign="top" className="align-top">
              <Link className="link link-primary" to={`/admin/user/${user.id}`}>
                {user.name ?? user.id}
              </Link>
            </td>
            <td valign="top">
              <span className="line-clamp-1">{user.email}</span>
            </td>
            <td valign="top">
              <span className="line-clamp-1">{user.userAgent}</span>
            </td>
            <td valign="top">
              <span className="line-clamp-1">{user.referrer}</span>
            </td>
            <td valign="top">{user.ip}</td>
            <td valign="top" className="whitespace-nowrap">
              {user.createdAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
