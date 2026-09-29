import type { AlbumPayload, AlbumType, KpopAlbum } from '@/services/album.service';
import type { GroupPayload, KpopGroup } from '@/services/group.service';

export const ALBUM_TYPE_LABELS: Record<AlbumType, string> = {
  album: 'Album',
  ep: 'EP / Mini album',
  single: 'Single',
  compilation: 'Compilation'
};

export interface GroupFormState {
  name: string;
  profileImage: string;
  membersRaw: string;
}

export interface AlbumFormState {
  name: string;
  artistId: string;
  albumType: AlbumType | '';
  releaseDate: string;
  coverImage: string;
}

export const albumArtistId = (album: Pick<KpopAlbum, 'artistId'>): string =>
  (typeof album.artistId === 'object' ? album.artistId?._id : album.artistId) || '';

export const groupFormFrom = (group?: Pick<KpopGroup, 'name' | 'profileImage' | 'members'>): GroupFormState => ({
  name: group?.name ?? '',
  profileImage: group?.profileImage ?? '',
  membersRaw: (group?.members ?? []).join(', ')
});

export const albumFormFrom = (
  album?: Pick<KpopAlbum, 'name' | 'artistId' | 'albumType' | 'releaseDate' | 'coverImage'>
): AlbumFormState => ({
  name: album?.name ?? '',
  artistId: album ? albumArtistId(album) : '',
  albumType: album?.albumType ?? '',
  releaseDate: album?.releaseDate ? String(album.releaseDate).substring(0, 10) : '',
  coverImage: album?.coverImage ?? ''
});

/** Les champs vides ne sont pas envoyés : en édition, la valeur existante est conservée. */
export const buildGroupPayload = (form: GroupFormState): GroupPayload & { name: string } => {
  const payload: GroupPayload & { name: string } = { name: form.name.trim() };
  if (form.profileImage.trim()) payload.profileImage = form.profileImage.trim();
  const members = form.membersRaw
    .split(',')
    .map((member) => member.trim())
    .filter(Boolean);
  if (members.length) payload.members = members;
  return payload;
};

export const buildAlbumPayload = (form: AlbumFormState): AlbumPayload & { name: string } => {
  const payload: AlbumPayload & { name: string } = { name: form.name.trim() };
  if (form.artistId) payload.artistId = form.artistId;
  if (form.albumType) payload.albumType = form.albumType;
  if (form.releaseDate) payload.releaseDate = form.releaseDate;
  if (form.coverImage.trim()) payload.coverImage = form.coverImage.trim();
  return payload;
};
