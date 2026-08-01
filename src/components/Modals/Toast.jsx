import { useEffect, useRef } from 'react';
import gsap from 'gsap';

function Toast({ message, show, type = 'success' }) {
  const toastRef = useRef(null);

  useEffect(() => {
    if (show) {
      gsap.to(toastRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out(1.5)'
      });
    } else {
      gsap.to(toastRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in'
      });
    }
  }, [show]);

  // Determine styles and icon based on type
  const getToastStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-600',
          icon: 'ph-fill ph-x-circle'
        };
      case 'warning':
        return {
          bg: 'bg-orange-500',
          icon: 'ph-fill ph-warning'
        };
      case 'info':
        return {
          bg: 'bg-blue-600',
          icon: 'ph-fill ph-info'
        };
      default: // success
        return {
          bg: 'bg-green-600',
          icon: 'ph-fill ph-check-circle'
        };
    }
  };

  const { bg, icon } = getToastStyles();

  return (
    <div
      ref={toastRef}
      className={`fixed bottom-5 right-5 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform translate-y-20 opacity-0 z-[120]`}
    >
      <i className={`${icon} text-2xl`}></i>
      <span className="font-medium">{message}</span>
    </div>
  );
}

export default Toast;
