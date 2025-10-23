import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './components/Home';
import { SignUp } from './components/SignUp';
import { Login } from './components/Login';
import { Profile } from './components/Profile';
import { UpdatePassword } from './components/UpdatePassword';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
