import { useState, useEffect } from 'react';
import { mechanicApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Spinner, EmptyState, Pagination, SearchBar, Modal, ConfirmDialog } from '../../components/common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function AdminMechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMechanic, setEditMechanic] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchMechanics(); }, [page, search]);

  const fetchMechanics = async () => {
    setLoading(true);
    try {
      const { data } = await mechanicApi.getAll({ page, limit: 10, search });
      setMechanics(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load mechanics'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditMechanic(null); reset({}); setShowModal(true); };
  const openEdit = (m) => { setEditMechanic(m); reset({ name: m.name, phone: m.phone, experience: m.experience, specialization: m.specialization }); setShowModal(true); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editMechanic) {
        await mechanicApi.update(editMechanic.id, data);
        toast.success('Mechanic updated!');
      } else {
        await mechanicApi.create(data);
        toast.success('Mechanic created! Default password: Mechanic@123');
      }
      setShowModal(false);
      fetchMechanics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await mechanicApi.delete(deleteTarget.id);
      toast.success('Mechanic deleted');
      setDeleteTarget(null);
      fetchMechanics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <DashboardLayout title="Mechanic Management">
      <div className="filters-bar">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search mechanics..." style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}>+ Add Mechanic</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔧 Mechanics</h3>
        </div>
        {loading ? <Spinner /> : mechanics.length === 0 ? (
          <EmptyState icon="🔧" title="No mechanics found" description="Add your first mechanic using the button above" action={<button className="btn btn-primary" onClick={openAdd}>Add Mechanic</button>} />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Experience</th>
                  <th>Specialization</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mechanics.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.user?.email}</td>
                    <td>{m.phone}</td>
                    <td>{m.experience} yrs</td>
                    <td>{m.specialization || '—'}</td>
                    <td>
                      <span className={`badge ${m.isAvailable ? 'badge-active' : 'badge-inactive'}`}>
                        {m.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(m)}>🗑️</button>
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
        <Modal title={editMechanic ? 'Edit Mechanic' : 'Add New Mechanic'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" {...register('name', { required: 'Required' })} placeholder="Ravi Kumar" />
                {errors.name && <span className="form-error">⚠ {errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" {...register('phone', { required: 'Required' })} placeholder="9876543210" />
                {errors.phone && <span className="form-error">⚠ {errors.phone.message}</span>}
              </div>
            </div>
            {!editMechanic && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" {...register('email', { required: 'Required' })} placeholder="mechanic@vsm.com" />
                {errors.email && <span className="form-error">⚠ {errors.email.message}</span>}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Experience (years)</label>
                <input type="number" className="form-control" {...register('experience', { min: 0 })} placeholder="5" />
              </div>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input className="form-control" {...register('specialization')} placeholder="Engine & Transmission" />
              </div>
            </div>
            {!editMechanic && (
              <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.1)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--primary-light)', marginBottom: 16 }}>
                💡 Default password will be <strong>Mechanic@123</strong>. Ask them to change it.
              </div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : editMechanic ? '✅ Save Changes' : '+ Add Mechanic'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Mechanic"
          message={`Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </DashboardLayout>
  );
}
