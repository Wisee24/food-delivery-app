import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  lightDismiss?: boolean;
  children: ReactNode;
}

export function ModalDialog({
  open,
  title,
  onClose,
  lightDismiss = true,
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDialogElement>,
  ) => {
    if (!lightDismiss) return;
    const dialog = dialogRef.current;
    if (dialog && event.target === dialog) {
      dialog.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="app-dialog"
      aria-labelledby={titleId}
      // React 19 passes custom attributes cleanly; progressive enhancement for light-dismiss
      {...(lightDismiss ? { closedby: 'any' } : { closedby: 'closerequest' })}
      onClick={handleBackdropClick}
    >
      <div className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => dialogRef.current?.close()}
          aria-label={`Close ${title}`}
        >
          Close
        </button>
      </div>
      {open ? children : null}
    </dialog>
  );
}
