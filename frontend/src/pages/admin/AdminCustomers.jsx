import { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Spinner, EmptyState, Pagination, SearchBar } from '../../components/common';
import { toast } from 'react-toastify';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchCustomers(); }, [page, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getCustomers({ page, limit: 10, search });
      setCustomers(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (c) => {
    try {
      await adminApi.toggleCustomerStatus(c.id);
      toast.success(`Customer ${c.user?.isActive ? 'deactivated' : 'activated'}`);
      fetchCustomers();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <DashboardLayout title="Customer Management">
      <div className="filters-bar">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, phone..." style={{ flex: 1 }} />
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">👥 Customers</h3>
        </div>
        {loading ? <Spinner /> : customers.length === 0 ? (
          <EmptyState icon="👥" title="No customers found" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.user?.email}</td>
                    <td>{c.phone}</td>
                    <td style={{ maxWidth: 150, fontSize: '0.8rem', color: 'var(--text-muted)' }} className="truncate">{c.address || '—'}</td>
                    <td>
                      <span className={`badge ${c.user?.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {c.user?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${c.user?.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(c)}
                      >
                        {c.user?.isActive ? '🚫 Deactivate' : '✅ Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}
