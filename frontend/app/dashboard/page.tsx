'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, DollarSign, Download, ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { apiFetch, resolveFileUrl } from '@/lib/api';
import type { DashboardStats, Photo } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadForm } from '@/components/UploadForm';
import { formatDate, formatPrice } from '@/lib/utils';
import { toast } from '@/lib/toast-store';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  function loadData() {
    Promise.all([apiFetch<DashboardStats>('/dashboard/stats'), apiFetch<{ items: Photo[] }>('/photos/mine')])
      .then(([statsRes, photosRes]) => {
        setStats(statsRes);
        setPhotos(photosRes.items);
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

  async function handleDelete(id: string) {
    if (!confirm('Remover esta foto do seu portfólio?')) return;
    try {
      await apiFetch(`/photos/${id}`, { method: 'DELETE' });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Foto removida', variant: 'success' });
    } catch {
      toast({ title: 'Não foi possível remover a foto', variant: 'error' });
    }
  }

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
          <h1 className="font-display text-3xl font-medium text-ink-950">Meu painel</h1>
          <p className="mt-1 text-ink-900/50">Gerencie seu portfólio e acompanhe suas vendas.</p>
        </div>
        <Button variant="secondary" size="lg" onClick={() => setShowUpload((v) => !v)}>
          {showUpload ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showUpload ? 'Fechar' : 'Nova foto'}
        </Button>
      </div>

      {showUpload && (
        <Card className="mt-6 max-w-xl p-6">
          <UploadForm
            onUploaded={(photo) => {
              setPhotos((prev) => [photo, ...prev]);
              setShowUpload(false);
              setStats((prev) => (prev ? { ...prev, totalPhotos: prev.totalPhotos + 1 } : prev));
            }}
          />
        </Card>
      )}

      {loading ? (
        <p className="mt-10 text-ink-900/50">Carregando...</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={ImageIcon} label="Fotos publicadas" value={stats?.totalPhotos ?? 0} />
            <StatCard icon={DollarSign} label="Receita total" value={formatPrice(stats?.totalRevenue ?? 0)} />
            <StatCard icon={BarChart3} label="Vendas" value={stats?.totalSales ?? 0} />
            <StatCard icon={Download} label="Downloads" value={stats?.totalDownloads ?? 0} />
          </div>

          <h2 className="mb-4 mt-10 font-display text-xl font-medium text-ink-950">Seu portfólio</h2>
          {photos.length === 0 ? (
            <p className="text-ink-900/50">Você ainda não publicou nenhuma foto. Clique em &quot;Nova foto&quot; para começar.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative aspect-[4/3] w-full bg-ink-900">
                    <Image src={resolveFileUrl(photo.thumbUrl)} alt={photo.title} fill className="object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="truncate font-medium text-ink-950">{photo.title}</p>
                    <div className="mt-1 flex items-center justify-between text-sm text-ink-900/50">
                      <span>{formatPrice(photo.price)}</span>
                      <span>{photo.downloads} downloads</span>
                    </div>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {stats && stats.recentSales.length > 0 && (
            <>
              <h2 className="mb-4 mt-10 font-display text-xl font-medium text-ink-950">Vendas recentes</h2>
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
      <p className="mt-3 font-display text-2xl font-semibold text-ink-950">{value}</p>
      <p className="text-sm text-ink-900/50">{label}</p>
    </Card>
  );
}
