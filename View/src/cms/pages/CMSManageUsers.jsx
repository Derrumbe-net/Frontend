import { useState, useEffect } from "react";
import "../../cms/styles/CMSManageUsers.css";

export default function CMSManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentUserEmail, setCurrentUserEmail] = useState(""); 

  const API_URL = "//derrumbe-test.derrumbe.net/api/admins";
  // const API_URL = "http://localhost:8080/api/admins";
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

      if (!response.ok) throw new Error("Failed to fetch users");

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
      alert("Permission Denied: Only the Super Admin can change authorization status.");
      return; 
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
        alert("You cannot revoke your own super admin access.");
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
        alert(`Failed: ${errData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("An error occurred connecting to the server.");
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (currentUserEmail !== SUPER_ADMIN_EMAIL) {
        alert("Permission Denied: Only the Super Admin can delete users.");
        return; 
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
        alert("CRITICAL: You cannot delete the Super Admin account.");
        return;
    }

    const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete ${targetUser.email}? This action cannot be undone.`
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
            alert(`Failed to delete: ${errData.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred connecting to the server.");
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="cms-manage-users">
      <div className="header-row">
        <h2>Manage Admin Access</h2>
        <p>Logged in as: {currentUserEmail}</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
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
                    <span className={`status-badge ${isAuth ? "active" : "pending"}`}>
                      {isAuth ? "Authorized" : "Pending"}
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
                          {isAuth ? "Revoke Access" : "Authorize"}
                        </button>
                        <button
                          className="action-btn delete"
                          disabled={currentUserEmail !== SUPER_ADMIN_EMAIL}
                          style={{ 
                              opacity: currentUserEmail !== SUPER_ADMIN_EMAIL ? 0.5 : 1,
                              backgroundColor: '#dc3545', // Red color for danger
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer'
                          }}
                          onClick={() => handleDeleteUser(user)}
                        >
                          Delete
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