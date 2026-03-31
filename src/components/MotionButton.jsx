import { motion } from 'framer-motion';

function MotionButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold tracking-[0.02em] transition ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default MotionButton;
