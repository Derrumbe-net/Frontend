import { useState, useEffect } from "react";
import "../../cms/styles/CMSManageUsers.css";

export default function CMSManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8080/api/admins";

  // Fetch all admins on load
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
      // data might be an array, or wrapped in { data: [...] } depending on your API
      setUsers(Array.isArray(data) ? data : data.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleToggleAuth = async (userId, currentStatus) => {
    // Determine new status (toggle 1 to 0, or 0 to 1)
    const newStatus = currentStatus === 1 || currentStatus === true ? 0 : 1;

    try {
      const token = localStorage.getItem("cmsAdmin");
      // Note: You need to ensure this route exists in your PHP API
      const response = await fetch(`${API_URL}/${userId}/authorization`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAuthorized: newStatus }),
      });

      if (response.ok) {
        // Optimistically update the UI
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, isAuthorized: newStatus } : user
          )
        );
      } else {
        alert("Failed to update authorization status");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("An error occurred.");
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
              {/* ID Header Removed */}
              <th>Email</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              // Normalize status to boolean for easy checking
              const isAuth = user.isAuthorized === 1 || user.isAuthorized === true;
              
              return (
                <tr key={user.id}>
                  {/* ID Data Cell Removed */}
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
                      onClick={() => handleToggleAuth(user.id, user.isAuthorized)}
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