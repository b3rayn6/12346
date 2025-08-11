import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { CheckCircle, XCircle, Info, Loader, Ticket, Calendar, DollarSign, User, Phone, Mail, CreditCard, ArrowLeft } from 'lucide-react';

// Datos de países simplificados para el ejemplo
const countries = [
  { code: 'VE', name: 'Venezuela', dial_code: '+58' },
  { code: 'CO', name: 'Colombia', dial_code: '+57' },
  { code: 'US', name: 'Estados Unidos', dial_code: '+1' },
  { code: 'ES', name: 'España', dial_code: '+34' },
  { code: 'AR', name: 'Argentina', dial_code: '+54' },
  { code: 'CL', name: 'Chile', dial_code: '+56' },
  { code: 'MX', name: 'México', dial_code: '+52' },
  // Puedes añadir más países aquí
];

const DetalleRifa = ({ adminMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rifa, setRifa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cantidadNumeros, setCantidadNumeros] = useState(1); // Cantidad de números a comprar
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [procesandoCompra, setProcesandoCompra] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'VE')); // Venezuela por defecto

  useEffect(() => {
    const fetchRifa = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('rifas')
        .select('*')
        .eq('id', id)
        .single();
      
      setLoading(false);
      if (error) {
        console.error('Error fetching rifa:', error);
        setError('No se pudo cargar la rifa.');
      } else {
        // Asegurarse de que los arrays existan
        setRifa({
          ...data,
          numeros_vendidos: data.numeros_vendidos || [],
          numeros_no_disponibles: data.numeros_no_disponibles || [],
          numeros_pendientes: data.numeros_pendientes || []
        });
      }
    };
    fetchRifa();
  }, [id]);

  // Función para obtener números disponibles y asignarlos automáticamente
  const asignarNumerosAutomaticos = (cantidad) => {
    if (!rifa) return [];
    const todosLosNumeros = Array.from({ length: rifa.total_numeros }, (_, i) => i + 1);
    const numerosOcupados = new Set([...rifa.numeros_vendidos, ...rifa.numeros_no_disponibles, ...rifa.numeros_pendientes]);
    
    const numerosDisponibles = todosLosNumeros.filter(num => !numerosOcupados.has(num));
    
    // Asigna los primeros 'cantidad' números disponibles
    return numerosDisponibles.slice(0, cantidad);
  };

  const handleCantidadChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setCantidadNumeros(value);
    }
  };

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const country = countries.find(c => c.code === countryCode);
    setSelectedCountry(country);
    // Si el teléfono ya tiene un código de país, lo reemplaza
    if (telefono.startsWith(selectedCountry.dial_code)) {
      setTelefono(country.dial_code + telefono.substring(selectedCountry.dial_code.length));
    } else {
      setTelefono(country.dial_code);
    }
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value;
    // Asegura que el código de país se mantenga si el usuario lo borra accidentalmente
    if (!value.startsWith(selectedCountry.dial_code)) {
      setTelefono(selectedCountry.dial_code + value.replace(selectedCountry.dial_code, ''));
    } else {
      setTelefono(value);
    }
  };

  const handleComprar = async (e) => {
    e.preventDefault();
    
    const numerosAsignados = asignarNumerosAutomaticos(cantidadNumeros);

    if (numerosAsignados.length === 0) {
      setMensajeConfirmacion('No hay números disponibles para la cantidad solicitada.');
      setMostrarModalConfirmacion(true);
      return;
    }
    if (numerosAsignados.length < cantidadNumeros) {
      setMensajeConfirmacion(`Solo se pudieron asignar ${numerosAsignados.length} números. Por favor, ajusta la cantidad.`);
      setMostrarModalConfirmacion(true);
      return;
    }
    if (!nombre || !telefono) {
      setMensajeConfirmacion('Por favor, completa tu nombre y teléfono.');
      setMostrarModalConfirmacion(true);
      return;
    }

    setProcesandoCompra(true);

    try {
      // 1. Actualizar la rifa con los números pendientes
      const nuevosNumerosPendientes = [...rifa.numeros_pendientes, ...numerosAsignados];
      const { data: rifaActualizada, error: errorUpdateRifa } = await supabase
        .from('rifas')
        .update({
          numeros_pendientes: nuevosNumerosPendientes
        })
        .eq('id', rifa.id)
        .select('*')
        .single();

      if (errorUpdateRifa) throw errorUpdateRifa;

      // 2. Insertar el participante con estado 'pendiente'
      const { data: participante, error: errorInsertParticipante } = await supabase
        .from('participantes')
        .insert({
          rifa_id: rifa.id,
          nombre,
          telefono,
          email,
          identificacion,
          numeros_comprados: numerosAsignados, // Usar los números asignados automáticamente
          estado: 'pendiente',
          fecha_compra: new Date().toISOString()
        })
        .select('*')
        .single();

      if (errorInsertParticipante) throw errorInsertParticipante;

      // Actualizar el estado local de la rifa
      setRifa(rifaActualizada);

      // Generar mensaje de WhatsApp con formato mejorado
      const mensajeWhatsApp = encodeURIComponent(
        `¡Hola! Tengo una nueva solicitud de compra para la rifa:\n\n` +
        `*Rifa:* ${rifa.titulo}\n` +
        `*Números solicitados:* ${cantidadNumeros}\n` +
        `*Números asignados:* ${numerosAsignados.join(', ')}\n` +
        `*Total a pagar:* Bs ${totalPagar}\n\n` +
        `*Datos del comprador:*\n` +
        `*Nombre:* ${nombre}\n` +
        `*Teléfono:* ${telefono}\n` +
        (email ? `*Email:* ${email}\n` : '') +
        (identificacion ? `*Identificación:* ${identificacion}\n` : '') +
        `\nPor favor, confirma la disponibilidad y los pasos para el pago. ¡Gracias!`
      );
      const numeroWhatsAppAdmin = '584264491058'; 
      const urlWhatsApp = `https://wa.me/${numeroWhatsAppAdmin}?text=${mensajeWhatsApp}`;

      // Redirigir a WhatsApp
      window.open(urlWhatsApp, '_blank');

      setMensajeConfirmacion('¡Solicitud enviada! Serás redirigido a WhatsApp para confirmar tu compra.');
      setMostrarModalConfirmacion(true);

      // Limpiar formulario después de un breve retraso para que el usuario vea el mensaje
      setTimeout(() => {
        setNombre('');
        setTelefono('');
        setEmail('');
        setIdentificacion('');
        setCantidadNumeros(1);
        setMostrarModalConfirmacion(false);
        setProcesandoCompra(false);
      }, 3000); // 3 segundos antes de limpiar y cerrar el modal
      
    } catch (err) {
      console.error('Error al procesar la compra:', err);
      setMensajeConfirmacion('Hubo un error al procesar tu compra. Por favor, inténtalo de nuevo.');
      setMostrarModalConfirmacion(true);
      setProcesandoCompra(false);
    }
  };

  const numerosDisponiblesCount = rifa ? (rifa.total_numeros - rifa.numeros_vendidos.length - rifa.numeros_no_disponibles.length - rifa.numeros_pendientes.length) : 0;
  const totalPagar = cantidadNumeros * (rifa ? rifa.precio_por_numero : 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <XCircle size={48} className="mx-auto mb-4" />
        <p>{error}</p>
        <motion.button
          onClick={() => navigate('/')}
          className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={18} /> Volver al inicio
        </motion.button>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="text-center py-12 text-gray-600">
        <Info size={48} className="mx-auto mb-4" />
        <p>Rifa no encontrada.</p>
        <motion.button
          onClick={() => navigate('/')}
          className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={18} /> Volver al inicio
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        onClick={() => navigate(-1)}
        className="mb-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={18} /> Volver
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna de Detalles de la Rifa */}
        <div>
          <motion.img 
            src={rifa.imagen} 
            alt={rifa.titulo} 
            className="w-full h-64 object-cover rounded-lg mb-6 shadow-md"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{rifa.titulo}</h1>
          <p className="text-gray-600 mb-4">{rifa.descripcion}</p>
          
          <div className="space-y-2 mb-6">
            <p className="flex items-center text-gray-700">
              <Calendar size={18} className="mr-2 text-purple-500" />
              <span className="font-semibold">Fecha del Sorteo:</span> {rifa.fecha_sorteo}
            </p>
            <p className="flex items-center text-gray-700">
              <DollarSign size={18} className="mr-2 text-green-500" />
              <span className="font-semibold">Precio por Número:</span> Bs {rifa.precio_por_numero}
            </p>
            <p className="flex items-center text-gray-700">
              <Ticket size={18} className="mr-2 text-blue-500" />
              <span className="font-semibold">Números Totales:</span> {rifa.total_numeros}
            </p>
            <p className="flex items-center text-gray-700">
              <Ticket size={18} className="mr-2 text-yellow-500" />
              <span className="font-semibold">Números Pendientes:</span> {rifa.numeros_pendientes.length}
            </p>
          </div>

          {adminMode && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Información de Administrador:</h3>
              <p className="text-sm text-blue-700">Números Vendidos: {rifa.numeros_vendidos.join(', ')}</p>
              <p className="text-sm text-blue-700">Números No Disponibles: {rifa.numeros_no_disponibles.join(', ')}</p>
              <p className="text-sm text-blue-700">Números Pendientes: {rifa.numeros_pendientes.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Columna de Formulario de Compra */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comprar Números</h2>
          
          <div className="mb-4">
            <label htmlFor="cantidad" className="block text-gray-700 font-medium mb-2">Cantidad de números a comprar:</label>
            <input
              type="number"
              id="cantidad"
              value={cantidadNumeros}
              onChange={handleCantidadChange}
              min="1"
              max={numerosDisponiblesCount} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-gray-800 font-semibold">Números a solicitar: {cantidadNumeros}</p>
            <p className="text-gray-800 font-semibold">Total a pagar: Bs {totalPagar}</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tus Datos</h2>
          <form onSubmit={handleComprar} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-gray-700 font-medium mb-2">Nombre Completo:</label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label htmlFor="telefono" className="block text-gray-700 font-medium mb-2">Número de Teléfono (WhatsApp):</label>
              <div className="flex">
                <select
                  value={selectedCountry.code}
                  onChange={handleCountryChange}
                  className="px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.dial_code} ({country.code})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="telefono"
                  value={telefono}
                  onChange={handleTelefonoChange}
                  placeholder="Ej: 4123456789"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Correo Electrónico (Opcional):</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label htmlFor="identificacion" className="block text-gray-700 font-medium mb-2">Cédula/Identificación (Opcional):</label>
              <input
                type="text"
                id="identificacion"
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <motion.button
              type="submit"
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02, boxShadow: '0 5px 15px rgba(128, 0, 128, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              disabled={procesandoCompra || cantidadNumeros > numerosDisponiblesCount}
            >
              {procesandoCompra ? (
                <>
                  <Loader className="animate-spin" size={20} /> Procesando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} /> Comprar Números
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {mostrarModalConfirmacion && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Mensaje</h3>
              <p className="text-gray-600 mb-6">{mensajeConfirmacion}</p>
              <motion.button
                onClick={() => setMostrarModalConfirmacion(false)}
                className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cerrar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DetalleRifa;