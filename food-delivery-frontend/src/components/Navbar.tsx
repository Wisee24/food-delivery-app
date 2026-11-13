import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { formatRoleLabel, hasRole } from '../types/api';

export function Navbar() {
  const { user, logout } = useAuth();
  const { totalCount } = useOrder();
  const navigate = useNavigate();
  const location = useLocation();

  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [isWide, setIsWide] = useState(true);

  const closePopover = () => {
    const menuEl = menuRef.current as
      | (HTMLUListElement & { hidePopover?: () => void })
      | null;
    if (menuEl && typeof menuEl.hidePopover === 'function') {
      try {
        menuEl.hidePopover();
      } catch {
        // Ignore if not currently open as a popover
      }
    }
  };

  useEffect(() => {
    closePopover();
  }, [location.pathname]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') {
      setIsWide(true);
      return;
    }

    const updateLayout = () => {
      // Collapse when viewport is narrower than 760px or header overflows
      const viewportWidth = window.innerWidth;
      const fits = viewportWidth >= 760 && inner.scrollWidth <= inner.clientWidth + 2;
      setIsWide(fits);
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(inner);
    window.addEventListener('resize', updateLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, [user, totalCount]);

  const handleLogout = () => {
    closePopover();
    logout();
    navigate('/login');
  };

  return (
    <header
      ref={headerRef}
      className={`site-header${isWide ? ' is-wide' : ''}`}
    >
      <div ref={innerRef} className="header-inner">
        <Link className="site-logo" to={user ? '/restaurants' : '/login'}>
          <span className="brand-mark" aria-hidden="true">
            F
          </span>
          <span>FreshPlate</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <button
            className="menu-button"
            type="button"
            popoverTarget="site-menu"
            popoverTargetAction="toggle"
            aria-controls="site-menu"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Menu</span>
          </button>

          <ul
            ref={menuRef}
            id="site-menu"
            className="site-menu"
            popover="auto"
          >
            {user ? (
              <>
                <li>
                  <NavLink
                    to="/restaurants"
                    className="nav-link"
                    onClick={closePopover}
                  >
                    Restaurants
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/dishes"
                    className="nav-link"
                    onClick={closePopover}
                  >
                    Dishes
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/order"
                    className="nav-link"
                    onClick={closePopover}
                  >
                    <span>Order</span>
                    {totalCount > 0 ? (
                      <span
                        className="count-badge"
                        aria-label={`${totalCount} items in order`}
                      >
                        {totalCount}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
                {hasRole(user.role, 'ROLE_OWNER') ? (
                  <li>
                    <NavLink
                      to="/manage"
                      className="nav-link"
                      onClick={closePopover}
                    >
                      Manage
                    </NavLink>
                  </li>
                ) : null}
                {hasRole(user.role, 'ROLE_ADMIN') ? (
                  <li>
                    <NavLink
                      to="/admin/users"
                      className="nav-link"
                      onClick={closePopover}
                    >
                      Users
                    </NavLink>
                  </li>
                ) : null}
                <li>
                  <span className="nav-user-chip">
                    {user.username} ({formatRoleLabel(user.role)})
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    className="nav-link"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink
                    to="/login"
                    className="nav-link"
                    onClick={closePopover}
                  >
                    Sign In
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/register"
                    className="nav-link"
                    onClick={closePopover}
                  >
                    Create Account
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
