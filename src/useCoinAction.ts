import { coinActionLabel, AI_ACTIONS } from "../shared/economy";
import { useCoinWallet } from "./context/CoinWalletContext";
import { getCurrentAuthUser } from "./services/authService";

export function useCoinAction(path: string) {
  const { wallet } = useCoinWallet();
  const user = getCurrentAuthUser();
  const action = AI_ACTIONS[path];
  const unlimited = user.isUnlimited === true;
  const insufficient = Boolean(action && !unlimited && wallet && action.cost > wallet.total);
  return {
    action,
    insufficient,
    label: coinActionLabel(path, wallet?.total ?? null, unlimited),
  };
}
