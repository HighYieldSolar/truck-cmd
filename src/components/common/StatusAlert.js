// src/components/common/StatusAlert.js
import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, X, Info } from "lucide-react";

export default function StatusAlert({ 
  type = "success",  // success, error, warning, info
  message = "", 
  onClose = () => {},
  duration = 5000,
  className = ""
}) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Auto dismiss after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose(), 300); // Allow for animation to finish
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 300); // Allow for animation to finish
  };
  
  // Color schemes based on type
  const getStyles = () => {
    switch(type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-400',
          text: 'text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          iconBg: 'bg-green-100'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          text: 'text-red-800',
          icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
          iconBg: 'bg-red-100'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-400',
          text: 'text-yellow-800',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
          iconBg: 'bg-yellow-100'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          text: 'text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-400" />,
          iconBg: 'bg-blue-100'
        };
    }
  };
  
  const styles = getStyles();
  
  return (
    <div 
      className={`rounded-md ${styles.bg} border-l-4 ${styles.border} p-4 transition-all duration-300 ${
        visible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
      } ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm ${styles.text}`}>{message}</p>
        </div>
        <div>
          <button
            onClick={handleClose}
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <X className={`h-5 w-5 ${styles.text}`} />
          </button>
        </div>
      </div>
    </div>
  );
}