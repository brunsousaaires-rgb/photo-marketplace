'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, CalendarDays, DollarSign, Download, ImageIcon, MapPin, Plus, Trophy, X } from 'lucide-react';
import { apiFetch, resolveFileUrl } from '@/lib/api';
import type { DashboardStats, SportEvent } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreateEventForm } from '@/components/CreateEventForm';
import { sportInfo } from '@/lib/sports';
import { formatDate, formatPrice } from '@/lib/utils';

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  function loadData() {
    Promise.all([apiFetch<DashboardStats>('/dashboard/stats'), apiFetch<{ items: SportEvent[] }>('/events/mine')])
      .then(([statsRes, eventsRes]) => {
        setStats(statsRes);
        setEvents(eventsRes.items);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'PHOTOGRAPHER') {
      setLoading(false);
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (!authLoading && (!user || user.role !== 'PHOTOGRAPHER')) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <p className="text-ink-900/60">Esta área é exclusiva para contas de fotógrafo.</p>
        <Link href="/login" className="mt-4 text-sm font-medium text-ink-950 underline">
          Entrar com uma conta de fotógrafo
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide text-ink-950">Meu painel</h1>
          <p className="mt-1 text-ink-900/50">Crie eventos e publique as fotos de cada jogo.</p>
        </div>
        <Button variant="secondary" size="lg" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Fechar' : 'Criar evento'}
        </Button>
      </div>

      {showCreate && (
        <Card className="mt-6 max-w-xl p-6">
          <CreateEventForm
            onCreated={(event) => {
              setEvents((prev) => [event, ...prev]);
              setShowCreate(false);
              setStats((prev) => (prev ? { ...prev, totalEvents: prev.totalEvents + 1 } : prev));
            }}
          />
        </Card>
      )}

      {loading ? (
        <p className="mt-10 text-ink-900/50">Carregando...</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard icon={Trophy} label="Eventos" value={stats?.totalEvents ?? 0} />
            <StatCard icon={ImageIcon} label="Fotos publicadas" value={stats?.totalPhotos ?? 0} />
            <StatCard icon={DollarSign} label="Receita total" value={formatPrice(stats?.totalRevenue ?? 0)} />
            <StatCard icon={BarChart3} label="Vendas" value={stats?.totalSales ?? 0} />
            <StatCard icon={Download} label="Downloads" value={stats?.totalDownloads ?? 0} />
          </div>

          <h2 className="mb-4 mt-10 font-display text-xl uppercase tracking-wide text-ink-950">Seus eventos</h2>
          {events.length === 0 ? (
            <p className="text-ink-900/50">Você ainda não criou nenhum evento. Clique em &quot;Criar evento&quot; para começar a publicar fotos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const sport = sportInfo(event.sport);
                return (
                  <Link key={event.id} href={`/dashboard/eventos/${event.id}`}>
                    <Card className="overflow-hidden transition hover:shadow-card-hover">
                      <div className="relative aspect-[16/9] w-full bg-ink-900">
                        {event.coverUrl ? (
                          <Image src={resolveFileUrl(event.coverUrl)} alt={event.title} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl">{sport.emoji}</div>
                        )}
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-950">
                          {sport.emoji} {sport.label}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="truncate font-semibold text-ink-950">{event.title}</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-900/50">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> {formatEventDate(event.eventDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-accent-600">{event.photoCount} foto{event.photoCount === 1 ? '' : 's'} · gerenciar</p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {stats && stats.recentSales.length > 0 && (
            <>
              <h2 className="mb-4 mt-10 font-display text-xl uppercase tracking-wide text-ink-950">Vendas recentes</h2>
              <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white shadow-card">
                {stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-ink-950">{sale.photoTitle}</p>
                      <p className="text-sm text-ink-900/50">{formatDate(sale.date)}</p>
                    </div>
                    <span className="font-semibold text-emerald-600">+{formatPrice(sale.price)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-600">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 font-display text-xl text-ink-950">{value}</p>
      <p className="text-sm text-ink-900/50">{label}</p>
    </Card>
  );
}
