import { useState, useEffect } from 'react';
import { serviceApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Spinner, EmptyState, Pagination, SearchBar, Modal, ConfirmDialog } from '../../components/common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchServices(); }, [page, search]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await serviceApi.getAll({ page, limit: 10, search, activeOnly: 'false' });
      setServices(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditService(null); reset({}); setShowModal(true); };
  const openEdit = (s) => { setEditService(s); reset({ name: s.name, description: s.description, estimatedHours: s.estimatedHours, basePrice: s.basePrice }); setShowModal(true); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editService) {
        await serviceApi.update(editService.id, data);
        toast.success('Service updated!');
      } else {
        await serviceApi.create(data);
        toast.success('Service created!');
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleToggle = async (s) => {
    try {
      await serviceApi.toggle(s.id);
      toast.success(`Service ${s.isActive ? 'deactivated' : 'activated'}`);
      fetchServices();
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async () => {
    try {
      await serviceApi.delete(deleteTarget.id);
      toast.success('Service deleted');
      setDeleteTarget(null);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <DashboardLayout title="Service Management">
      <div className="filters-bar">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search services..." style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}>+ Add Service</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">⚙️ Services</h3>
        </div>
        {loading ? <Spinner /> : services.length === 0 ? (
          <EmptyState icon="⚙️" title="No services found" action={<button className="btn btn-primary" onClick={openAdd}>Add Service</button>} />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Description</th>
                  <th>Est. Time</th>
                  <th>Base Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ maxWidth: 200, color: 'var(--text-muted)', fontSize: '0.8rem' }} className="truncate">{s.description}</td>
                    <td>{s.estimatedHours}h</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{s.basePrice.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button>
                        <button className={`btn btn-sm ${s.isActive ? 'btn-secondary' : 'btn-success'}`} onClick={() => handleToggle(s)}>
                          {s.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showModal && (
        <Modal title={editService ? 'Edit Service' : 'Add New Service'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input className="form-control" {...register('name', { required: 'Required' })} placeholder="Full Service" />
              {errors.name && <span className="form-error">⚠ {errors.name.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" {...register('description')} placeholder="Service description..." rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estimated Hours</label>
                <input type="number" step="0.5" className="form-control" {...register('estimatedHours', { required: 'Required', min: 0.5 })} placeholder="2" />
                {errors.estimatedHours && <span className="form-error">⚠ {errors.estimatedHours.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Base Price (₹)</label>
                <input type="number" className="form-control" {...register('basePrice', { required: 'Required', min: 0 })} placeholder="2500" />
                {errors.basePrice && <span className="form-error">⚠ {errors.basePrice.message}</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : editService ? '✅ Save' : '+ Add Service'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Service"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
}
