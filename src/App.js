import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import RifaCard from './components/RifaCard';
import CrearRifaForm from './components/CrearRifaForm';
import DetalleRifa from './components/DetalleRifa';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import EditarRifaForm from './components/EditarRifaForm';
import { supabase } from './supabaseClient';
import { Search, Ticket, User, Phone, Mail, CreditCard, Zap, Lock, CheckCircle, Award, DollarSign } from 'lucide-react';

const App = () => {
  const [rifas, setRifas] = useState([]);
  const [loadingRifas, setLoadingRifas] = useState(true);
  const [errorRifas, setErrorRifas] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  useEffect(() => {
    const fetchRifas = async () => {
      setLoadingRifas(true);
      const { data, error } = await supabase
        .from('rifas')
        .select('*');
      
      setLoadingRifas(false);
      if (error) {
        console.error('Error fetching rifas:', error);
        setErrorRifas('No se pudieron cargar las rifas.');
      } else {
        // Asegurarse de que los arrays existan en cada rifa
        const rifasConArraysValidos = data.map(rifa => ({
          ...rifa,
          numeros_vendidos: rifa.numeros_vendidos || [],
          numeros_no_disponibles: rifa.numeros_no_disponibles || [],
          numeros_pendientes: rifa.numeros_pendientes || []
        }));
        setRifas(rifasConArraysValidos);
      }
    };
    fetchRifas();
  }, []);
  
  const handleEliminarRifa = async (rifaId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta rifa? Esto eliminará también todos los participantes asociados.')) {
      const { error } = await supabase
        .from('rifas')
        .delete()
        .eq('id', rifaId);
      
      if (error) {
        console.error('Error al eliminar rifa:', error);
        alert('Hubo un error al eliminar la rifa. Intenta de nuevo.');
      } else {
        setRifas(rifas.filter(rifa => rifa.id !== rifaId));
        alert('Rifa eliminada exitosamente.');
      }
    }
  };
  
  // Componente para proteger rutas de administrador
  const ProtectedRoute = ({ children }) => {
    if (!adminMode) {
      return <Navigate to="/" replace />;
    }
    return children;
  };
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Fondo animado */}
        <div className="animated-background">
          <span>💸</span>
          <span>🔥</span>
          <span>💸</span>
          <span>🔥</span>
          <span>💸</span>
          <span>🔥</span>
          <span>💸</span>
          <span>🔥</span>
          <span>💸</span>
        </div>

        <Navbar setShowLoginModal={setShowLoginModal} />
        
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLogin={() => setAdminMode(true)}
        />
        
        <div className="container mx-auto px-4 pb-12 relative z-10"> {/* Añadido z-10 para asegurar que el contenido esté encima del fondo */}
          <Routes>
            <Route path="/" element={<HomePage rifas={rifas} loading={loadingRifas} error={errorRifas} />} />
            <Route path="/mis-rifas" element={<MisRifasPage rifas={rifas} loading={loadingRifas} error={errorRifas} />} />
            <Route path="/rifa/:id" element={
              <DetalleRifa adminMode={adminMode} />
            } />
            
            {/* Rutas protegidas de administrador */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel onEliminarRifa={handleEliminarRifa} />
              </ProtectedRoute>
            } />
            <Route path="/crear-rifa" element={
              <ProtectedRoute>
                <CrearRifaForm />
              </ProtectedRoute>
            } />
            {/* Nueva ruta para editar rifa */}
            <Route path="/editar-rifa/:id" element={
              <ProtectedRoute>
                <EditarRifaForm />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

const HomePage = ({ rifas, loading, error }) => {
  const rifasActivas = rifas.filter(rifa => new Date(rifa.fecha_sorteo) > new Date());
  const rifasCulminadas = rifas.filter(rifa => new Date(rifa.fecha_sorteo) <= new Date());

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('telefono'); // 'telefono', 'email' o 'identificacion'
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoadingBusqueda(true);
    setResultadoBusqueda(null); // Reiniciar resultado antes de la búsqueda
    setErrorBusqueda(null); // Reiniciar error antes de la búsqueda

    if (!searchQuery.trim()) {
      setErrorBusqueda('Por favor, ingresa un valor para la búsqueda.');
      setLoadingBusqueda(false);
      return;
    }

    try {
      let query = supabase.from('participantes').select(`
        *,
        rifas (
          titulo,
          imagen,
          fecha_sorteo
        )
      `).eq('estado', 'confirmado');

      if (searchType === 'telefono') {
        query = query.eq('telefono', searchQuery.trim());
      } else if (searchType === 'email') {
        query = query.eq('email', searchQuery.trim());
      } else if (searchType === 'identificacion') {
        query = query.eq('identificacion', searchQuery.trim());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al buscar números:', error);
        setErrorBusqueda('Hubo un error al buscar tus números. Intenta de nuevo.');
        setResultadoBusqueda(null); // Asegurarse de que el resultado sea nulo en caso de error
      } else if (data && data.length > 0) {
        setResultadoBusqueda(data);
      } else {
        setErrorBusqueda(`No se encontraron números comprados con ${
          searchType === 'telefono' ? 'el teléfono' : 
          searchType === 'email' ? 'el correo electrónico' : 
          'la identificación'
        } proporcionado.`);
        setResultadoBusqueda(null); // Asegurarse de que el resultado sea nulo si no hay datos
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setErrorBusqueda('Ocurrió un error inesperado. Intenta de nuevo.');
      setResultadoBusqueda(null); // Asegurarse de que el resultado sea nulo en caso de error inesperado
    } finally {
      setLoadingBusqueda(false);
    }
  };
  
  return (
    <div>
      {/* Sección de Rifas Activas */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Cargando rifas activas...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : rifasActivas.length > 0 ? (
        <>
          <motion.h2 
            className="text-4xl font-extrabold text-gray-800 mb-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, x: 5 }}
            style={{
              background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '400% 100%',
              animation: 'colorShift 10s linear infinite'
            }}
          >
            Rifas Activas
            <style>
              {`
              @keyframes colorShift {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
              }
              `}
            </style>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {rifasActivas.map(rifa => (
              <RifaCard key={rifa.id} rifa={rifa} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md mb-12">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay rifas activas en este momento</h3>
          <p className="text-gray-600 mb-6">Vuelve pronto para ver nuevas rifas</p>
        </div>
      )}

      {/* Sección para verificar números (integrada) */}
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Verifica tus Números Comprados</h2>
        <p className="text-gray-600 mb-6">Ingresa tu número de teléfono, correo electrónico o identificación para ver tus números de rifa.</p>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type={searchType === 'telefono' ? 'tel' : searchType === 'email' ? 'email' : 'text'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchType === 'telefono' ? 'Ej: 584123456789' : 
                searchType === 'email' ? 'Ej: tu@correo.com' : 
                'Ej: V-12345678'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="searchType"
                value="telefono"
                checked={searchType === 'telefono'}
                onChange={() => setSearchType('telefono')}
              />
              <span className="ml-2 text-gray-700">Teléfono</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="searchType"
                value="email"
                checked={searchType === 'email'}
                onChange={() => setSearchType('email')}
              />
              <span className="ml-2 text-gray-700">Correo</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="searchType"
                value="identificacion"
                checked={searchType === 'identificacion'}
                onChange={() => setSearchType('identificacion')}
              />
              <span className="ml-2 text-gray-700">Identificación</span>
            </label>
          </div>
          <motion.button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loadingBusqueda}
          >
            {loadingBusqueda ? 'Buscando...' : <><Search size={18} /> Buscar</>}
          </motion.button>
        </form>

        {errorBusqueda && (
          <motion.div 
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errorBusqueda}
          </motion.div>
        )}

        {resultadoBusqueda && resultadoBusqueda.length > 0 && (
          <motion.div
            className="mt-6 space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xl font-bold text-gray-800">Tus Números Comprados:</h3>
            {resultadoBusqueda.map((participante, index) => (
              <motion.div 
                key={index}
                className="p-4 bg-green-50 border border-green-200 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Ticket size={16} />
                    <span className="font-medium">Rifa:</span> {participante.rifas.titulo}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <User size={16} />
                    <span className="font-medium">Comprador:</span> {participante.nombre}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Phone size={16} />
                    <span className="font-medium">Teléfono:</span> {participante.telefono}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail size={16} />
                    <span className="font-medium">Email:</span> {participante.email}
                  </p>
                  {participante.identificacion && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <CreditCard size={16} />
                      <span className="font-medium">Identificación:</span> {participante.identificacion}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Ticket size={16} />
                    <span className="font-medium">Números comprados:</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {participante.numeros_comprados.map(num => (
                      <span key={num} className={`px-2 py-0.5 rounded text-xs font-semibold bg-purple-600 text-white`}>
                        {num}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Fecha del sorteo:</span> {participante.rifas.fecha_sorteo}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
      
      {/* Sección de Rifas Culminadas */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Cargando rifas culminadas...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : rifasCulminadas.length > 0 ? (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Rifas Culminadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rifasCulminadas.map(rifa => (
              <RifaCard key={rifa.id} rifa={rifa} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay rifas culminadas aún</h3>
          <p className="text-gray-600 mb-6">¡Sé el primero en culminar una rifa!</p>
        </div>
      )}

      {/* Nueva Sección: Llamado a la acción y beneficios */}
      <motion.div
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mt-12 shadow-xl"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <h2 className="text-4xl font-extrabold text-center mb-4">¡COMPRA TUS BOLETOS AHORA!</h2>
        <p className="text-xl text-center mb-8 opacity-90">
          Cada boleto es una oportunidad de cambiar tu vida. ¡No dejes pasar esta oportunidad!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BenefitCard 
            icon={<Zap size={40} className="text-yellow-300" />}
            title="Proceso rápido"
            description="Compra en menos de 2 minutos"
          />
          <BenefitCard 
            icon={<Lock size={40} className="text-blue-300" />}
            title="Pago seguro"
            description="Múltiples métodos de pago"
          />
          <BenefitCard 
            icon={<CheckCircle size={40} className="text-green-300" />}
            title="Confirmación inmediata"
            description="Recibes tus números al instante"
          />
          <BenefitCard 
            icon={<Award size={40} className="text-red-300" />}
            title="Premios garantizados"
            description="Sorteo 100% transparente"
          />
          <BenefitCard 
            icon={<DollarSign size={40} className="text-lime-300" />}
            title="Precios accesibles"
            description="Boletos desde 10,00 Bs"
          />
          <BenefitCard 
            icon={<Ticket size={40} className="text-orange-300" />}
            title="Múltiples oportunidades"
            description="Hasta 100 boletos por persona"
          />
        </div>
      </motion.div>
    </div>
  );
};

const BenefitCard = ({ icon, title, description }) => (
  <motion.div 
    className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center flex flex-col items-center"
    whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-sm opacity-80">{description}</p>
  </motion.div>
);

const MisRifasPage = ({ rifas, loading, error }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Todas las Rifas</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-600">Cargando rifas...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : rifas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay rifas disponibles</h3>
          <p className="text-gray-600 mb-6">Vuelve pronto para ver nuevas rifas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rifas.map(rifa => (
            <RifaCard key={rifa.id} rifa={rifa} />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;