import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  addDishToOrder,
  cancelPendingOrder,
  confirmPendingOrder,
  fetchPendingOrder,
  removeDishFromOrder,
} from '../api/endpoints';
import {
  groupOrderDishes,
  type DisplayOrderDto,
  type GroupedOrderItem,
} from '../types/api';
import { useAuth } from './AuthContext';

interface OrderContextValue {
  order: DisplayOrderDto | null;
  lastFinishedOrder: DisplayOrderDto | null;
  groupedItems: GroupedOrderItem[];
  totalCount: number;
  totalPrice: number;
  isOrderLoading: boolean;
  isMutatingOrder: boolean;
  orderError: string | null;
  refreshOrder: () => Promise<void>;
  addToOrder: (dishId: number) => Promise<DisplayOrderDto>;
  removeFromOrder: (dishId: number) => Promise<DisplayOrderDto>;
  confirmOrder: () => Promise<DisplayOrderDto>;
  cancelOrder: () => Promise<DisplayOrderDto>;
  clearFinishedOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [order, setOrder] = useState<DisplayOrderDto | null>(null);
  const [lastFinishedOrder, setLastFinishedOrder] =
    useState<DisplayOrderDto | null>(null);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [isMutatingOrder, setIsMutatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const refreshOrder = useCallback(async () => {
    if (!token || !user) {
      setOrder(null);
      return;
    }
    setIsOrderLoading(true);
    setOrderError(null);
    try {
      const pending = await fetchPendingOrder();
      setOrder(pending);
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Could not load pending order.',
      );
    } finally {
      setIsOrderLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) {
      setOrder(null);
      setLastFinishedOrder(null);
      setOrderError(null);
      return;
    }
    void refreshOrder();
  }, [token, user, refreshOrder]);

  const addToOrder = useCallback(async (dishId: number) => {
    setIsMutatingOrder(true);
    setOrderError(null);
    try {
      const updated = await addDishToOrder(dishId);
      setOrder(updated);
      setLastFinishedOrder(null);
      return updated;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to add dish to order.';
      setOrderError(msg);
      throw err;
    } finally {
      setIsMutatingOrder(false);
    }
  }, []);

  const removeFromOrder = useCallback(async (dishId: number) => {
    setIsMutatingOrder(true);
    setOrderError(null);
    try {
      const updated = await removeDishFromOrder(dishId);
      setOrder(updated);
      return updated;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to remove dish from order.';
      setOrderError(msg);
      throw err;
    } finally {
      setIsMutatingOrder(false);
    }
  }, []);

  const confirmOrder = useCallback(async () => {
    setIsMutatingOrder(true);
    setOrderError(null);
    try {
      const finalized = await confirmPendingOrder();
      setLastFinishedOrder(finalized);
      setOrder(null);
      return finalized;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to confirm order.';
      setOrderError(msg);
      throw err;
    } finally {
      setIsMutatingOrder(false);
    }
  }, []);

  const cancelOrder = useCallback(async () => {
    setIsMutatingOrder(true);
    setOrderError(null);
    try {
      const finalized = await cancelPendingOrder();
      setLastFinishedOrder(finalized);
      setOrder(null);
      return finalized;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to cancel order.';
      setOrderError(msg);
      throw err;
    } finally {
      setIsMutatingOrder(false);
    }
  }, []);

  const clearFinishedOrder = useCallback(() => {
    setLastFinishedOrder(null);
  }, []);

  const grouped = useMemo(
    () => groupOrderDishes(order?.dishes ?? []),
    [order?.dishes],
  );

  return (
    <OrderContext.Provider
      value={{
        order,
        lastFinishedOrder,
        groupedItems: grouped.items,
        totalCount: grouped.totalCount,
        totalPrice: grouped.totalPrice,
        isOrderLoading,
        isMutatingOrder,
        orderError,
        refreshOrder,
        addToOrder,
        removeFromOrder,
        confirmOrder,
        cancelOrder,
        clearFinishedOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return ctx;
}
