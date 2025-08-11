import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, List, Menu, X } from 'lucide-react';
import { logoBrayanRifas1 } from '../supabaseClient';

const Navbar = ({ setShowLoginModal }) => {
  const [clickCount, setClickCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount === 5) {
      setShowLoginModal(true);
      setClickCount(0);
    }
    
    setTimeout(() => {
      setClickCount(0);
    }, 3000);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const textVariants = {
    initial: {
      backgroundPosition: "0% 50%"
    },
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: {
        duration: 5,
        ease: "linear",
        repeat: Infinity
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    }
  };
  
  return (
    <motion.nav 
      className="bg-white shadow-md py-4 px-6 mb-8"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img src={logoBrayanRifas1} alt="BrayanRifas Logo" className="h-8 w-auto" />
          <motion.span 
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text"
            style={{ backgroundSize: "200% auto", fontFamily: 'Pacifico, cursive' }} /* Aplicado solo aquí */
            variants={textVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            BrayanRifas
          </motion.span>
        </div>
        
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-gray-700 focus:outline-none">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="hidden md:flex gap-4">
          <NavLink to="/" icon={<Home size={18} />} text="Inicio" />
          <NavLink to="/mis-rifas" icon={<List size={18} />} text="Rifas Disponibles" />
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-4 border-t border-gray-200 pt-4"
          >
            <div className="flex flex-col items-center space-y-3">
              <NavLink to="/" icon={<Home size={18} />} text="Inicio" onClick={toggleMobileMenu} />
              <NavLink to="/mis-rifas" icon={<List size={18} />} text="Rifas Disponibles" onClick={toggleMobileMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const NavLink = ({ to, icon, text, onClick }) => (
  <Link to={to} onClick={onClick}>
    <motion.div 
      className="flex items-center gap-1 px-4 py-2 rounded-full text-gray-700 hover:bg-purple-100 hover:text-purple-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </motion.div>
  </Link>
);

export default Navbar;