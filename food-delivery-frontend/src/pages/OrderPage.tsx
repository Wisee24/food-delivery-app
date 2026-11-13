import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ModalDialog } from '../components/ModalDialog';
import { useOrder } from '../context/OrderContext';
import { formatCurrency } from '../types/api';

type PendingAction = 'confirm' | 'cancel' | null;

export function OrderPage() {
  const {
    order,
    lastFinishedOrder,
    groupedItems,
    totalCount,
    totalPrice,
    isOrderLoading,
    isMutatingOrder,
    orderError,
    refreshOrder,
    removeFromOrder,
    confirmOrder,
    cancelOrder,
    clearFinishedOrder,
  } = useOrder();

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const handleConfirmAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'confirm') {
      await confirmOrder();
    } else if (action === 'cancel') {
      await cancelOrder();
    }
  };

  return (
    <section aria-labelledby="order-heading">
      <div className="page-header">
        <div>
          <h1 id="order-heading">Pending Order</h1>
          <p className="page-subtitle">
            Review your selected dishes before confirming or canceling.
          </p>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isOrderLoading || isMutatingOrder}
            onClick={() => void refreshOrder()}
          >
            Refresh
          </button>
          <Link to="/dishes" className="btn btn-secondary btn-sm">
            Add More Dishes
          </Link>
        </div>
      </div>

      {lastFinishedOrder ? (
        <div
          className={`banner ${
            lastFinishedOrder.status === 'CONFIRMED'
              ? 'banner-success'
              : 'banner-warning'
          }`}
          role="status"
        >
          <span>
            Order for <strong>{lastFinishedOrder.username}</strong> has been{' '}
            <strong>{lastFinishedOrder.status}</strong> (
            {lastFinishedOrder.dishes.length} item
            {lastFinishedOrder.dishes.length === 1 ? '' : 's'}).
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={clearFinishedOrder}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {orderError ? (
        <div className="banner banner-error" role="alert">
          <span>{orderError}</span>
        </div>
      ) : null}

      {isOrderLoading ? (
        <div className="empty-state" role="status">
          <p>Loading your pending order...</p>
        </div>
      ) : groupedItems.length === 0 ? (
        <div className="empty-state">
          <p>
            {order
              ? 'Your pending order is currently empty.'
              : 'You do not have an active pending order.'}
          </p>
          <Link to="/restaurants" className="btn btn-primary">
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="form-stack">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Dish</th>
                  <th scope="col">Unit Price</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedItems.map(({ dish, count, lineTotal }) => (
                  <tr key={dish.id}>
                    <td>
                      <strong>{dish.name}</strong>
                      <div className="field-hint">{dish.description}</div>
                    </td>
                    <td>{formatCurrency(dish.price)}</td>
                    <td>x{count}</td>
                    <td>
                      <strong>{formatCurrency(lineTotal)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={isMutatingOrder}
                        onClick={() => void removeFromOrder(dish.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-meta">
              <div>
                <span className="field-hint">Total ({totalCount} items)</span>
                <div className="price-tag" style={{ fontSize: '1.35rem' }}>
                  {formatCurrency(totalPrice)}
                </div>
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={isMutatingOrder}
                  onClick={() => setPendingAction('cancel')}
                >
                  Cancel Order
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isMutatingOrder}
                  onClick={() => setPendingAction('confirm')}
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalDialog
        open={pendingAction !== null}
        title={
          pendingAction === 'confirm'
            ? 'Confirm this order?'
            : 'Cancel this order?'
        }
        onClose={() => setPendingAction(null)}
      >
        <p className="card-description">
          {pendingAction === 'confirm'
            ? `You are about to confirm ${totalCount} item${totalCount === 1 ? '' : 's'} for ${formatCurrency(totalPrice)}.`
            : 'Canceling will discard this pending order and restore dish stock.'}
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            autoFocus
            onClick={() => setPendingAction(null)}
          >
            Keep Reviewing
          </button>
          <button
            type="button"
            className={`btn ${pendingAction === 'confirm' ? 'btn-primary' : 'btn-danger'}`}
            disabled={isMutatingOrder}
            onClick={() => void handleConfirmAction()}
          >
            {pendingAction === 'confirm' ? 'Confirm Order' : 'Cancel Order'}
          </button>
        </div>
      </ModalDialog>
    </section>
  );
}
