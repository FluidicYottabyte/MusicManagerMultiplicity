import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { deleteUser } from "./actions";

export default async function AdminUsersPage({ searchParams }: { searchParams: { error?: string } }) {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { username: "asc" } });

  return (
    <div>
      <h1>Users</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      <Link href="/admin/users/new" className="win-button">
        New User
      </Link>

      <table className="rows win-sunken">
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.isAdmin ? "Admin" : "User"}</td>
              <td>
                {user.id !== admin.id && (
                  <form action={deleteUser.bind(null, user.id)} style={{ display: "inline" }}>
                    <button type="submit" className="win-button small">
                      Delete
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
