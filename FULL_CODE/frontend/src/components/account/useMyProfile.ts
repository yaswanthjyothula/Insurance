"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { MyProfile, Preferences } from "@/types/account";

export function useMyProfile() {
  const [data, setData] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchFromAPI<MyProfile>("/me/profile", { signal: controller.signal })
      .then((profile) => {
        setData(profile);
        setError(null);
      })
      .catch((failure: unknown) => !controller.signal.aborted && setError(errorMessage(failure, "We couldn't load your profile.")));
    return () => controller.abort();
  }, [reloadCount]);

  /** Saves some preferences and keeps the others as they are. */
  const savePreferences = useCallback(
    async (patch: Partial<Preferences>) => {
      if (!data) return;
      const saved = await fetchFromAPI<Preferences>("/me/preferences", {
        method: "PUT",
        body: JSON.stringify({ ...data.preferences, ...patch }),
      });
      setData({ ...data, preferences: saved });
    },
    [data],
  );

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);
  return { data, error, reload, savePreferences };
}
