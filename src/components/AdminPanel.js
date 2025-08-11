import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlusCircle, BarChart3, Settings, Lock, Ticket, Trash2, Search, User, Phone, CheckCircle, XCircle, Bell, Edit, PlayCircle, PauseCircle, Award, Users } from 'lucide-react'; // Añadido Users para la nueva sección
import RifaCard from './RifaCard';
import { supabase } from '../supabaseClient';

const AdminPanel = ({ onEliminarRifa }) => {
  const [rifas, setRifas] = useState([]);
  const [loadingRifas, setLoadingRifas] = useState(true);
  const [errorRifas, setErrorRifas] = useState(null);

  const [busquedaNumero, setBusquedaNumero] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [mostrarSolicitudes, setMostrarSolicitudes] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [mostrarCompradores, setMostrarCompradores] = useState(false); // Nuevo estado para mostrar compradores
  const [compradores, setCompradores] = useState([]); // Estado para almacenar compradores
  const [loadingCompradores, setLoadingCompradores] = useState(false); // Estado de carga para compradores

  // Estados para la ruleta
  const [mostrarRuleta, setMostrarRuleta] = useState(false);
  const [rifaSeleccionadaRuleta, setRifaSeleccionadaRuleta] = useState(null);
  const [numerosVendidosRifa, setNumerosVendidosRifa] = useState([]);
  const [ganadorRuleta, setGanadorRuleta] = useState(null);
  const [numeroGanadorRuleta, setNumeroGanadorRuleta] = useState(null);
  const [girandoRuleta, setGirandoRuleta] = useState(false);

  useEffect(() => {
    const fetchRifas = async () => {
      setLoadingRifas(true);
      const { data, error } = await supabase
        .from('rifas')
        .select('*');
      
      setLoadingRifas(false);
      if (error) {
        console.error('Error fetching rifas for admin:', error);
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

  useEffect(() => {
    const fetchSolicitudesPendientes = async () => {
      setLoadingSolicitudes(true);
      const { data, error } = await supabase
        .from('participantes')
        .select(`
          *,
          rifas (
            id,
            titulo,
            precio_por_numero,
            total_numeros,
            numeros_vendidos,
            numeros_no_disponibles,
            numeros_pendientes
          )
        `)
        .eq('estado', 'pendiente');
      
      setLoadingSolicitudes(false);
      if (error) {
        console.error('Error fetching solicitudes pendientes:', error);
      } else {
        setSolicitudesPendientes(data || []);
      }
    };

    if (mostrarSolicitudes) {
      fetchSolicitudesPendientes();
    }
  }, [mostrarSolicitudes]);

  useEffect(() => {
    const fetchCompradores = async () => {
      setLoadingCompradores(true);
      const { data, error } = await supabase
        .from('participantes')
        .select(`
          *,
          rifas (
            id,
            titulo
          )
        `)
        .eq('estado', 'confirmado'); // Solo compradores confirmados
      
      setLoadingCompradores(false);
      if (error) {
        console.error('Error fetching compradores:', error);
      } else {
        setCompradores(data || []);
      }
    };

    if (mostrarCompradores) {
      fetchCompradores();
    }
  }, [mostrarCompradores]);
  
  // Calcular estadísticas
  const totalRifas = rifas.length;
  const totalNumeros = rifas.reduce((sum, rifa) => sum + rifa.total_numeros, 0);
  const numerosVendidos = rifas.reduce((sum, rifa) => sum + (rifa.numeros_vendidos || []).length, 0);
  const porcentajeVendido = totalNumeros > 0 ? (numerosVendidos / totalNumeros) * 100 : 0;
  const totalRecaudado = rifas.reduce((sum, rifa) => sum + (rifa.precio_por_numero * (rifa.numeros_vendidos || []).length), 0); // Añadido
  const totalSolicitudesPendientes = solicitudesPendientes.length;
  
  const handleBuscarGanador = async () => {
    const numero = parseInt(busquedaNumero);
    if (isNaN(numero) || numero <= 0) {
      setResultadoBusqueda({ error: 'Por favor ingresa un número válido' });
      return;
    }
    
    setResultadoBusqueda(null); // Limpiar resultados anteriores
    
    // Buscar en la tabla de participantes
    const { data: participantes, error } = await supabase
      .from('participantes')
      .select(`
        *,
        rifas (
          titulo
        )
      `)
      .contains('numeros_comprados', [numero]) // Busca si el array contiene el número
      .eq('estado', 'confirmado'); // Solo buscar en participantes confirmados
      
    if (error) {
      console.error('Error buscando participante:', error);
      setResultadoBusqueda({ error: 'Hubo un error al buscar el participante.' });
      return;
    }
    
    if (participantes && participantes.length > 0) {
      // Encontró al menos un participante con ese número
      // Si un número puede ser comprado por varias personas en diferentes rifas, esto lo manejaría.
      // Para este caso, asumimos que un número es único por rifa.
      const primerResultado = participantes[0]; // Tomamos el primer Resultado
      setResultadoBusqueda({
        participante: {
          nombre: primerResultado.nombre,
          telefono: primerResultado.telefono,
          email: primerResultado.email,
          identificacion: primerResultado.identificacion,
          numeros: primerResultado.numeros_comprados || [] // Todos los números que compró
        },
        rifa: {
          id: primerResultado.rifa_id,
          titulo: primerResultado.rifas.titulo
        },
        numeroBuscado: numero // El número específico que se buscó
      });
    } else {
      setResultadoBusqueda({ error: 'No se encontró ningún participante con ese número' });
    }
  };
  
  const generarEnlaceWhatsApp = (telefono, nombre, rifaTitulo, numero, premio) => {
    const mensaje = encodeURIComponent(
      `¡Hola ${nombre}! Te contactamos de BrayanRifas para informarte que has ganado la rifa "${rifaTitulo}" con el número ${numero}. ¡Felicidades! Tu premio es: ${premio}. Por favor, contáctanos para coordinar la entrega de tu premio.`
    );
    return `https://wa.me/58${telefono}?text=${mensaje}`;
  };

  const handleConfirmarSolicitud = async (solicitud) => {
    if (!confirm(`¿Confirmar la compra de ${solicitud.numeros_comprados.length} números para ${solicitud.nombre}?`)) {
      return;
    }

    try {
      let numerosAsignados = solicitud.numeros_comprados;
      let rifaActualizada = solicitud.rifas;

      // Si la solicitud no tiene números pre-asignados (es decir, el usuario no los seleccionó manualmente)
      if (!numerosAsignados || numerosAsignados.length === 0) {
        const todosLosNumeros = Array.from({ length: rifaActualizada.total_numeros }, (_, i) => i + 1);
        const numerosOcupados = new Set([
          ...(rifaActualizada.numeros_vendidos || []),
          ...(rifaActualizada.numeros_no_disponibles || []),
          ...(rifaActualizada.numeros_pendientes || [])
        ]);
        const numerosDisponibles = todosLosNumeros.filter(num => !numerosOcupados.has(num));
        
        // Asignar la cantidad de números que el usuario solicitó
        numerosAsignados = numerosDisponibles.slice(0, solicitud.numeros_comprados.length);

        if (numerosAsignados.length < solicitud.numeros_comprados.length) {
          alert('No hay suficientes números disponibles para asignar a esta solicitud.');
          return;
        }
      }

      // 1. Actualizar estado del participante a confirmado y sus números comprados
      const { error: errorParticipante } = await supabase
        .from('participantes')
        .update({ estado: 'confirmado', numeros_comprados: numerosAsignados })
        .eq('id', solicitud.id);

      if (errorParticipante) throw errorParticipante;

      // 2. Obtener la rifa actual (ya la tenemos en solicitud.rifas, pero la refrescamos por si acaso)
      const { data: rifaData, error: errorRifa } = await supabase
        .from('rifas')
        .select('numeros_vendidos, numeros_pendientes')
        .eq('id', solicitud.rifa_id)
        .single();

      if (errorRifa) throw errorRifa;

      // 3. Actualizar la rifa: mover números de pendientes a vendidos
      const numeros_pendientes = rifaData.numeros_pendientes || [];
      const numeros_vendidos = rifaData.numeros_vendidos || [];
      
      // Filtrar los números de esta solicitud de los pendientes
      const nuevos_pendientes = numeros_pendientes.filter(n => !numerosAsignados.includes(n));
      
      // Añadir los números de esta solicitud a los vendidos
      const nuevos_vendidos = [...new Set([...numeros_vendidos, ...numerosAsignados])];

      const { error: errorUpdate } = await supabase
        .from('rifas')
        .update({
          numeros_vendidos: nuevos_vendidos,
          numeros_pendientes: nuevos_pendientes
        })
        .eq('id', solicitud.rifa_id);

      if (errorUpdate) throw errorUpdate;

      // 4. Actualizar la lista de solicitudes pendientes
      setSolicitudesPendientes(solicitudesPendientes.filter(s => s.id !== solicitud.id));

      alert('Solicitud confirmada exitosamente');

      // Generar mensaje de WhatsApp para el usuario
      const numeroTexto = numerosAsignados.length === 1 ? 'tu número es' : 'tus números son';
      const mensajeWhatsAppUsuario = encodeURIComponent(
        `¡Hola ${solicitud.nombre}! 🎉 Tu compra para la rifa "${solicitud.rifas.titulo}" ha sido confirmada. ${numeroTexto}: *${numerosAsignados.join(', ')}*. ¡Mucha suerte en el sorteo! 🍀`
      );
      const urlWhatsAppUsuario = `https://wa.me/${solicitud.telefono}?text=${mensajeWhatsAppUsuario}`;

      // Abrir WhatsApp para enviar el mensaje al usuario
      window.open(urlWhatsAppUsuario, '_blank');

    } catch (error) {
      console.error('Error al confirmar solicitud:', error);
      alert('Hubo un error al confirmar la solicitud. Intenta de nuevo.');
    }
  };

  const handleRechazarSolicitud = async (solicitud) => {
    if (!confirm(`¿Rechazar la solicitud de ${solicitud.numeros_comprados.length} números para ${solicitud.nombre}?`)) {
      return;
    }

    try {
      // 1. Actualizar estado del participante a rechazado
      const { error: errorParticipante } = await supabase
        .from('participantes')
        .update({ estado: 'rechazado' })
        .eq('id', solicitud.id);

      if (errorParticipante) throw errorParticipante;

      // 2. Obtener la rifa actual
      const { data: rifaData, error: errorRifa } = await supabase
        .from('rifas')
        .select('numeros_pendientes')
        .eq('id', solicitud.rifa_id)
        .single();

      if (errorRifa) throw errorRifa;

      // 3. Actualizar la rifa: quitar números de pendientes
      const numeros_pendientes = rifaData.numeros_pendientes || [];
      
      // Filtrar los números de esta solicitud de los pendientes
      const nuevos_pendientes = numeros_pendientes.filter(n => !solicitud.numeros_comprados.includes(n));

      const { error: errorUpdate } = await supabase
        .from('rifas')
        .update({
          numeros_pendientes: nuevos_pendientes
        })
        .eq('id', solicitud.rifa_id);

      if (errorUpdate) throw errorUpdate;

      // 4. Actualizar la lista de solicitudes pendientes
      setSolicitudesPendientes(solicitudesPendientes.filter(s => s.id !== solicitud.id));

      alert('Solicitud rechazada exitosamente');
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('Hubo un error al rechazar la solicitud. Intenta de nuevo.');
    }
  };

  const handleToggleRifaStatus = async (rifaId, currentStatus) => {
    const newStatus = currentStatus === 'activa' ? 'culminada' : 'activa';
    const confirmMessage = `¿Estás seguro de que quieres marcar esta rifa como "${newStatus}"?`;

    if (window.confirm(confirmMessage)) {
      const { error } = await supabase
        .from('rifas')
        .update({ estado: newStatus })
        .eq('id', rifaId);

      if (error) {
        console.error('Error al cambiar el estado de la rifa:', error);
        alert('Hubo un error al cambiar el estado de la rifa. Intenta de nuevo.');
      } else {
        setRifas(prevRifas => 
          prevRifas.map(rifa => 
            rifa.id === rifaId ? { ...rifa, estado: newStatus } : rifa
          )
        );
        alert(`Rifa marcada como "${newStatus}" exitosamente.`);
      }
    }
  };

  const handleSelectRifaForRoulette = async (rifaId) => {
    setRifaSeleccionadaRuleta(null);
    setNumerosVendidosRifa([]);
    setGanadorRuleta(null);
    setNumeroGanadorRuleta(null);
    setGirandoRuleta(false);

    const rifa = rifas.find(r => r.id === rifaId);
    if (rifa) {
      setRifaSeleccionadaRuleta(rifa);
      // Obtener todos los participantes confirmados para esta rifa
      const { data: participantes, error } = await supabase
        .from('participantes')
        .select('*')
        .eq('rifa_id', rifaId)
        .eq('estado', 'confirmado');

      if (error) {
        console.error('Error fetching participantes for roulette:', error);
        alert('No se pudieron cargar los participantes para la ruleta.');
        return;
      }

      // Crear una lista plana de todos los números vendidos
      const todosLosNumerosVendidos = participantes.flatMap(p => 
        (p.numeros_comprados || []).map(num => ({ numero: num, participante: p }))
      );
      setNumerosVendidosRifa(todosLosNumerosVendidos);
    }
  };

  const handleSpinRoulette = () => {
    if (numerosVendidosRifa.length === 0) {
      alert('No hay números vendidos para sortear en esta rifa.');
      return;
    }

    setGirandoRuleta(true);
    setGanadorRuleta(null);
    setNumeroGanadorRuleta(null);

    // Simular el giro de la ruleta
    const randomIndex = Math.floor(Math.random() * numerosVendidosRifa.length);
    const ganador = numerosVendidosRifa[randomIndex];

    // Simular un tiempo de giro
    setTimeout(() => {
      setNumeroGanadorRuleta(ganador.numero);
      setGanadorRuleta(ganador.participante);
      setGirandoRuleta(false);
    }, 3000); // 3 segundos de "giro"
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 mb-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
        </div>
        <p className="text-purple-200 mb-6">Bienvenido al panel de administración de BrayanRifas. Aquí puedes gestionar todas tus rifas.</p>
        
        <div className="flex flex-wrap gap-4">
          <Link to="/crear-rifa">
            <motion.button 
              className="bg-white text-purple-700 px-5 py-2 rounded-lg font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle size={18} />
              Crear Nueva Rifa
            </motion.button>
          </Link>
          
          <motion.button 
            className="bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMostrarBuscador(!mostrarBuscador)}
          >
            <Search size={18} />
            Buscar Ganador
          </motion.button>

          <motion.button 
            className="bg-yellow-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMostrarSolicitudes(!mostrarSolicitudes)}
          >
            <Bell size={18} />
            Solicitudes Pendientes
            {totalSolicitudesPendientes > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalSolicitudesPendientes}
              </span>
            )}
          </motion.button>

          <motion.button 
            className="bg-green-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMostrarRuleta(!mostrarRuleta)}
          >
            <Award size={18} />
            Ruleta de Ganadores
          </motion.button>

          <motion.button 
            className="bg-blue-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMostrarCompradores(!mostrarCompradores)}
          >
            <Users size={18} />
            Ver Compradores
          </motion.button>
        </div>
      </motion.div>
      
      {mostrarSolicitudes && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Solicitudes Pendientes de Pago</h2>
          
          {loadingSolicitudes ? (
            <div className="text-center py-4 text-gray-600">Cargando solicitudes...</div>
          ) : solicitudesPendientes.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudesPendientes.map((solicitud, index) => (
                <motion.div 
                  key={solicitud.id}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex flex-col md:flex-row justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{solicitud.nombre}</h3>
                      <p className="text-sm text-gray-600">Rifa: {solicitud.rifas.titulo}</p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <p className="text-sm text-gray-600">
                        Fecha: {new Date(solicitud.fecha_compra).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Teléfono: {solicitud.telefono}</p>
                      <p className="text-sm text-gray-600">Email: {solicitud.email || 'No proporcionado'}</p>
                      <p className="text-sm text-gray-600">ID: {solicitud.identificacion || 'No proporcionado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Números solicitados:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {solicitud.numeros_comprados.map(numero => (
                          <span key={numero} className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                            {numero}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-yellow-200">
                    <p className="font-bold text-green-600">
                      Total: Bs {solicitud.rifas.precio_por_numero * solicitud.numeros_comprados.length}
                    </p>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleRechazarSolicitud(solicitud)}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded-lg flex items-center gap-1 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <XCircle size={16} />
                        Rechazar
                      </motion.button>
                      <motion.button
                        onClick={() => handleConfirmarSolicitud(solicitud)}
                        className="bg-green-100 text-green-600 px-3 py-1 rounded-lg flex items-center gap-1 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckCircle size={16} />
                        Confirmar Pago
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      
      {mostrarBuscador && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Buscar Ganador por Número</h2>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="number"
                value={busquedaNumero}
                onChange={(e) => setBusquedaNumero(e.target.value)}
                placeholder="Ingresa el número ganador"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <motion.button
              onClick={handleBuscarGanador}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search size={18} />
              Buscar
            </motion.button>
          </div>
          
          {resultadoBusqueda && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {resultadoBusqueda.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {resultadoBusqueda.error}
                </div>
              ) : (
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-bold text-green-800 mb-2">¡Ganador encontrado!</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Nombre</p>
                        <p className="font-medium">{resultadoBusqueda.participante.nombre}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-medium">{resultadoBusqueda.participante.telefono}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Rifa</p>
                        <p className="font-medium">{resultadoBusqueda.rifa.titulo}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Correo</p>
                        <p className="font-medium">{resultadoBusqueda.participante.email || 'No disponible'}</p>
                      </div>
                    </div>
                    
                    {resultadoBusqueda.participante.identificacion && (
                      <div className="flex items-center gap-3">
                        <IdIcon className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Identificación</p>
                          <p className="font-medium">{resultadoBusqueda.participante.identificacion}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Números comprados</p>
                        <p className="font-medium">{resultadoBusqueda.participante.numeros.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <a 
                      href={generarEnlaceWhatsApp(
                        resultadoBusqueda.participante.telefono,
                        resultadoBusqueda.participante.nombre,
                        resultadoBusqueda.rifa.titulo,
                        resultadoBusqueda.numeroBuscado,
                        rifaSeleccionadaRuleta ? rifaSeleccionadaRuleta.titulo : 'el premio de la rifa' // Usar el premio de la rifa seleccionada
                      )} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <motion.button
                        className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <WhatsApp size={18} />
                        Contactar por WhatsApp
                      </motion.button>
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {mostrarRuleta && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ruleta de Ganadores</h2>
          
          <div className="mb-4">
            <label htmlFor="selectRifa" className="block text-gray-700 font-medium mb-2">Selecciona una Rifa:</label>
            <select
              id="selectRifa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) => handleSelectRifaForRoulette(e.target.value)}
              value={rifaSeleccionadaRuleta ? rifaSeleccionadaRuleta.id : ''}
            >
              <option value="">-- Selecciona una rifa --</option>
              {rifas.map(rifa => (
                <option key={rifa.id} value={rifa.id}>{rifa.titulo}</option>
              ))}
            </select>
          </div>

          {rifaSeleccionadaRuleta && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Rifa Seleccionada: {rifaSeleccionadaRuleta.titulo}</h3>
              <p className="text-gray-600 mb-4">Números vendidos: {numerosVendidosRifa.length}</p>

              <motion.button
                onClick={handleSpinRoulette}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={girandoRuleta || numerosVendidosRifa.length === 0}
              >
                {girandoRuleta ? 'Girando...' : <><Award size={18} /> Girar Ruleta</>}
              </motion.button>

              {girandoRuleta && (
                <motion.div 
                  className="mt-4 text-center text-xl font-bold text-purple-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                >
                  ¡Girando!
                </motion.div>
              )}

              {numeroGanadorRuleta && ganadorRuleta && (
                <motion.div 
                  className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <h3 className="text-2xl font-bold text-green-800 mb-2">¡El ganador es... {ganadorRuleta.nombre}!</h3>
                  <p className="text-xl text-gray-700 mb-4">Con el número: <span className="font-bold text-purple-600">{numeroGanadorRuleta}</span></p>
                  <p className="text-lg text-gray-600 mb-4">Premio: {rifaSeleccionadaRuleta.titulo}</p>
                  
                  <a 
                    href={generarEnlaceWhatsApp(
                      ganadorRuleta.telefono,
                      ganadorRuleta.nombre,
                      rifaSeleccionadaRuleta.titulo,
                      numeroGanadorRuleta,
                      rifaSeleccionadaRuleta.titulo // Usar el título de la rifa como premio
                    )} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <motion.button
                      className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center mx-auto gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <WhatsApp size={18} />
                      Contactar al Ganador por WhatsApp
                    </motion.button>
                  </a>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}
      
      {mostrarCompradores && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Compradores Confirmados</h2>
          
          {loadingCompradores ? (
            <div className="text-center py-4 text-gray-600">Cargando compradores...</div>
          ) : compradores.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No hay compradores confirmados aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {compradores.map((comprador, index) => (
                <motion.div 
                  key={comprador.id}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex flex-col md:flex-row justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{comprador.nombre}</h3>
                      <p className="text-sm text-gray-600">Rifa: {comprador.rifas.titulo}</p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <p className="text-sm text-gray-600">
                        Fecha de Compra: {new Date(comprador.fecha_compra).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Teléfono: {comprador.telefono}</p>
                      <p className="text-sm text-gray-600">Email: {comprador.email || 'No proporcionado'}</p>
                      <p className="text-sm text-gray-600">ID: {comprador.identificacion || 'No proporcionado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Números comprados:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(comprador.numeros_comprados || []).map(numero => (
                          <span key={numero} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {numero}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end items-center mt-3 pt-3 border-t border-blue-200">
                    <a 
                      href={`https://wa.me/${comprador.telefono}?text=${encodeURIComponent(`¡Hola ${comprador.nombre}! Te contactamos de BrayanRifas. ${comprador.numeros_comprados.length === 1 ? 'Tu número para la rifa' : 'Tus números para la rifa'} "${comprador.rifas.titulo}" ${comprador.numeros_comprados.length === 1 ? 'es' : 'son'}: ${comprador.numeros_comprados.join(', ')}. ¡Gracias por tu compra!`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <motion.button
                        className="bg-green-500 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <WhatsApp size={16} />
                        Enviar WhatsApp
                      </motion.button>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total de Rifas" 
          value={totalRifas} 
          icon={<Ticket className="h-6 w-6 text-purple-500" />}
          color="bg-purple-100 text-purple-800"
        />
        
        <StatCard 
          title="Números Vendidos" 
          value={`${numerosVendidos} / ${totalNumeros}`} 
          icon={<Hash className="h-6 w-6 text-blue-500" />}
          color="bg-blue-100 text-blue-800"
        />
        
        <StatCard 
          title="Porcentaje Vendido" 
          value={`${porcentajeVendido.toFixed(1)}%`} 
          icon={<BarChart3 className="h-6 w-6 text-green-500" />}
          color="bg-green-100 text-green-800"
        />
        
        <StatCard 
          title="Total Recaudado" 
          value={`Bs ${totalRecaudado}`} 
          icon={<Money className="h-6 w-6 text-yellow-500" />}
          color="bg-yellow-100 text-yellow-800"
        />
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Tus Rifas</h2>
          <Link to="/crear-rifa">
            <motion.button 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle size={16} />
              Nueva Rifa
            </motion.button>
          </Link>
        </div>
        
        {loadingRifas ? (
          <div className="text-center py-12 text-gray-600">Cargando rifas...</div>
        ) : errorRifas ? (
          <div className="text-center py-12 text-red-500">{errorRifas}</div>
        ) : rifas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No hay rifas creadas</h3>
            <p className="text-gray-600 mb-6">Crea tu primera rifa para comenzar a vender números</p>
            <Link to="/crear-rifa">
              <motion.button 
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Crear Primera Rifa
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rifas.map(rifa => (
              <div key={rifa.id} className="relative group">
                <RifaCard rifa={rifa} />
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2"> {/* Añadido flex y gap */}
                  <Link to={`/editar-rifa/${rifa.id}`}> {/* Botón de Editar */}
                    <motion.button
                      className="bg-blue-500 text-white p-2 rounded-full shadow-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit size={16} />
                    </motion.button>
                  </Link>
                  <motion.button
                    onClick={() => onEliminarRifa(rifa.id)}
                    className="bg-red-500 text-white p-2 rounded-full shadow-md"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleToggleRifaStatus(rifa.id, rifa.estado)}
                    className={`p-2 rounded-full shadow-md ${
                      rifa.estado === 'activa' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {rifa.estado === 'activa' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                  </motion.button>
                </div>
                {(rifa.numeros_pendientes || []).length > 0 && (
                  <div className="absolute top-2 right-2">
                    <motion.div
                      className="bg-yellow-500 text-white p-2 rounded-full shadow-md flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <Bell size={16} />
                    </motion.div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <motion.div 
    className={`rounded-xl shadow-md p-6 ${color}`}
    whileHover={{ y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      {icon}
    </div>
  </motion.div>
);

// Componentes adicionales para los iconos
const Hash = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);

const Money = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
    <circle cx="12" cy="12" r="2"></circle>
    <path d="M6 12h.01M18 12h.01"></path>
  </svg>
);

const Mail = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const WhatsApp = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const IdIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
    <line x1="9" y1="9" x2="15" y2="9"></line>
    <line x1="9" y1="13" x2="15" y2="13"></line>
    <line x1="9" y1="17" x2="15" y2="17"></line>
  </svg>
);

export default AdminPanel;