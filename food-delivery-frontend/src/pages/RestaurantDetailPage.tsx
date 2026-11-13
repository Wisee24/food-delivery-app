import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchDishes, fetchRestaurantById } from '../api/endpoints';
import { DishDetailsDialog } from '../components/DishDetailsDialog';
import { useOrder } from '../context/OrderContext';
import {
  formatCurrency,
  type DisplayDishDto,
  type DisplayRestaurantDto,
} from '../types/api';

export function RestaurantDetailPage() {
  const { id } = useParams();
  const restaurantId = Number(id);
  const { addToOrder, isMutatingOrder } = useOrder();

  const [restaurant, setRestaurant] = useState<DisplayRestaurantDto | null>(
    null,
  );
  const [dishes, setDishes] = useState<DisplayDishDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);

  const loadData = useCallback((signal?: AbortSignal) => {
    if (!Number.isFinite(restaurantId)) {
      setError('Invalid restaurant ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      fetchRestaurantById(restaurantId, signal),
      fetchDishes(signal),
    ])
      .then(([rest, allDishes]) => {
        setRestaurant(rest);
        setDishes(allDishes.filter((d) => d.restaurantId === restaurantId));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load restaurant menu.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [restaurantId]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadData]);

  const handleAdd = async (dishId: number) => {
    setFeedback(null);
    await addToOrder(dishId);
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId && d.quantity > 0
          ? { ...d, quantity: d.quantity - 1 }
          : d,
      ),
    );
    setFeedback('Dish added to your pending order.');
  };

  const sortedDishes = useMemo(
    () => [...dishes].sort((a, b) => a.name.localeCompare(b.name)),
    [dishes],
  );

  return (
    <section aria-labelledby="restaurant-detail-heading">
      <div className="page-header">
        <div>
          <Link to="/restaurants" className="field-hint">
            ← Back to Restaurants
          </Link>
          <h1 id="restaurant-detail-heading" style={{ marginBlockStart: '0.25rem' }}>
            {restaurant ? restaurant.name : 'Restaurant Menu'}
          </h1>
          {restaurant ? (
            <p className="page-subtitle">{restaurant.description}</p>
          ) : null}
        </div>
        <Link to="/order" className="btn btn-secondary">
          View Pending Order
        </Link>
      </div>

      {feedback ? (
        <div className="banner banner-success" role="status">
          <span>{feedback}</span>
          <Link to="/order" className="btn btn-secondary btn-sm">
            Go to Order
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="empty-state" role="status">
          <p>Loading menu...</p>
        </div>
      ) : sortedDishes.length === 0 ? (
        <div className="empty-state">
          <p>This restaurant does not have any dishes listed yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {sortedDishes.map((dish) => (
            <article key={dish.id} className="card">
              <div>
                <h2 className="card-title">{dish.name}</h2>
                <p
                  className="card-description"
                  style={{ marginBlockStart: '0.4rem' }}
                >
                  {dish.description}
                </p>
              </div>
              <div className="card-meta">
                <span className="price-tag">{formatCurrency(dish.price)}</span>
                <span
                  className={`pill ${dish.quantity > 0 ? 'pill-success' : 'pill-danger'}`}
                >
                  {dish.quantity > 0
                    ? `${dish.quantity} left`
                    : 'Out of stock'}
                </span>
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedDishId(dish.id)}
                >
                  Details
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={dish.quantity <= 0 || isMutatingOrder}
                  onClick={() => void handleAdd(dish.id)}
                >
                  Add to Order
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <DishDetailsDialog
        dishId={selectedDishId}
        onClose={() => setSelectedDishId(null)}
        onAddToOrder={handleAdd}
        isMutatingOrder={isMutatingOrder}
      />
    </section>
  );
}
