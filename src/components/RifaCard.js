import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, Calendar, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const RifaCard = ({ rifa }) => {
  // Asegurarse de que numeros_vendidos sea un array, incluso si es null o undefined
  const numerosVendidos = rifa.numeros_vendidos || [];
  const porcentajeVendido = (numerosVendidos.length / rifa.total_numeros) * 100;
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative" /* Añadido relative para posicionar el botón */
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
        <img 
          src={rifa.imagen} 
          alt={rifa.titulo} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 m-2 rounded-full text-sm font-medium flex items-center gap-1">
          <motion.span
            role="img"
            aria-label="money-emoji"
            className="inline-block"
            whileHover={{ scale: 1.2, rotate: 15 }}
            animate={{ y: ["0%", "-10%", "0%"], rotate: [0, 5, -5, 0] }} // Animación de flotación y rotación
            transition={{ 
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              type: "spring", stiffness: 400, damping: 10 
            }}
          >
            💸
          </motion.span>
          Bs {rifa.precio_por_numero}
        </div>
      </div>
      
      <div className="p-5 pb-16"> {/* Añadido padding-bottom para dejar espacio al botón flotante */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">{rifa.titulo}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{rifa.descripcion}</p>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-500 mb-2">
          <Calendar size={16} />
          <span className="text-sm">Sorteo: {rifa.fecha_sorteo}</span>
        </div>
        
        {/* Eliminado la sección de "Números Vendidos" */}
        {/*
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-500 mb-4">
          <Ticket size={16} />
          <span className="text-sm">{numerosVendidos.length} números vendidos</span>
        </div>
        */}
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progreso</span>
            <span className="font-medium">{porcentajeVendido.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <motion.div 
              className="h-full rounded-full relative" 
              initial={{ width: 0 }}
              animate={{ width: `${porcentajeVendido}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 25%, #8B5CF6 50%, #EC4899 75%, #8B5CF6 100%)',
                backgroundSize: '400% 100%',
                animation: 'moveParticles 2s linear infinite'
              }}
            >
              <style>
                {`
                @keyframes moveParticles {
                  0% { background-position: 0% 0%; }
                  100% { background-position: -400% 0%; }
                }
                `}
              </style>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Botón flotante y centrado */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center mb-4">
        <Link to={`/rifa/${rifa.id}`}>
          <motion.button 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg"
            whileHover={{ scale: 1.1, boxShadow: '0 8px 15px rgba(128, 0, 128, 0.4)' }}
            whileTap={{ scale: 0.9 }}
            animate={{ y: ["0%", "-10%", "0%"] }}
            transition={{ y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
          >
            Compra ahora
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

export default RifaCard;