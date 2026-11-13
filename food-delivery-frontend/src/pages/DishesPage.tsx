import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDishes, fetchRestaurants } from '../api/endpoints';
import { DishDetailsDialog } from '../components/DishDetailsDialog';
import { useOrder } from '../context/OrderContext';
import {
  formatCurrency,
  type DisplayDishDto,
  type DisplayRestaurantDto,
} from '../types/api';

export function DishesPage() {
  const { addToOrder, isMutatingOrder } = useOrder();

  const [dishes, setDishes] = useState<DisplayDishDto[]>([]);
  const [restaurants, setRestaurants] = useState<DisplayRestaurantDto[]>([]);
  const [search, setSearch] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      fetchDishes(controller.signal),
      fetchRestaurants(controller.signal),
    ])
      .then(([dishList, restaurantList]) => {
        setDishes(dishList);
        setRestaurants(restaurantList);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          err instanceof Error ? err.message : 'Unable to load dishes.',
        );
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const restaurantNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of restaurants) {
      map.set(r.id, r.name);
    }
    return map;
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dishes.filter((dish) => {
      if (
        restaurantFilter !== 'all' &&
        dish.restaurantId !== Number(restaurantFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q)
      );
    });
  }, [dishes, search, restaurantFilter]);

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

  return (
    <section aria-labelledby="dishes-heading">
      <div className="page-header">
        <div>
          <h1 id="dishes-heading">All Dishes</h1>
          <p className="page-subtitle">
            Explore every dish across all partner kitchens.
          </p>
        </div>
        <Link to="/order" className="btn btn-secondary">
          View Pending Order
        </Link>
      </div>

      <div className="toolbar">
        <label className="field" style={{ flex: '1 1 16rem' }}>
          <span className="field-label">Search dishes</span>
          <input
            type="search"
            className="input-control"
            placeholder="Search by dish name or ingredient..."
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label className="field" style={{ flex: '0 1 16rem' }}>
          <span className="field-label">Restaurant</span>
          <select
            className="input-control"
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
          >
            <option value="all">All Restaurants</option>
            {restaurants.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
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
          <p>Loading dishes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No dishes match your current filters.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((dish) => {
            const restName =
              restaurantNames.get(dish.restaurantId) ??
              `Restaurant #${dish.restaurantId}`;
            return (
              <article key={dish.id} className="card">
                <div>
                  <span className="pill" style={{ marginBlockEnd: '0.45rem' }}>
                    {restName}
                  </span>
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
                      ? `${dish.quantity} in stock`
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
            );
          })}
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
