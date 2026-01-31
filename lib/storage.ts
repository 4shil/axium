// Simple file-based storage for serverless environments
// In production, use Vercel KV, Upstash Redis, or a proper database

import { promises as fs } from 'fs';
import path from 'path';

export interface FileMetadata {
  id: string;
  slug: string;
  b2ObjectKey: string;
  originalName: string;
  size: number;
  mimeType: string | null;
  expiresAt: string;
  passwordHash: string | null;
  oneTimeDownload: boolean;
  maxDownloads: number | null;
  downloadCount: number;
  createdAt: string;
}

// In-memory store (works for single instance, not for production scale)
const memoryStore = new Map<string, FileMetadata>();

export async function createFile(data: Omit<FileMetadata, 'createdAt'>): Promise<FileMetadata> {
  const file: FileMetadata = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  memoryStore.set(data.slug, file);
  return file;
}

export async function getFileBySlug(slug: string): Promise<FileMetadata | null> {
  return memoryStore.get(slug) || null;
}

export async function updateFile(slug: string, updates: Partial<FileMetadata>): Promise<FileMetadata | null> {
  const existing = memoryStore.get(slug);
  if (!existing) return null;
  
  const updated = { ...existing, ...updates };
  memoryStore.set(slug, updated);
  return updated;
}

export async function deleteFile(slug: string): Promise<boolean> {
  return memoryStore.delete(slug);
}

export async function getExpiredFiles(): Promise<FileMetadata[]> {
  const now = new Date();
  const expired: FileMetadata[] = [];
  
  for (const file of memoryStore.values()) {
    if (new Date(file.expiresAt) <= now) {
      expired.push(file);
    }
  }
  
  return expired;
}

export async function slugExists(slug: string): Promise<boolean> {
  return memoryStore.has(slug);
}
