'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, ShoppingBag, Aperture } from 'lucide-react';
import { useAuth, ApiRequestError } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { toast } from '@/lib/toast-store';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await register(name, email, password, role);
      toast({ title: 'Conta criada com sucesso!', variant: 'success' });
      router.push(user.role === 'PHOTOGRAPHER' ? '/dashboard' : '/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Não foi possível criar sua conta.');
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
          <h1 className="mt-4 font-display text-2xl font-medium text-ink-950">Criar conta</h1>
          <p className="mt-1 text-sm text-ink-900/50">Compre fotos em HD ou venda o seu trabalho.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-card">
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              icon={ShoppingBag}
              title="Comprador"
              description="Quero comprar fotos"
              active={role === 'BUYER'}
              onClick={() => setRole('BUYER')}
            />
            <RoleCard
              icon={Aperture}
              title="Fotógrafo"
              description="Quero vender fotos"
              active={role === 'PHOTOGRAPHER'}
              onClick={() => setRole('PHOTOGRAPHER')}
            />
          </div>

          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="secondary" size="lg" className="w-full" loading={loading}>
            Criar conta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-900/60">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-ink-950 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition',
        active ? 'border-accent-500 bg-accent-500/10' : 'border-ink-900/10 hover:border-ink-900/25'
      )}
    >
      <Icon className={cn('h-5 w-5', active ? 'text-accent-600' : 'text-ink-900/50')} />
      <span className="text-sm font-semibold text-ink-950">{title}</span>
      <span className="text-xs text-ink-900/50">{description}</span>
    </button>
  );
}
