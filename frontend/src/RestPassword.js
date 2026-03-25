import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:4000/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (data.success) {
      alert("Password updated!");
      navigate('/login');
    } else {
      alert(data.message);
    }
  };

  return (
    <form onSubmit={handleReset}>
      <h2>New Password</h2>
      <input
        type="password"
        placeholder="Enter new password"
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Reset Password</button>
    </form>
  );
}

export default ResetPassword;