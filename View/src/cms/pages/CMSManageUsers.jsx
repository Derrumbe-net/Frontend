import { useState, useEffect } from "react";
import { FaUserShield, FaCheck, FaBan, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import "../../cms/styles/CMSManageUsers.css";

export default function CMSManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserEmail, setCurrentUserEmail] = useState("");

    const API_URL = `${import.meta.env.VITE_API_URL}/admins`;
    const SUPER_ADMIN_EMAIL = "slidespr@gmail.com";

    useEffect(() => {
        const token = localStorage.getItem("cmsAdmin");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserEmail(payload.email);
            } catch (e) {
                console.error("Invalid token", e);
            }
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("cmsAdmin");
            const response = await fetch(API_URL, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Error al cargar los usuarios");

            const data = await response.json();
            setUsers(Array.isArray(data) ? data : data.data || []);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleToggleAuth = async (targetUser) => {
        if (currentUserEmail !== SUPER_ADMIN_EMAIL) {
            Swal.fire("Acceso Denegado", "Solo el Super Admin puede autorizar usuarios.", "error");
            return;
        }
        if (targetUser.email === SUPER_ADMIN_EMAIL) {
            Swal.fire("Acción inválida", "No puede modificar al Super Admin.", "warning");
            return;
        }

        const currentIsAuth = targetUser.isAuthorized === 1 || targetUser.isAuthorized === true;
        const newStatus = !currentIsAuth;

        // UI Feedback before Action
        const result = await Swal.fire({
            title: newStatus ? "Autorizar Usuario" : "Revocar Acceso",
            text: newStatus
                ? `¿Desea permitir el acceso a ${targetUser.email}?`
                : `¿Desea bloquear el acceso a ${targetUser.email}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, confirmar",
            confirmButtonColor: newStatus ? "#6fa174" : "#e53e3e",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem("cmsAdmin");
            const response = await fetch(`${API_URL}/${targetUser.admin_id}/isAuthorized`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isAuthorized: newStatus }),
            });

            if (response.ok) {
                setUsers((prevUsers) =>
                    prevUsers.map((u) => u.admin_id === targetUser.admin_id ? { ...u, isAuthorized: newStatus } : u)
                );
                Swal.fire("Éxito", "Permisos actualizados.", "success");
            } else {
                const errData = await response.json();
                Swal.fire("Error", errData.error || "Error desconocido", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Error de conexión con el servidor.", "error");
        }
    };

    const handleDeleteUser = async (targetUser) => {
        if (currentUserEmail !== SUPER_ADMIN_EMAIL) {
            Swal.fire("Acceso Denegado", "Solo el Super Admin puede eliminar usuarios.", "error");
            return;
        }
        if (targetUser.email === SUPER_ADMIN_EMAIL) {
            Swal.fire("Error Crítico", "No se puede eliminar la cuenta de Super Admin.", "error");
            return;
        }

        const confirmDelete = await Swal.fire({
            title: "¿Eliminar Usuario?",
            text: `Esta acción eliminará permanentemente a ${targetUser.email}. No se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            confirmButtonColor: "#c53030",
            cancelButtonText: "Cancelar"
        });

        if (!confirmDelete.isConfirmed) return;

        try {
            const token = localStorage.getItem("cmsAdmin");
            const response = await fetch(`${API_URL}/${targetUser.admin_id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setUsers((prevUsers) => prevUsers.filter((u) => u.admin_id !== targetUser.admin_id));
                Swal.fire("Eliminado", "El usuario ha sido eliminado correctamente.", "success");
            } else {
                const errData = await response.json();
                Swal.fire("Error", errData.error || "Error desconocido", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Error de conexión con el servidor.", "error");
        }
    };

    if (loading) return <div className="loading-container">Cargando usuarios...</div>;

    return (
        <div className="cms-users-wrapper">

            <div className="cms-page-header">
                <div className="cms-header-content">
                    <span className="cms-accent-line"></span>
                    <h1 className="cms-page-title">Gestión de Usuarios</h1>
                    <p className="cms-page-subtitle">
                        Controle el acceso al CMS. Autorice nuevos registros o revoque permisos a administradores existentes.
                    </p>
                </div>

                <div className="current-user-badge">
                    <FaUserShield />
                    <span>{currentUserEmail}</span>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="cms-card">
                <div className="cms-table-container">
                    <table className="cms-table">
                        <thead>
                        <tr>
                            <th>Correo Electrónico</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => {
                            const isAuth = user.isAuthorized === 1 || user.isAuthorized === true;
                            const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

                            return (
                                <tr key={user.admin_id}>
                                    <td>
                                        <span className="email-cell">{user.email}</span>
                                        {isSuperAdmin && <span className="role-badge">Super Admin</span>}
                                    </td>
                                    <td>
                      <span className={`status-pill ${isAuth ? "status-authorized" : "status-pending"}`}>
                        {isAuth ? "Autorizado" : "Pendiente"}
                      </span>
                                    </td>
                                    <td>
                                        <div className="action-container">
                                            <button
                                                className={`cms-btn-small ${isAuth ? "btn-revoke" : "btn-approve"}`}
                                                disabled={currentUserEmail !== SUPER_ADMIN_EMAIL || isSuperAdmin}
                                                onClick={() => handleToggleAuth(user)}
                                                title={isAuth ? "Revocar Acceso" : "Autorizar Acceso"}
                                            >
                                                {isAuth ? <><FaBan style={{marginRight:6}}/> Revocar</> : <><FaCheck style={{marginRight:6}}/> Autorizar</>}
                                            </button>

                                            <button
                                                className="cms-btn-small btn-delete"
                                                disabled={currentUserEmail !== SUPER_ADMIN_EMAIL || isSuperAdmin}
                                                onClick={() => handleDeleteUser(user)}
                                                title="Eliminar permanentemente"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{textAlign: 'center', padding: '30px', color: '#888'}}>
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}