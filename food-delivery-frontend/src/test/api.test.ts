import { describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
} from '../api/client';
import { groupOrderDishes, hasRole, type DisplayDishDto } from '../types/api';

describe('Role hierarchy & order grouping helpers', () => {
  it('evaluates role hierarchy accurately', () => {
    expect(hasRole('ROLE_ADMIN', 'ROLE_CUSTOMER')).toBe(true);
    expect(hasRole('ROLE_ADMIN', 'ROLE_OWNER')).toBe(true);
    expect(hasRole('ROLE_ADMIN', 'ROLE_ADMIN')).toBe(true);

    expect(hasRole('ROLE_OWNER', 'ROLE_CUSTOMER')).toBe(true);
    expect(hasRole('ROLE_OWNER', 'ROLE_OWNER')).toBe(true);
    expect(hasRole('ROLE_OWNER', 'ROLE_ADMIN')).toBe(false);

    expect(hasRole('ROLE_CUSTOMER', 'ROLE_CUSTOMER')).toBe(true);
    expect(hasRole('ROLE_CUSTOMER', 'ROLE_OWNER')).toBe(false);
    expect(hasRole(undefined, 'ROLE_CUSTOMER')).toBe(false);
  });

  it('groups duplicate dishes in an order into counts and line totals', () => {
    const burger: DisplayDishDto = {
      id: 1,
      name: 'Classic Burger',
      description: 'Beef patty',
      price: 12.5,
      quantity: 5,
      restaurantId: 1,
    };
    const fries: DisplayDishDto = {
      id: 2,
      name: 'Fries',
      description: 'Crispy',
      price: 4.0,
      quantity: 10,
      restaurantId: 1,
    };

    const grouped = groupOrderDishes([burger, fries, burger]);
    expect(grouped.totalCount).toBe(3);
    expect(grouped.totalPrice).toBe(29.0);
    expect(grouped.items).toHaveLength(2);
    expect(grouped.items[0]).toEqual({
      dish: burger,
      count: 2,
      lineTotal: 25.0,
    });
    expect(grouped.items[1]).toEqual({
      dish: fries,
      count: 1,
      lineTotal: 4.0,
    });
  });
});

describe('API client auth header & 401 handling', () => {
  it('attaches Bearer token from storage and invokes unauthorized handler on 401', async () => {
    setStoredToken('test-jwt-123');
    expect(getStoredToken()).toBe('test-jwt-123');

    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          timestamp: '2026-11-14T00:00:00Z',
          status: 401,
          error: 'Unauthorized',
          message: 'JWT expired',
          path: '/api/orders/pending',
        }),
        {
          status: 401,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/api/orders/pending')).rejects.toThrow(
      'JWT expired',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-jwt-123',
    );
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
  });
});
