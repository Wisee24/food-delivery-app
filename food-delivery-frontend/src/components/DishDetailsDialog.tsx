import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDishDetails } from '../api/endpoints';
import { formatCurrency, type DisplayDishDetailsDto } from '../types/api';
import { ModalDialog } from './ModalDialog';

interface DishDetailsDialogProps {
  dishId: number | null;
  onClose: () => void;
  onAddToOrder: (dishId: number) => Promise<void>;
  isMutatingOrder: boolean;
}

export function DishDetailsDialog({
  dishId,
  onClose,
  onAddToOrder,
  isMutatingOrder,
}: DishDetailsDialogProps) {
  const [details, setDetails] = useState<DisplayDishDetailsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dishId === null) {
      setDetails(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchDishDetails(dishId, controller.signal)
      .then((data) => {
        setDetails(data);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          err instanceof Error ? err.message : 'Unable to load dish details.',
        );
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [dishId]);

  return (
    <ModalDialog
      open={dishId !== null}
      title={details ? details.name : 'Dish Details'}
      onClose={onClose}
    >
      {loading ? <p>Loading dish details...</p> : null}
      {error ? (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
      {details && !loading ? (
        <div className="form-stack">
          <p className="card-description">{details.description}</p>
          <div className="card-meta">
            <span className="price-tag">{formatCurrency(details.price)}</span>
            <span
              className={`pill ${details.quantity > 0 ? 'pill-success' : 'pill-danger'}`}
            >
              {details.quantity > 0
                ? `${details.quantity} in stock`
                : 'Out of stock'}
            </span>
          </div>
          <div className="card" style={{ padding: '0.85rem' }}>
            <span className="field-hint">Prepared by</span>
            <strong>{details.restaurant.name}</strong>
            <span className="card-description">
              {details.restaurant.description}
            </span>
            <Link
              to={`/restaurants/${details.restaurant.id}`}
              className="btn btn-secondary btn-sm"
              style={{ justifySelf: 'start' }}
              onClick={onClose}
            >
              View Restaurant Menu
            </Link>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={details.quantity <= 0 || isMutatingOrder}
              onClick={async () => {
                await onAddToOrder(details.id);
                onClose();
              }}
            >
              {details.quantity > 0 ? 'Add to Order' : 'Out of Stock'}
            </button>
          </div>
        </div>
      ) : null}
    </ModalDialog>
  );
}
