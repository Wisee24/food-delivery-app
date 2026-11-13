import { useState, type FormEvent } from 'react';
import { fetchUserByUsername } from '../api/endpoints';
import { formatRoleLabel, type RegisterUserResponseDto } from '../types/api';

export function AdminUsersPage() {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<RegisterUserResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = username.trim();
    if (!target) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const user = await fetchUserByUsername(target);
      setResult(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="admin-users-heading">
      <div className="page-header">
        <div>
          <h1 id="admin-users-heading">User Directory Lookup</h1>
          <p className="page-subtitle">
            Look up any registered account by exact username (Admin only).
          </p>
        </div>
      </div>

      <form className="toolbar" onSubmit={handleLookup}>
        <label className="field" style={{ flex: '1 1 18rem' }}>
          <span className="field-label">Username</span>
          <input
            type="search"
            className="input-control"
            placeholder="e.g. customer, owner, admin"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            enterKeyHint="search"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ alignSelf: 'flex-end' }}
        >
          {loading ? 'Searching...' : 'Look Up User'}
        </button>
      </form>

      {error ? (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <article className="card" style={{ maxInlineSize: '32rem' }}>
          <div className="card-meta">
            <h2 className="card-title">{result.username}</h2>
            <span className="pill pill-success">
              {formatRoleLabel(result.role)}
            </span>
          </div>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.4rem 1rem',
            }}
          >
            <dt className="field-hint">Full Name</dt>
            <dd>
              {result.name} {result.surname}
            </dd>
            <dt className="field-hint">Email</dt>
            <dd>{result.email}</dd>
            <dt className="field-hint">Role</dt>
            <dd>{result.role}</dd>
          </dl>
        </article>
      ) : null}
    </section>
  );
}
