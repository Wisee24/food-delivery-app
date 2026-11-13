import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createDish,
  createRestaurant,
  deleteDish,
  deleteRestaurant,
  fetchDishes,
  fetchRestaurants,
  updateDish,
  updateRestaurant,
} from '../api/endpoints';
import { ModalDialog } from '../components/ModalDialog';
import {
  formatCurrency,
  type CreateDishDto,
  type CreateRestaurantDto,
  type DisplayDishDto,
  type DisplayRestaurantDto,
} from '../types/api';

type Tab = 'restaurants' | 'dishes';

export function ManagePage() {
  const [activeTab, setActiveTab] = useState<Tab>('restaurants');
  const [restaurants, setRestaurants] = useState<DisplayRestaurantDto[]>([]);
  const [dishes, setDishes] = useState<DisplayDishDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Restaurant form modal state
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] =
    useState<DisplayRestaurantDto | null>(null);
  const [restForm, setRestForm] = useState<CreateRestaurantDto>({
    name: '',
    description: '',
  });
  const [deletingRestaurant, setDeletingRestaurant] =
    useState<DisplayRestaurantDto | null>(null);

  // Dish form modal state
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DisplayDishDto | null>(null);
  const [dishForm, setDishForm] = useState<CreateDishDto>({
    name: '',
    description: '',
    price: 10,
    quantity: 10,
    restaurantId: 0,
  });
  const [deletingDish, setDeletingDish] = useState<DisplayDishDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [restList, dishList] = await Promise.all([
        fetchRestaurants(signal),
        fetchDishes(signal),
      ]);
      setRestaurants(restList);
      setDishes(dishList);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(
        err instanceof Error ? err.message : 'Unable to load catalog data.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadAll(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadAll]);

  const openCreateRestaurant = () => {
    setEditingRestaurant(null);
    setRestForm({ name: '', description: '' });
    setRestaurantModalOpen(true);
  };

  const openEditRestaurant = (restaurant: DisplayRestaurantDto) => {
    setEditingRestaurant(restaurant);
    setRestForm({
      name: restaurant.name,
      description: restaurant.description,
    });
    setRestaurantModalOpen(true);
  };

  const handleSaveRestaurant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      if (editingRestaurant) {
        const updated = await updateRestaurant(editingRestaurant.id, {
          name: restForm.name.trim(),
          description: restForm.description.trim(),
        });
        setRestaurants((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
        setNotice(`Updated restaurant "${updated.name}".`);
      } else {
        const created = await createRestaurant({
          name: restForm.name.trim(),
          description: restForm.description.trim(),
        });
        setRestaurants((prev) => [...prev, created]);
        setNotice(`Created restaurant "${created.name}".`);
      }
      setRestaurantModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save restaurant.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!deletingRestaurant) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await deleteRestaurant(deletingRestaurant.id);
      setRestaurants((prev) =>
        prev.filter((r) => r.id !== deletingRestaurant.id),
      );
      setNotice(`Deleted restaurant "${deletingRestaurant.name}".`);
      setDeletingRestaurant(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete restaurant.',
      );
      setDeletingRestaurant(null);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateDish = () => {
    setEditingDish(null);
    setDishForm({
      name: '',
      description: '',
      price: 12,
      quantity: 10,
      restaurantId: restaurants[0]?.id ?? 0,
    });
    setDishModalOpen(true);
  };

  const openEditDish = (dish: DisplayDishDto) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      quantity: dish.quantity,
      restaurantId: dish.restaurantId,
    });
    setDishModalOpen(true);
  };

  const handleSaveDish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const payload: CreateDishDto = {
        name: dishForm.name.trim(),
        description: dishForm.description.trim(),
        price: Number(dishForm.price),
        quantity: Number(dishForm.quantity),
        restaurantId: Number(dishForm.restaurantId),
      };
      if (editingDish) {
        const updated = await updateDish(editingDish.id, payload);
        setDishes((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d)),
        );
        setNotice(`Updated dish "${updated.name}".`);
      } else {
        const created = await createDish(payload);
        setDishes((prev) => [...prev, created]);
        setNotice(`Created dish "${created.name}".`);
      }
      setDishModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dish.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDish = async () => {
    if (!deletingDish) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await deleteDish(deletingDish.id);
      setDishes((prev) => prev.filter((d) => d.id !== deletingDish.id));
      setNotice(`Deleted dish "${deletingDish.name}".`);
      setDeletingDish(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dish.');
      setDeletingDish(null);
    } finally {
      setSubmitting(false);
    }
  };

  const restaurantNameById = new Map(restaurants.map((r) => [r.id, r.name]));

  return (
    <section aria-labelledby="manage-heading">
      <div className="page-header">
        <div>
          <h1 id="manage-heading">Manage Catalog</h1>
          <p className="page-subtitle">
            Create, update, and remove restaurants and dishes (Owner & Admin).
          </p>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={
              activeTab === 'restaurants'
                ? openCreateRestaurant
                : openCreateDish
            }
            disabled={activeTab === 'dishes' && restaurants.length === 0}
          >
            {activeTab === 'restaurants' ? 'Add Restaurant' : 'Add Dish'}
          </button>
        </div>
      </div>

      <div className="toolbar" role="tablist" aria-label="Catalog sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'restaurants'}
          className={`btn ${activeTab === 'restaurants' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants ({restaurants.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'dishes'}
          className={`btn ${activeTab === 'dishes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dishes')}
        >
          Dishes ({dishes.length})
        </button>
      </div>

      {notice ? (
        <div className="banner banner-success" role="status">
          <span>{notice}</span>
        </div>
      ) : null}

      {error ? (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="empty-state" role="status">
          <p>Loading catalog...</p>
        </div>
      ) : activeTab === 'restaurants' ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td>{restaurant.id}</td>
                  <td>
                    <strong>{restaurant.name}</strong>
                  </td>
                  <td>{restaurant.description}</td>
                  <td>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditRestaurant(restaurant)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingRestaurant(restaurant)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Restaurant</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dishes.map((dish) => (
                <tr key={dish.id}>
                  <td>
                    <strong>{dish.name}</strong>
                    <div className="field-hint">{dish.description}</div>
                  </td>
                  <td>
                    {restaurantNameById.get(dish.restaurantId) ??
                      `#${dish.restaurantId}`}
                  </td>
                  <td>{formatCurrency(dish.price)}</td>
                  <td>{dish.quantity}</td>
                  <td>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditDish(dish)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingDish(dish)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restaurant Create/Edit Modal */}
      <ModalDialog
        open={restaurantModalOpen}
        title={editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}
        onClose={() => setRestaurantModalOpen(false)}
      >
        <form className="form-stack" onSubmit={handleSaveRestaurant}>
          <div className="field">
            <label className="field-label" htmlFor="rest-name">
              Name
            </label>
            <input
              id="rest-name"
              type="text"
              className="input-control"
              required
              autoFocus
              value={restForm.name}
              onChange={(e) =>
                setRestForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rest-desc">
              Description
            </label>
            <textarea
              id="rest-desc"
              className="input-control"
              rows={3}
              required
              value={restForm.description}
              onChange={(e) =>
                setRestForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRestaurantModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Restaurant'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Restaurant Delete Confirmation */}
      <ModalDialog
        open={deletingRestaurant !== null}
        title="Delete restaurant?"
        onClose={() => setDeletingRestaurant(null)}
      >
        <p className="card-description">
          Are you sure you want to delete{' '}
          <strong>{deletingRestaurant?.name}</strong>?
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            autoFocus
            onClick={() => setDeletingRestaurant(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={submitting}
            onClick={() => void handleDeleteRestaurant()}
          >
            Delete
          </button>
        </div>
      </ModalDialog>

      {/* Dish Create/Edit Modal */}
      <ModalDialog
        open={dishModalOpen}
        title={editingDish ? 'Edit Dish' : 'Add Dish'}
        onClose={() => setDishModalOpen(false)}
      >
        <form className="form-stack" onSubmit={handleSaveDish}>
          <div className="field">
            <label className="field-label" htmlFor="dish-name">
              Dish Name
            </label>
            <input
              id="dish-name"
              type="text"
              className="input-control"
              required
              autoFocus
              value={dishForm.name}
              onChange={(e) =>
                setDishForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="dish-desc">
              Description
            </label>
            <textarea
              id="dish-desc"
              className="input-control"
              rows={2}
              required
              value={dishForm.description}
              onChange={(e) =>
                setDishForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className="form-row-2">
            <div className="field">
              <label className="field-label" htmlFor="dish-price">
                Price (USD)
              </label>
              <input
                id="dish-price"
                type="number"
                step="0.01"
                min="0.01"
                className="input-control"
                required
                value={dishForm.price}
                onChange={(e) =>
                  setDishForm((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="dish-qty">
                Quantity
              </label>
              <input
                id="dish-qty"
                type="number"
                min="0"
                step="1"
                className="input-control"
                required
                value={dishForm.quantity}
                onChange={(e) =>
                  setDishForm((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="dish-restaurant">
              Restaurant
            </label>
            <select
              id="dish-restaurant"
              className="input-control"
              required
              value={dishForm.restaurantId}
              onChange={(e) =>
                setDishForm((prev) => ({
                  ...prev,
                  restaurantId: Number(e.target.value),
                }))
              }
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDishModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Dish'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Dish Delete Confirmation */}
      <ModalDialog
        open={deletingDish !== null}
        title="Delete dish?"
        onClose={() => setDeletingDish(null)}
      >
        <p className="card-description">
          Are you sure you want to delete <strong>{deletingDish?.name}</strong>?
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            autoFocus
            onClick={() => setDeletingDish(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={submitting}
            onClick={() => void handleDeleteDish()}
          >
            Delete
          </button>
        </div>
      </ModalDialog>
    </section>
  );
}
