import { useState, useEffect } from "react";
import "../../cms/styles/CMSManageUsers.css";

export default function CMSManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "//derrumbe-test.derrumbe.net/api/admins";
  // const API_URL = "http://localhost:8080/api/admins";

  useEffect(() => {
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

  const handleToggleAuth = async (user) => {
    const currentIsAuth = user.isAuthorized === 1 || user.isAuthorized === true;
    const newStatus = !currentIsAuth; 

    const adminId = user.admin_id; 

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
      alert("An error occurred connection to the server.");
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="cms-manage-users">
      <div className="header-row">
        <h2>Manage Admin Access</h2>
        <span className="user-count">{users.length} Users found</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userId = user.admin_id;
              const isAuth = user.isAuthorized === 1 || user.isAuthorized === true;
              
              return (
                <tr key={userId}>
                  <td className="email-cell">{user.email}</td>
                  <td>
                    <span className={`status-badge ${isAuth ? "active" : "pending"}`}>
                      {isAuth ? "Authorized" : "Pending"}
                    </span>
                  </td>
                  <td>{new Date(user.created_at || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`action-btn ${isAuth ? "revoke" : "approve"}`}
                      onClick={() => handleToggleAuth(user)}
                    >
                      {isAuth ? "Revoke Access" : "Authorize"}
                    </button>
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