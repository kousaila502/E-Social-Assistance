import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import BudgetManagementPage from './pages/BudgetManagement';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BudgetManagementPage />
      </div>
    </AuthProvider>
  );
}

export default App;