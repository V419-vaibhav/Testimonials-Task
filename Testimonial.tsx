import React, { useState } from "react";
import SideBar from "../../Component/SideBar";
import Navbar from "../../Component/Navbar";
import useFetch from "../../hooks/useFetch";
import usePost from "../../hooks/usePost";
import axiosInstance from "../../utils/axiosInstance";
import useDelete from "../../hooks/useDelete";
import useEscClose from "../../hooks/useEscClose";

export interface Testimonial {
    testimonial_id: number;
    author_name: string;
    author_designation?: string;
    author_company?: string;
    author_image?: string;
    rating: number;
    title: string;
    message: string;
    isactive: number;
    display_order?: number;
    created_at?: string;
    updated_at?: string;
}

const EMPTY_FORM: Partial<Testimonial> = {
    author_name: '',
    author_designation: '',
    author_company: '',
    author_image: '',
    rating: 5,
    title: '',
    message: '',
    display_order: 0,
};

const TestimonialPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const limit = 8;

    const { data, loading, error, refetch } = useFetch<{
        data: Testimonial[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalRecords: number;
            recordPerPage: number;
        };
    }>(`testimonial/gettestimonials?page=${page}&limit=${limit}`);

    const { postData: createTestimonial } = usePost<any, Partial<Testimonial>>('testimonial/create-testimonial');
    const { deleteData: deleteTestimonial } = useDelete<any>();

    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Partial<Testimonial> | null>(null);
    const [form, setForm] = useState<Partial<Testimonial>>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = useState(false);
    const [popup, setPopup] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const testimonials = data?.data || [];
    const pagination = data?.pagination;

    function openAddModal() {
        setEditData(null);
        setForm(EMPTY_FORM);
        setFormErrors({});
        setShowModal(true);
    }

    function openEditModal(testimonial: Testimonial) {
        setEditData(testimonial);
        setForm({ ...testimonial });
        setFormErrors({});
        setShowModal(true);
    }

    function closeModal() {
        if (actionLoading) return;
        setShowModal(false);
        setEditData(null);
        setFormErrors({});
    }

    useEscClose(showModal, closeModal, actionLoading);

    function showPopup(message: string, type: 'success' | 'error' = 'success') {
        setPopup({ message, type });
        setTimeout(() => setPopup(null), 3000);
    }

    function validate(): boolean {
        if ((form.author_name ?? "").trim().length < 3)
            errors.author_name = "Author name must be at least 3 characters.";

        if ((form.title ?? "").trim().length < 3)
            errors.title = "Title must be at least 3 characters.";

        if ((form.message ?? "").trim().length < 10)
            errors.message = "Message must be at least 10 characters.";

        if (
            form.author_image &&
                        !/^https?:\/\/.+/i.test(form.author_image)
        ) {
            errors.author_image = "Please enter a valid image URL.";
        }
        const errors: Record<string, string> = {};
        if (!form.author_name?.trim()) errors.author_name = 'Author name is required.';
        if (!form.title?.trim()) errors.title = 'Title is required.';
        if (!form.message?.trim()) errors.message = 'Message is required.';
        const rating = Number(form.rating);
        if (!rating || rating < 1 || rating > 5) errors.rating = 'Rating must be between 1 and 5.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setActionLoading(true);
        try {
            if (editData?.testimonial_id) {
                const { testimonial_id, created_at, updated_at, ...payload } = form as Testimonial;
                await axiosInstance.patch(`/testimonial/update-testimonial/${editData.testimonial_id}`, payload);
                showPopup('Testimonial updated successfully', 'success');
            } else {
                await createTestimonial(form);
                showPopup('Testimonial added successfully', 'success');
            }
            closeModal();
            refetch();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Something went wrong. Please try again.";
            setFormErrors({ submit: msg });
            showPopup(msg, 'error');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleToggleStatus(t: Testimonial) {
        setActionLoading(true);
        try {
            await axiosInstance.patch(`/testimonial/update-status/${t.testimonial_id}`, {
                isactive: t.isactive === 1 ? 0 : 1,
            });
            showPopup(`Testimonial ${t.isactive === 1 ? 'deactivated' : 'activated'} successfully`, 'success');
            refetch();
        } catch (err: any) {
            showPopup(err?.response?.data?.message || 'Status update failed.', 'error');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDelete(id: number) {
        if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
        setActionLoading(true);
        try {
            await deleteTestimonial(`/testimonial/delete-testimonial/${id}`);
            showPopup('Testimonial deleted successfully', 'success');
            refetch();
        } catch (err: any) {
            showPopup(err?.response?.data?.message || 'Delete failed. Please try again.', 'error');
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <main className="main-content">
            <SideBar />
            <Navbar
                title="Testimonials"
                breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Testimonials" }]}
                onSearch={() => { }}
            />
            <section className="stats-grid">
                <div className="glass-card glass-card-3d stat-card">
                    <div className="stat-card-inner">
                        <div className="stat-info">
                            <h3>Total Testimonials</h3>
                            <div className="stat-value">{pagination?.totalRecords ?? 0}</div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="glass-card table-card" style={{ gridColumn: 'span 1' }}>
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">All Testimonials</h2>
                            <p className="card-subtitle">Manage testimonials</p>
                        </div>
                        <div className="card-actions">
                            <button className="card-btn" onClick={openAddModal}>
                                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginRight: 6 }}>
                                    <line x1={12} y1={5} x2={12} y2={19} />
                                    <line x1={5} y1={12} x2={19} y2={12} />
                                </svg>
                                Add Testimonial
                            </button>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Author</th>
                                    <th>Title</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                    <th>Order</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading testimonials...</td></tr>
                                )}
                                {!loading && error && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', color: 'red' }}>
                                            Failed to load testimonials.{' '}
                                            <button className="card-btn" onClick={() => refetch()}>Retry</button>
                                        </td>
                                    </tr>
                                )}
                                {!loading && !error && testimonials.length === 0 && (
                                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>No testimonials found</td></tr>
                                )}
                                {!loading && !error && testimonials.map((t) => (
                                    <tr key={t.testimonial_id}>
                                        <td>
                                            <div className="table-user">
                                                <div className="table-avatar">{t.author_name?.[0]?.toUpperCase()}</div>
                                                <div className="table-user-info">
                                                    <span className="table-user-name">{t.author_name}</span>
                                                    <span className="table-user-email">{t.author_company}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{t.title}</td>
                                        <td>{t.rating} / 5</td>
                                        <td>
                                            <span
                                                className={`status-badge ${t.isactive === 1 ? 'completed' : 'processing'}`}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to toggle status"
                                                onClick={() => !actionLoading && handleToggleStatus(t)}
                                            >
                                                {t.isactive === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{t.display_order}</td>
                                        <td>
                                            <button className="card-btn" style={{ padding: '6px 12px', marginRight: 8 }} onClick={() => openEditModal(t)}>Edit</button>
                                            <button className="card-btn" style={{ padding: '6px 12px' }} onClick={() => handleDelete(t.testimonial_id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {pagination && pagination.totalPages > 1 && (
                            <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    <span style={{ fontSize: 18, lineHeight: 1 }}>&larr;</span> Previous
                                </button>
                                <span style={{ flex: 1, textAlign: 'center' }}>Page {pagination.currentPage} of {pagination.totalPages}</span>
                                <button
                                    disabled={page === pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    Next <span style={{ fontSize: 18, lineHeight: 1 }}>&rarr;</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.35)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    padding: '40px 16px', overflowY: 'auto',
                }}>
                    <div className="modal glass-card" style={{
                        maxWidth: 650, width: '100%', position: 'relative',
                        background: 'var(--glass-bg)', borderRadius: 12,
                        padding: '24px 32px', margin: '40px auto',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    }}>
                        <button
                            onClick={closeModal}
                            aria-label="Close"
                            disabled={actionLoading}
                            style={{
                                position: 'absolute', top: 10, right: 10,
                                background: 'transparent', border: 'none',
                                fontSize: 24, color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2,
                            }}
                        >
                            &times;
                        </button>
                        <h2 style={{ marginBottom: 18, textAlign: 'center', fontSize: 22 }}>
                            {editData ? 'Edit Testimonial' : 'Add Testimonial'}
                        </h2>
                        <form onSubmit={handleSubmit} className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
                            <div className="form-group-settings">
                                <label htmlFor="author_name">Author Name <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    id="author_name" className="form-input" type="text"
                                    value={form.author_name || ''}
                                    onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                                />
                                {formErrors.author_name && <span style={{ color: 'red', fontSize: 13 }}>{formErrors.author_name}</span>}
                            </div>
                            <div className="form-group-settings">
                                <label htmlFor="author_designation">Designation</label>
                                <input
                                    id="author_designation" className="form-input" type="text"
                                    value={form.author_designation || ''}
                                    onChange={e => setForm(f => ({ ...f, author_designation: e.target.value }))}
                                />
                            </div>
                            <div className="form-group-settings">
                                <label htmlFor="author_company">Company</label>
                                <input
                                    id="author_company" className="form-input" type="text"
                                    value={form.author_company || ''}
                                    onChange={e => setForm(f => ({ ...f, author_company: e.target.value }))}
                                />
                            </div>
                            <div className="form-group-settings">
                                <label htmlFor="author_image">Image URL</label>
                                <input
                                    id="author_image" className="form-input" type="url"
                                    value={form.author_image || ''}
                                    onChange={e => setForm(f => ({ ...f, author_image: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="form-group-settings">
                                <label htmlFor="rating">Rating (1–5) <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    id="rating" className="form-input" type="number" min={1} max={5}
                                    value={form.rating ?? ''}
                                    onChange={e => setForm(f => ({ ...f, rating: e.target.value === '' ? undefined : Number(e.target.value) }))}
                                />
                                {formErrors.rating && <span style={{ color: 'red', fontSize: 13 }}>{formErrors.rating}</span>}
                            </div>
                            <div className="form-group-settings">
                                <label htmlFor="title">Title <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    id="title" className="form-input" type="text"
                                    value={form.title || ''}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                />
                                {formErrors.title && <span style={{ color: 'red', fontSize: 13 }}>{formErrors.title}</span>}
                            </div>
                            <div className="form-group-settings">
                                <label htmlFor="message">Message <span style={{ color: 'red' }}>*</span></label>
                                <textarea
                                    id="message" className="form-input" style={{ minHeight: 80 }}
                                    value={form.message || ''}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                />
                                {formErrors.message && <span style={{ color: 'red', fontSize: 13 }}>{formErrors.message}</span>}
                            </div>
                            <div className="form-group-settings">
                                <label htmlFor="display_order">Display Order</label>
                                <input
                                    id="display_order" className="form-input" type="number" min={0}
                                    value={form.display_order ?? 0}
                                    onChange={e => setForm(f => ({ ...f, display_order: e.target.value === '' ? 0 : Number(e.target.value) }))}
                                />
                            </div>
                            {editData && (
                                <div className="form-group-settings">
                                    <label htmlFor="isactive">Status</label>
                                    <select
                                        id="isactive" className="form-input"
                                        value={form.isactive ?? 1}
                                        onChange={e => setForm(f => ({ ...f, isactive: Number(e.target.value) }))}
                                    >
                                        <option value={1}>Active</option>
                                        <option value={0}>Inactive</option>
                                    </select>
                                </div>
                            )}
                            {formErrors.submit && (
                                <div style={{ color: 'red', background: 'rgba(255,0,0,0.07)', borderRadius: 6, padding: '8px 12px', fontSize: 14 }}>
                                    {formErrors.submit}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button className="card-btn" type="submit" disabled={actionLoading} style={{ minWidth: 100 }}>
                                    {actionLoading ? 'Saving...' : editData ? 'Update' : 'Create'}
                                </button>
                                <button className="card-btn" type="button" onClick={closeModal} disabled={actionLoading} style={{ minWidth: 100 }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {popup && (
                <div style={{
                    position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
                    background: popup.type === 'success' ? '#4ade80' : '#f87171',
                    color: '#fff', padding: '12px 32px', borderRadius: 8,
                    fontWeight: 500, fontSize: 16, zIndex: 2000,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                }}>
                    {popup.message}
                </div>
            )}
        </main>
    );
};

export default TestimonialPage;
