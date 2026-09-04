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

export interface EventSummary {
  id: string;
  title: string;
  sport: string;
  location: string;
  eventDate: string;
}

export interface SportEvent {
  id: string;
  title: string;
  sport: string;
  location: string;
  eventDate: string;
  coverUrl: string | null;
  photoCount: number;
  fromPrice: number | null;
  photographer?: Photographer;
  createdAt: string;
}

export interface EventListResponse {
  items: SportEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SportCount {
  slug: string;
  count: number;
}

export interface Photo {
  id: string;
  title: string;
  description: string | null;
  price: number;
  width: number;
  height: number;
  downloads: number;
  createdAt: string;
  previewUrl: string;
  thumbUrl: string;
  photographer?: Photographer;
  event?: EventSummary;
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
  photo: { id: string; title: string };
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export interface DashboardStats {
  totalEvents: number;
  totalPhotos: number;
  totalRevenue: number;
  totalSales: number;
  totalDownloads: number;
  topPhotos: { photoId: string; title: string; sales: number; revenue: number }[];
  recentSales: { id: string; photoTitle: string; price: number; date: string }[];
}
