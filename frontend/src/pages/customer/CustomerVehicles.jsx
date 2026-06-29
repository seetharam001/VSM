import { useState, useEffect } from 'react';
import { vehicleApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Spinner, EmptyState, SearchBar, Modal, ConfirmDialog } from '../../components/common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const currentYear = new Date().getFullYear();

export default function CustomerVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchVehicles(); }, [search]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await vehicleApi.getAll({ search, limit: 100 });
      setVehicles(data.data);
    } catch { toast.error('Failed to load vehicles'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditVehicle(null); setImageFile(null); reset({}); setShowModal(true); };
  const openEdit = (v) => {
    setEditVehicle(v);
    setImageFile(null);
    reset({ registrationNumber: v.registrationNumber, brand: v.brand, model: v.model, fuelType: v.fuelType, manufacturingYear: v.manufacturingYear, color: v.color, engineNumber: v.engineNumber, chassisNumber: v.chassisNumber });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => v && fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (editVehicle) {
        await vehicleApi.update(editVehicle.id, fd);
        toast.success('Vehicle updated!');
      } else {
        await vehicleApi.create(fd);
        toast.success('Vehicle registered!');
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await vehicleApi.delete(deleteTarget.id);
      toast.success('Vehicle removed');
      setDeleteTarget(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const fuelColors = { Petrol: '#f59e0b', Diesel: '#6366f1', Electric: '#10b981', Hybrid: '#0ea5e9', CNG: '#8b5cf6' };

  return (
    <DashboardLayout title="My Vehicles">
      <div className="filters-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by plate, brand, model..." style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}>+ Add Vehicle</button>
      </div>

      {loading ? <Spinner /> : vehicles.length === 0 ? (
        <EmptyState
          icon="🚗"
          title="No vehicles registered"
          description="Add your vehicle to start booking services"
          action={<button className="btn btn-primary" onClick={openAdd}>+ Register Vehicle</button>}
        />
      ) : (
        <div className="vehicle-grid">
          {vehicles.map(v => (
            <div key={v.id} className="vehicle-card">
              <div className="vehicle-card-image">
                {v.image ? <img src={v.image} alt={`${v.brand} ${v.model}`} /> : '🚗'}
              </div>
              <div className="vehicle-card-body">
                <div className="vehicle-plate">{v.registrationNumber}</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{v.brand} {v.model}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span className="badge" style={{ background: `${fuelColors[v.fuelType]}20`, color: fuelColors[v.fuelType] }}>{v.fuelType}</span>
                  <span className="badge badge-inactive">{v.manufacturingYear}</span>
                  {v.color && <span className="badge badge-inactive">🎨 {v.color}</span>}
                </div>
                {v.engineNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engine: {v.engineNumber}</div>}
                {v.chassisNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chassis: {v.chassisNumber}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)} style={{ flex: 1 }}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(v)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editVehicle ? 'Edit Vehicle' : 'Register New Vehicle'} onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input className="form-control" {...register('registrationNumber', { required: 'Required' })} placeholder="TN01AB1234" style={{ textTransform: 'uppercase' }} disabled={!!editVehicle} />
                {errors.registrationNumber && <span className="form-error">⚠ {errors.registrationNumber.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Brand *</label>
                <input className="form-control" {...register('brand', { required: 'Required' })} placeholder="Maruti, Honda, etc." />
                {errors.brand && <span className="form-error">⚠ {errors.brand.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Model *</label>
                <input className="form-control" {...register('model', { required: 'Required' })} placeholder="Swift, Civic, etc." />
                {errors.model && <span className="form-error">⚠ {errors.model.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Fuel Type *</label>
                <select className="form-control" {...register('fuelType', { required: 'Required' })}>
                  <option value="">Select fuel type</option>
                  {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {errors.fuelType && <span className="form-error">⚠ {errors.fuelType.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Manufacturing Year *</label>
                <input type="number" className="form-control" {...register('manufacturingYear', { required: 'Required', min: 1990, max: currentYear })} placeholder={currentYear} />
                {errors.manufacturingYear && <span className="form-error">⚠ {errors.manufacturingYear.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input className="form-control" {...register('color')} placeholder="White, Black, etc." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Engine Number</label>
                <input className="form-control" {...register('engineNumber')} placeholder="Engine number" />
              </div>
              <div className="form-group">
                <label className="form-label">Chassis Number</label>
                <input className="form-control" {...register('chassisNumber')} placeholder="Chassis number" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Image (optional)</label>
              <input type="file" className="form-control" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : editVehicle ? '✅ Update Vehicle' : '🚗 Register Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove Vehicle"
          message={`Remove ${deleteTarget.brand} ${deleteTarget.model} (${deleteTarget.registrationNumber})?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel="Remove"
        />
      )}
    </DashboardLayout>
  );
}
