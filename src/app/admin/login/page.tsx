import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/permissions';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  if (await currentUser()) redirect('/admin');
  return (
    <div className="adm-login">
      <div className="card">
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>प्रशासन प्रवेश</h1>
        <p className="lede" style={{ marginBottom: 18 }}>
          Sign in — Ministry of Finance, Fund Section
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
