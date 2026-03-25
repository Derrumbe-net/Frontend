import { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaSave, FaDownload } from "react-icons/fa";
import "../../cms/styles/CMSProjects.css";
import Swal from "sweetalert2";
import aboutData from "../../about_us.json";

export default function CMSAbout() {
        const [data, setData] = useState(aboutData);
        const [showForm, setShowForm] = useState(false);
        const [editMember, setEditMember] = useState(null);

        const handleOpenForm = (member = null) => {
                    setEditMember(member);
                    setShowForm(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };

        const handleCloseForm = () => {
                    setShowForm(false);
                    setEditMember(null);
                };

        const saveFacultyMember = (member) => {
                    let updatedFacultad;
                    if (member.id && data.facultad.find(m => m.id === member.id)) {
                                    updatedFacultad = data.facultad.map(m => m.id === member.id ? member : m);
                                } else {
                                                const newMember = { ...member, id: Date.now().toString() };
                                                updatedFacultad = [...data.facultad, newMember];
                                            }

                    const newData = { ...data, facultad: updatedFacultad };
                    setData(newData);
                    handleCloseForm();
                    Swal.fire("Actualizado", "Cambios aplicados localmente.", "success");
                };

        const deleteFaculty = (id) => {
                    Swal.fire({
                                    title: "¿Eliminar?",
                                    text: "Se eliminará de la lista actual.",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#e55353"
                                }).then((result) => {
                                                if (result.isConfirmed) {
                                                                    setData({ ...data, facultad: data.facultad.filter(m => m.id !== id) });
                                                                }
                                            });
                };

        const updateStudentList = (type, newList) => {
                    setData({ ...data, [type]: newList });
                    Swal.fire("Éxito", "Lista de estudiantes actualizada en memoria.", "success");
                };

        const exportJSON = () => {
                    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                                    JSON.stringify(data, null, 2)
                                )}`;
                    const link = document.createElement("a");
                    link.href = jsonString;
                    link.download = "about_us.json";
                    link.click();
                };

        return (
                    <div className="cms-projects-wrapper">
                        <div className="cms-page-header">
                            <div className="cms-header-content">
                                <span className="cms-accent-line"></span>
                                <h1 className="cms-page-title">Editor de about_us.json</h1>
                                <p className="cms-page-subtitle">
                                    Modifique el contenido del archivo de configuración local.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="cms-btn" style={{ background: '#2c5282' }} onClick={exportJSON}>
                                    <FaDownload /> Descargar JSON
                                </button>
                                {!showForm && (
                                                            <button className="cms-btn" onClick={() => handleOpenForm()}>
                                                                <FaPlus /> Añadir Facultad
                                                            </button>
                                                        )}
                            </div>
                        </div>

                        {!showForm ? (
                                            <>
                                                <div className="cms-card" style={{ marginBottom: '30px' }}>
                                                    <h2 style={{ padding: '20px' }}>Cuerpo de Facultad</h2>
                                                    <div className="cms-table-container">
                                                        <table className="cms-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Nombre</th>
                                                                    <th>Rol</th>
                                                                    <th>Email</th>
                                                                    <th>Acciones</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {data.facultad.map((m) => (
                                                                                                            <tr key={m.id}>
                                                                                                                <td style={{ fontWeight: "600" }}>{m.name}</td>
                                                                                                                <td>{m.role}</td>
                                                                                                                <td>{m.email}</td>
                                                                                                                <td>
                                                                                                                    <button className="cms-icon-btn" onClick={() => handleOpenForm(m)}><FaEdit /></button>
                                                                                                                    <button className="cms-icon-btn cms-delete-btn" onClick={() => deleteFaculty(m.id)}><FaTrash /></button>
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <StudentEditor 
                                                        title="Estudiantes Graduados" 
                                                        list={data.graduados} 
                                                        onUpdate={(newList) => updateStudentList('graduados', newList)} 
                                                    />
                                                    <StudentEditor 
                                                        title="Estudiantes Subgraduados" 
                                                        list={data.subgraduados} 
                                                        onUpdate={(newList) => updateStudentList('subgraduados', newList)} 
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                                            <div className="cms-card">
                                                                <FacultyForm 
                                                                    member={editMember} 
                                                                    onSave={saveFacultyMember} 
                                                                    onClose={handleCloseForm} 
                                                                />
                                                            </div>
                                                        )}
                    </div>
                );
}

function StudentEditor({ title, list, onUpdate }) {
        const [items, setItems] = useState(list);
        const [newItem, setNewItem] = useState("");

        useEffect(() => { setItems(list); }, [list]);

        const addItem = () => {
                    if (!newItem.trim()) return;
                    const updated = [...items, newItem.trim()];
                    setItems(updated);
                    setNewItem("");
                    onUpdate(updated);
                };

        const removeItem = (index) => {
                    const updated = items.filter((_, i) => i !== index);
                    setItems(updated);
                    onUpdate(updated);
                };

        return (
                    <div className="cms-card" style={{ padding: '20px' }}>
                        <h3>{title}</h3>
                        <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
                            <input 
                                className="cms-input" 
                                value={newItem} 
                                onChange={(e) => setNewItem(e.target.value)} 
                                placeholder="Nuevo nombre..."
                            />
                            <button className="cms-btn" onClick={addItem}><FaPlus /></button>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {items.map((name, i) => (
                                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                                        {name}
                                                        <FaTrash style={{ color: '#e55353', cursor: 'pointer' }} onClick={() => removeItem(i)} />
                                                    </li>
                                                ))}
                        </ul>
                    </div>
                );
}

function FacultyForm({ member, onSave, onClose }) {
        const [formData, setFormData] = useState(member || {
                    name: "",
                    role: "",
                    email: "",
                    phone: "(787) 832-4040",
                    ext: "",
                    linkedin: "",
                    imageKey: "researcher1"
                });

        const handleChange = (e) => {
                    setFormData({ ...formData, [e.target.name]: e.target.value });
                };

        return (
                    <div style={{ padding: '20px' }}>
                        <h2>{member ? "Editar Facultad" : "Nuevo Miembro"}</h2>
                        <div className="cms-form-grid">
                            <div className="cms-form-group span-2">
                                <label>Nombre</label>
                                <input className="cms-input" name="name" value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="cms-form-group">
                                <label>Rol</label>
                                <input className="cms-input" name="role" value={formData.role} onChange={handleChange} />
                            </div>
                            <div className="cms-form-group">
                                <label>Email</label>
                                <input className="cms-input" name="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="cms-form-group">
                                <label>LinkedIn</label>
                                <input className="cms-input" name="linkedin" value={formData.linkedin} onChange={handleChange} />
                            </div>
                            <div className="cms-form-group">
                                <label>Extensión</label>
                                <input className="cms-input" name="ext" value={formData.ext} onChange={handleChange} />
                            </div>
                            <div className="cms-form-actions">
                                <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>Cancelar</button>
                                <button type="button" className="cms-btn" onClick={() => onSave(formData)}>Aplicar Cambios</button>
                            </div>
                        </div>
                    </div>
                );
}
