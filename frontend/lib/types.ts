export type Role = 'BUYER' | 'PHOTOGRAPHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
}

export interface Photographer {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Photo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  width: number;
  height: number;
  downloads: number;
  createdAt: string;
  previewUrl: string;
  thumbUrl: string;
  photographer?: Photographer;
  purchased?: boolean;
}

export interface PhotoListResponse {
  items: Photo[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OrderItem {
  id: string;
  price: number;
  photo: { id: string; title: string; category: string };
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export interface DashboardStats {
  totalPhotos: number;
  totalRevenue: number;
  totalSales: number;
  totalDownloads: number;
  topPhotos: { photoId: string; title: string; sales: number; revenue: number }[];
  recentSales: { id: string; photoTitle: string; price: number; date: string }[];
}
