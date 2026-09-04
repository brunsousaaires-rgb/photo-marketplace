'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { useAuth, ApiRequestError } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { toast } from '@/lib/toast-store';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      toast({ title: `Bem-vindo(a), ${user.name.split(' ')[0]}!`, variant: 'success' });
      router.push(user.role === 'PHOTOGRAPHER' ? '/dashboard' : '/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[calc(100vh-64px)] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-950 text-accent-400">
            <Camera className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-medium text-ink-950">Entrar na sua conta</h1>
          <p className="mt-1 text-sm text-ink-900/50">Acesse suas compras ou seu painel de fotógrafo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-card">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="secondary" size="lg" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-900/60">
          Não tem conta?{' '}
          <Link href="/register" className="font-medium text-ink-950 hover:underline">
            Cadastre-se
          </Link>
        </p>

        <div className="mt-8 rounded-xl bg-ink-950/5 p-4 text-xs text-ink-900/60">
          <p className="font-semibold text-ink-900/80">Contas de demonstração</p>
          <p className="mt-1">Fotógrafo: fotografo@exemplo.com / fotografo123</p>
          <p>Comprador: comprador@exemplo.com / comprador123</p>
        </div>
      </div>
    </div>
  );
}
