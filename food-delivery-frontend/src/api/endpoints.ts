import { apiRequest } from './client';
import type {
  CreateDishDto,
  CreateRestaurantDto,
  DisplayDishDetailsDto,
  DisplayDishDto,
  DisplayOrderDto,
  DisplayRestaurantDto,
  LoginUserRequestDto,
  LoginUserResponseDto,
  RegisterUserRequestDto,
  RegisterUserResponseDto,
} from '../types/api';

// User endpoints
export function loginUser(
  payload: LoginUserRequestDto,
): Promise<LoginUserResponseDto> {
  return apiRequest<LoginUserResponseDto>('/api/user/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

export function registerUser(
  payload: RegisterUserRequestDto,
): Promise<RegisterUserResponseDto> {
  return apiRequest<RegisterUserResponseDto>('/api/user/register', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

export function fetchCurrentUser(
  token?: string | null,
): Promise<RegisterUserResponseDto> {
  return apiRequest<RegisterUserResponseDto>('/api/user/me', { token });
}

export function fetchUserByUsername(
  username: string,
): Promise<RegisterUserResponseDto> {
  return apiRequest<RegisterUserResponseDto>(
    `/api/user/${encodeURIComponent(username)}`,
  );
}

// Restaurant endpoints
export function fetchRestaurants(
  signal?: AbortSignal,
): Promise<DisplayRestaurantDto[]> {
  return apiRequest<DisplayRestaurantDto[]>('/api/restaurants', { signal });
}

export function fetchRestaurantById(
  id: number,
  signal?: AbortSignal,
): Promise<DisplayRestaurantDto> {
  return apiRequest<DisplayRestaurantDto>(`/api/restaurants/${id}`, { signal });
}

export function createRestaurant(
  payload: CreateRestaurantDto,
): Promise<DisplayRestaurantDto> {
  return apiRequest<DisplayRestaurantDto>('/api/restaurants/add', {
    method: 'POST',
    body: payload,
  });
}

export function updateRestaurant(
  id: number,
  payload: CreateRestaurantDto,
): Promise<DisplayRestaurantDto> {
  return apiRequest<DisplayRestaurantDto>(`/api/restaurants/${id}/edit`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteRestaurant(id: number): Promise<void> {
  return apiRequest<void>(`/api/restaurants/${id}/delete`, {
    method: 'DELETE',
  });
}

// Dish endpoints
export function fetchDishes(signal?: AbortSignal): Promise<DisplayDishDto[]> {
  return apiRequest<DisplayDishDto[]>('/api/dishes', { signal });
}

export function fetchDishById(
  id: number,
  signal?: AbortSignal,
): Promise<DisplayDishDto> {
  return apiRequest<DisplayDishDto>(`/api/dishes/${id}`, { signal });
}

export function fetchDishDetails(
  id: number,
  signal?: AbortSignal,
): Promise<DisplayDishDetailsDto> {
  return apiRequest<DisplayDishDetailsDto>(`/api/dishes/${id}/details`, {
    signal,
  });
}

export function createDish(payload: CreateDishDto): Promise<DisplayDishDto> {
  return apiRequest<DisplayDishDto>('/api/dishes/add', {
    method: 'POST',
    body: payload,
  });
}

export function updateDish(
  id: number,
  payload: CreateDishDto,
): Promise<DisplayDishDto> {
  return apiRequest<DisplayDishDto>(`/api/dishes/${id}/edit`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteDish(id: number): Promise<void> {
  return apiRequest<void>(`/api/dishes/${id}/delete`, {
    method: 'DELETE',
  });
}

// Order endpoints
export function fetchPendingOrder(
  signal?: AbortSignal,
): Promise<DisplayOrderDto> {
  return apiRequest<DisplayOrderDto>('/api/orders/pending', { signal });
}

export function addDishToOrder(dishId: number): Promise<DisplayOrderDto> {
  return apiRequest<DisplayOrderDto>(`/api/dishes/${dishId}/add-to-order`, {
    method: 'POST',
  });
}

export function removeDishFromOrder(dishId: number): Promise<DisplayOrderDto> {
  return apiRequest<DisplayOrderDto>(
    `/api/dishes/${dishId}/remove-from-order`,
    {
      method: 'POST',
    },
  );
}

export function confirmPendingOrder(): Promise<DisplayOrderDto> {
  return apiRequest<DisplayOrderDto>('/api/orders/pending/confirm', {
    method: 'PUT',
  });
}

export function cancelPendingOrder(): Promise<DisplayOrderDto> {
  return apiRequest<DisplayOrderDto>('/api/orders/pending/cancel', {
    method: 'PUT',
  });
}
