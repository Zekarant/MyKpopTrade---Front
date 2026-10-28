import { computed, ref, watch, type Ref } from 'vue';
import axios from 'axios';
import groupService, { type KpopGroup } from '@/services/group.service';
import type { KpopAlbum } from '@/services/album.service';
import type { PostData } from '@/types/post.types';

interface KpopCatalogFields {
  form: Ref<PostData>;
  /** Texte du champ groupe : saisie en cours, ou nom du groupe choisi. */
  groupLabel: Ref<string>;
  /** Texte du champ album : saisie en cours, ou nom de l'album choisi. */
  albumLabel: Ref<string>;
}

async function fetchGroups(query: string): Promise<KpopGroup[]> {
  try {
    const response = query.trim()
      // `params` encode les « & », « # » ou « + » de la saisie (ex. « (G)I-DLE »).
      ? await axios.get(`${import.meta.env.VITE_API_URL}/api/groups/search`, { params: { query } })
      // Sans `limit`, l'API n'en rend que 20 : la liste déroulante doit proposer
      // tout le catalogue (plafonné à 2000 côté API).
      : await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`, { params: { limit: 2000 } });
    return response.data.groups || [];
  } catch (error) {
    console.error('Erreur lors du chargement des groupes K-pop:', error);
    return [];
  }
}

/**
 * Métadonnées K-pop d'une annonce tirées du catalogue : recherche de groupe,
 * puis membres et albums du groupe choisi.
 */
export function useKpopCatalog({ form, groupLabel, albumLabel }: KpopCatalogFields) {
  const groups = ref<KpopGroup[]>([]);
  const albums = ref<KpopAlbum[]>([]);
  /** Membres du groupe choisi selon le catalogue ; vide = saisie libre. */
  const members = ref<string[]>([]);

  // Une réponse lente ne doit pas écraser celle d'une frappe plus récente.
  let latestGroupRequest = 0;
  async function refreshGroups(query: string) {
    const request = ++latestGroupRequest;
    const list = await fetchGroups(query);
    if (request === latestGroupRequest) groups.value = list;
  }

  refreshGroups('');
  watch(groupLabel, (query) => refreshGroups(query ?? ''));

  const filteredAlbums = computed(() => {
    const search = albumLabel.value?.trim().toLowerCase();
    if (!search) return albums.value;
    return albums.value.filter((album) => album.name.toLowerCase().includes(search));
  });

  /** Membres et albums du groupe, en une requête (la recherche de groupes ne renvoie pas les membres). */
  async function loadGroupCatalog(groupId: string) {
    try {
      const { group, albums: groupAlbums } = await groupService.getGroupDetail(groupId);
      members.value = group.members ?? [];
      albums.value = groupAlbums;
    } catch (error) {
      console.error('Erreur lors du chargement des membres et albums du groupe:', error);
      members.value = [];
      albums.value = [];
    }
  }

  function selectGroup(group: KpopGroup) {
    form.value.kpopGroup = group._id;
    form.value.group = group._id;
    groupLabel.value = group.name;
    // Album et membre appartiennent à l'ancien groupe : l'API les refuserait.
    form.value.albumName = '';
    form.value.album = null;
    form.value.kpopMember = '';
    albumLabel.value = '';
    albums.value = [];
    members.value = [];
    loadGroupCatalog(group._id);
  }

  function selectAlbum(album: KpopAlbum) {
    form.value.albumName = album._id;
    form.value.album = album._id;
    albumLabel.value = album.name;
  }

  if (form.value.group) {
    loadGroupCatalog(form.value.group);
  }

  // Le membre structuré n'est envoyé que s'il figure au catalogue du groupe
  // (ou si le groupe n'a pas de liste) : sinon l'API refuserait l'annonce,
  // alors que le champ libre `kpopMember` suffit.
  watch([() => form.value.kpopMember, members], ([kpopMember, list]) => {
    const name = kpopMember?.trim() ?? '';
    form.value.member = name && (list.length === 0 || list.includes(name)) ? name : null;
  }, { immediate: true });

  return { groups, filteredAlbums, members, selectGroup, selectAlbum };
}
