export type Role = 'ROLE_CUSTOMER' | 'ROLE_OWNER' | 'ROLE_ADMIN';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED';

export interface RegisterUserRequestDto {
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
}

export interface RegisterUserResponseDto {
  username: string;
  name: string;
  surname: string;
  email: string;
  role: Role;
}

export interface LoginUserRequestDto {
  username: string;
  password: string;
}

export interface LoginUserResponseDto {
  token: string;
}

export interface DisplayRestaurantDto {
  id: number;
  name: string;
  description: string;
}

export interface CreateRestaurantDto {
  name: string;
  description: string;
}

export interface DisplayDishDto {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  restaurantId: number;
}

export interface DisplayDishDetailsDto {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  restaurant: DisplayRestaurantDto;
}

export interface CreateDishDto {
  name: string;
  description: string;
  price: number;
  quantity: number;
  restaurantId: number;
}

export interface DisplayOrderDto {
  username: string;
  dishes: DisplayDishDto[];
  status: OrderStatus;
}

export interface JwtExceptionResponseDto {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface GroupedOrderItem {
  dish: DisplayDishDto;
  count: number;
  lineTotal: number;
}

const ROLE_RANK: Record<Role, number> = {
  ROLE_CUSTOMER: 1,
  ROLE_OWNER: 2,
  ROLE_ADMIN: 3,
};

export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export function formatRoleLabel(role: Role): string {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Admin';
    case 'ROLE_OWNER':
      return 'Owner';
    case 'ROLE_CUSTOMER':
      return 'Customer';
  }
}

export function groupOrderDishes(dishes: DisplayDishDto[]): {
  items: GroupedOrderItem[];
  totalCount: number;
  totalPrice: number;
} {
  const byId = new Map<number, GroupedOrderItem>();

  for (const dish of dishes) {
    const existing = byId.get(dish.id);
    if (existing) {
      existing.count += 1;
      existing.lineTotal = existing.count * existing.dish.price;
    } else {
      byId.set(dish.id, {
        dish,
        count: 1,
        lineTotal: dish.price,
      });
    }
  }

  const items = Array.from(byId.values());
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { items, totalCount, totalPrice };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
