import React from 'react';
import '../styles/dashboard.css';
import Messenger from './Messenger';

// Dashboard tối giản: hiển thị trực tiếp chat UI
const Dashboard = () => (
  <div className="dashboard" style={{ padding: 0 }}>
    <Messenger onBack={() => { /* no-op on dashboard */ }} />
  </div>
);

export default Dashboard;