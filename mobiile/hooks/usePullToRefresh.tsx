import { useCallback, useMemo, useState } from "react";
import { RefreshControl } from "react-native";

const REFRESH_TINT = "#22C55E";

export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={REFRESH_TINT}
        colors={[REFRESH_TINT]}
        progressBackgroundColor="#101826"
      />
    ),
    [refreshing, handleRefresh],
  );

  return { refreshControl, refreshing, onRefresh: handleRefresh };
}
