import { useState, useEffect } from "react";
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
        // JWT decode without external library
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
      alert("Permiso denegado: Solo el Super Admin puede cambiar el estado de autorización.");
      return; 
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
        alert("No puede revocar su propio acceso de Super Admin.");
        return;
    }

    const currentIsAuth = targetUser.isAuthorized === 1 || targetUser.isAuthorized === true;
    const newStatus = !currentIsAuth; 
    const adminId = targetUser.admin_id; 

    try {
      const token = localStorage.getItem("cmsAdmin");
      const response = await fetch(`${API_URL}/${adminId}/isAuthorized`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAuthorized: newStatus }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
             const uId = u.admin_id;
             return uId === adminId ? { ...u, isAuthorized: newStatus } : u;
          })
        );
      } else {
        const errData = await response.json();
        alert(`Fallo: ${errData.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Ocurrió un error al conectar con el servidor.");
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (currentUserEmail !== SUPER_ADMIN_EMAIL) {
        alert("Permiso denegado: Solo el Super Admin puede eliminar usuarios.");
        return; 
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
        alert("CRÍTICO: No se puede eliminar la cuenta de Super Admin.");
        return;
    }

    const confirmDelete = window.confirm(
        `¿Está seguro de que desea eliminar permanentemente a ${targetUser.email}? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem("cmsAdmin");
        const adminId = targetUser.admin_id;

        const response = await fetch(`${API_URL}/${adminId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            setUsers((prevUsers) => prevUsers.filter((u) => u.admin_id !== adminId));
        } else {
            const errData = await response.json();
            alert(`Fallo al eliminar: ${errData.error || "Error desconocido"}`);
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Ocurrió un error al conectar con el servidor.");
    }
  };

  if (loading) return <div className="loading">Cargando usuarios...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="cms-manage-users">
      <div className="header-row">
        <h2>Administrar Acceso</h2>
        <p>Sesión iniciada como: {currentUserEmail}</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Correo Electrónico</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userId = user.admin_id;
              const isAuth = user.isAuthorized === 1 || user.isAuthorized === true;
              
              return (
                <tr key={userId}>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${isAuth ? "Activo" : "Pendiente"}`}>
                      {isAuth ? "Autorizado" : "Pendiente"}
                    </span>
                  </td>
                  <td>
                    {/* Action Buttons Wrapper */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className={`action-btn ${isAuth ? "revoke" : "approve"}`}
                          disabled={currentUserEmail !== SUPER_ADMIN_EMAIL}
                          style={{ opacity: currentUserEmail !== SUPER_ADMIN_EMAIL ? 0.5 : 1 }}
                          onClick={() => handleToggleAuth(user)}
                        >
                          {isAuth ? "Quitar Acceso" : "Autorizar"}
                        </button>
                        <button
                          className="action-btn delete"
                          disabled={currentUserEmail !== SUPER_ADMIN_EMAIL}
                          style={{ 
                              opacity: currentUserEmail !== SUPER_ADMIN_EMAIL ? 0.5 : 1,
                              backgroundColor: '#dc3545', // red
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer'
                          }}
                          onClick={() => handleDeleteUser(user)}
                        >
                          Eliminar
                        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
