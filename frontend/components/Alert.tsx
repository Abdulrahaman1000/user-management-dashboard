// components/Alert.tsx
import React from 'react';

interface AlertProps {
  message: string;
  type: 'success' | 'error';
}

const Alert: React.FC<AlertProps> = ({ message, type }) => {
  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-md shadow-md w-auto z-50 ${
        type === 'success'
          ? 'border-2 border-green-500 text-green-500'
          : 'border-4 border-red-500 text-red-500'
      }`}
    >
      <p>{message}</p>
    </div>
  );
};

export default Alert;
