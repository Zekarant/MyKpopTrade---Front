import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useAdminQueryState<T extends Record<string, string | number>>(
  defaults: T,
  reload: () => void
) {
  const route = useRoute();
  const router = useRouter();
  const state = reactive({ ...defaults }) as T;

  const readQueryValue = (key: string): string | undefined => {
    const raw = route.query[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === 'string' && value !== '' ? value : undefined;
  };

  (Object.keys(defaults) as (keyof T & string)[]).forEach((key) => {
    const value = readQueryValue(key);
    if (value === undefined) return;

    if (typeof defaults[key] === 'number') {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        (state as Record<string, unknown>)[key] = parsed;
      }
      return;
    }
    (state as Record<string, unknown>)[key] = value;
  });

  const syncUrl = () => {
    const query: Record<string, string> = {};
    const tab = readQueryValue('tab');
    if (tab) query.tab = tab;

    (Object.keys(defaults) as (keyof T & string)[]).forEach((key) => {
      const value = state[key];
      if (value !== defaults[key] && value !== '' && value !== undefined) {
        query[key] = String(value);
      }
    });

    router.replace({ query });
  };

  const commit = (patch: Partial<T> = {}) => {
    Object.assign(state, patch);
    syncUrl();
    reload();
  };

  return { state, commit };
}
