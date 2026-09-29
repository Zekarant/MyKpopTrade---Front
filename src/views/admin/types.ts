import type { KpopAlbum } from '@/services/album.service';
import type { KpopGroup } from '@/services/group.service';

export type AdminRole = 'user' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'deleted';

export interface UsernameRef {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface AdminUserSuspension {
  reason: string;
  until?: string;
  suspendedAt: string;
  suspendedBy?: string;
}

export interface AdminUserSanction {
  action: 'suspend' | 'unsuspend';
  reason?: string;
  until?: string;
  at: string;
  by?: UsernameRef | null;
}

export interface AdminNote {
  _id: string;
  content: string;
  author?: UsernameRef | null;
  createdAt: string;
}

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role: AdminRole;
  accountStatus: AccountStatus;
  suspension?: AdminUserSuspension;
  sanctions?: AdminUserSanction[];
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminUserDetail {
  user: AdminUser & {
    adminNotes?: AdminNote[];
    bio?: string;
    location?: string;
  };
  activity: {
    listings: number;
    reportsAgainst: number;
    reportsFiled: number;
    disputes: number;
  };
}

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newUsers: number;
}

export interface AdminProductStats {
  total: number;
  available: number;
  sold: number;
  suspended: number;
  newProducts: number;
  recentSales: number;
  totalRevenue: number;
  typeDistribution: Record<string, number>;
}

export interface AdminTimeseriesPoint {
  date: string;
  signups: number;
  listings: number;
  sales: number;
  revenue: number;
  reports: number;
}

export interface AdminQueueItem {
  kind: 'report' | 'dispute' | 'verification' | 'deletion' | 'product_flagged';
  id: string;
  label: string;
  detail: string;
  subject: string;
  waitingSince: string;
  tab: string;
}

export interface AdminQueue {
  items: AdminQueueItem[];
  counts: Record<string, number>;
  total: number;
  oldestWaitingSince: string | null;
}

export interface AdminSearchResult {
  kind: 'user' | 'product' | 'post';
  id: string;
  label: string;
  detail: string;
  tab: string;
  search: string;
}

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'rejected';

export interface AdminReport {
  _id: string;
  reporter: UsernameRef | null;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ReportTargetOwner {
  _id: string;
  username: string;
  profilePicture?: string;
  accountStatus: AccountStatus;
  role: AdminRole;
  isIdentityVerified?: boolean;
}

export interface ReportTarget {
  type: 'user' | 'post' | 'product' | 'rating';
  id: string;
  label: string;
  excerpt: string;
  images: string[];
  owner: ReportTargetOwner | null;
  createdAt: string;
  meta: {
    price?: number;
    currency?: string;
    condition?: string;
    productType?: string;
    isSold?: boolean;
    isAvailable?: boolean;
    rating?: number;
    isHidden?: boolean;
    recipient?: UsernameRef | null;
    isReply?: boolean;
    likesCount?: number;
    repliesCount?: number;
    location?: string;
    isSuspended?: boolean;
  };
}

export interface AdminReportDetail {
  report: AdminReport;
  reasonLabel: string;
  target: ReportTarget | null;
  reporterHistory: {
    total: number;
    resolved: number;
    rejected: number;
    pending: number;
  };
  targetHistory: { totalReports: number };
}

export interface AdminAuditLog {
  _id: string;
  admin: UsernameRef | null;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminPost {
  _id: string;
  author: (UsernameRef & { isIdentityVerified?: boolean }) | null;
  content: string;
  images?: string[];
  isReply: boolean;
  likesCount?: number;
  repliesCount?: number;
  createdAt: string;
}

export interface ProductModerationFlag {
  suspect: boolean;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  categories: string[];
  matchedKeywords: string[];
  analyzedAt: string;
  reviewedAt?: string;
  reviewDecision?: 'approved' | 'rejected';
}

export interface AdminProduct {
  _id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  type: string;
  condition?: string;
  images: string[];
  isAvailable: boolean;
  isSold: boolean;
  seller: UsernameRef | null;
  createdAt: string;
  moderationFlag?: ProductModerationFlag;
}

/** Le filtre `status=suspended` ne renvoie que des annonces analysées par la modération IA. */
export type AdminFlaggedProduct = AdminProduct & { moderationFlag: ProductModerationFlag };

export interface AdminVerification {
  _id: string;
  user: { _id: string; username: string; email?: string } | null;
  status: 'pending' | 'approved' | 'rejected';
  documentType: string;
  submittedAt: string;
  createdAt?: string;
}

export interface DeletionRequest {
  _id: string;
  username: string;
  email: string;
  scheduledDeletionDate?: string;
  createdAt: string;
}

export type CatalogEntity = Partial<KpopGroup> & Partial<KpopAlbum> & { _id: string; name: string };
