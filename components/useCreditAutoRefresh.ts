import { useUserStatus } from "./UserStatusContext";
import { useCallback } from "react";

// Hook trả về hàm gọi API thao tác credit và tự động refresh credit sau khi thành công
export function useCreditAutoRefresh() {
  const { refreshUser } = useUserStatus();

  // wrapper cho các hàm thao tác credit
  const withCreditRefresh = useCallback(
    async (action: () => Promise<any>) => {
      const result = await action();
      // Nếu thao tác thành công, tự động refresh credit
      if (result && (result.success || result.status === 200)) {
        await refreshUser();
      }
      return result;
    },
    [refreshUser]
  );

  return { withCreditRefresh };
}
