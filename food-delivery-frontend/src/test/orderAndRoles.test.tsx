import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { setStoredToken } from '../api/client';
import { Navbar } from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { OrderProvider } from '../context/OrderContext';
import { OrderPage } from '../pages/OrderPage';

function mockAuthenticatedFetch(role: 'ROLE_CUSTOMER' | 'ROLE_OWNER' | 'ROLE_ADMIN') {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/api/user/me')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            username: 'alice',
            name: 'Alice',
            surname: 'Smith',
            email: 'alice@example.com',
            role,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    }
    if (url.endsWith('/api/orders/pending')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            username: 'alice',
            status: 'PENDING',
            dishes: [
              {
                id: 1,
                name: 'Margherita Pizza',
                description: 'Tomato & mozzarella',
                price: 11.0,
                quantity: 4,
                restaurantId: 1,
              },
              {
                id: 1,
                name: 'Margherita Pizza',
                description: 'Tomato & mozzarella',
                price: 11.0,
                quantity: 4,
                restaurantId: 1,
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    }
    if (url.endsWith('/api/orders/pending/confirm')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            username: 'alice',
            status: 'CONFIRMED',
            dishes: [
              {
                id: 1,
                name: 'Margherita Pizza',
                description: 'Tomato & mozzarella',
                price: 11.0,
                quantity: 4,
                restaurantId: 1,
              },
              {
                id: 1,
                name: 'Margherita Pizza',
                description: 'Tomato & mozzarella',
                price: 11.0,
                quantity: 4,
                restaurantId: 1,
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    }
    return Promise.resolve(new Response('{}', { status: 404 }));
  });
}

describe('Role-based navigation & OrderPage workflow', () => {
  it('hides Manage and Users links for ROLE_CUSTOMER and displays order count badge', async () => {
    setStoredToken('jwt-customer');
    vi.stubGlobal('fetch', mockAuthenticatedFetch('ROLE_CUSTOMER'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <OrderProvider>
            <Navbar />
          </OrderProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Restaurants')).toBeInTheDocument();
    });
    expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it('shows Manage and Users links for ROLE_ADMIN', async () => {
    setStoredToken('jwt-admin');
    vi.stubGlobal('fetch', mockAuthenticatedFetch('ROLE_ADMIN'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <OrderProvider>
            <Navbar />
          </OrderProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Manage')).toBeInTheDocument();
    });
    expect(screen.getByText('Users')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('groups duplicate dishes and confirms order via native dialog', async () => {
    const user = userEvent.setup();
    setStoredToken('jwt-customer');
    vi.stubGlobal('fetch', mockAuthenticatedFetch('ROLE_CUSTOMER'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <OrderProvider>
            <OrderPage />
          </OrderProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    });
    expect(screen.getByText('x2')).toBeInTheDocument();
    expect(screen.getAllByText('$22.00').length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole('button', { name: 'Confirm Order' }));
    expect(screen.getByText('Confirm this order?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', {
      name: 'Confirm Order',
    });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
