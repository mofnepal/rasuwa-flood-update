import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { formatAsOf } from '@/lib/format';
import { CreateUserForm, UserRow } from './UserForms';

export default async function UsersPage() {
  await requireRole('admin');
  const users = await prisma.user.findMany({ orderBy: [{ role: 'desc' }, { name: 'asc' }] });

  return (
    <>
      <div>
        <h1>प्रयोगकर्ता · Accounts</h1>
        <p className="lede">
          प्रविष्टि → प्रमाणक → प्रकाशक → प्रशासक। माथिल्लो भूमिकाले तलका सबै काम गर्न सक्छ। · Each
          role can do everything the roles below it can.
        </p>
      </div>

      <div className="card">
        <h2>नयाँ खाता · New account</h2>
        <div style={{ marginTop: 12 }}>
          <CreateUserForm />
        </div>
      </div>

      <div className="card">
        <h2>खाताहरू · Accounts</h2>
        <div className="tscroll" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>नाम · Name</th>
                <th>इमेल · Email</th>
                <th>भूमिका · Role</th>
                <th>अवस्था · State</th>
                <th>अन्तिम प्रवेश · Last sign-in</th>
                <th>कार्य · Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="nm">{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="pill verified">{user.role}</span>
                  </td>
                  <td>
                    <span className={`pill ${user.active ? 'published' : 'archived'}`}>
                      {user.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td>{user.lastLoginAt ? formatAsOf(user.lastLoginAt, 'en') : '—'}</td>
                  <td>
                    <UserRow id={user.id} role={user.role} active={user.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
