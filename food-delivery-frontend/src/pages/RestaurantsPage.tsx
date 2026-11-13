import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../api/endpoints';
import type { DisplayRestaurantDto } from '../types/api';

export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<DisplayRestaurantDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchRestaurants(controller.signal)
      .then((data) => {
        setRestaurants(data);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          err instanceof Error ? err.message : 'Unable to load restaurants.',
        );
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [restaurants, search]);

  return (
    <section aria-labelledby="restaurants-heading">
      <div className="page-header">
        <div>
          <h1 id="restaurants-heading">Restaurants</h1>
          <p className="page-subtitle">
            Browse local kitchens and open any restaurant to view its menu.
          </p>
        </div>
        <Link to="/dishes" className="btn btn-secondary">
          Browse All Dishes
        </Link>
      </div>

      <div className="toolbar">
        <label className="field" style={{ flex: '1 1 18rem' }}>
          <span className="field-label">Search restaurants</span>
          <input
            type="search"
            className="input-control"
            placeholder="Filter by name or cuisine..."
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {error ? (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="empty-state" role="status">
          <p>Loading restaurants...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No restaurants match your search.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((restaurant) => (
            <article key={restaurant.id} className="card">
              <div>
                <h2 className="card-title">{restaurant.name}</h2>
                <p className="card-description" style={{ marginBlockStart: '0.4rem' }}>
                  {restaurant.description}
                </p>
              </div>
              <div className="card-actions">
                <Link
                  to={`/restaurants/${restaurant.id}`}
                  className="btn btn-primary btn-sm"
                >
                  View Menu
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
