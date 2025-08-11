import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Image, Hash, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const EditarRifaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen: '',
    precio_por_numero: 0,
    total_numeros: 0,
    fecha_sorteo: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorFetching, setErrorFetching] = useState(null);

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
        console.error('Error fetching rifa for edit:', error);
        setErrorFetching('No se pudo cargar la rifa para editar.');
      } else if (data) {
        setFormData({
          titulo: data.titulo,
          descripcion: data.descripcion,
          imagen: data.imagen,
          precio_por_numero: data.precio_por_numero,
          total_numeros: data.total_numeros,
          fecha_sorteo: data.fecha_sorteo // Asume que la fecha viene en formato compatible con input type="date"
        });
      }
    };
    fetchRifa();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'precio_por_numero' || name === 'total_numeros' ? Number(value) : value
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.titulo) newErrors.titulo = 'El título es obligatorio';
    if (!formData.descripcion) newErrors.descripcion = 'La descripción es obligatoria';
    if (!formData.imagen) newErrors.imagen = 'La URL de la imagen es obligatoria';
    if (formData.precio_por_numero <= 0) newErrors.precio_por_numero = 'El precio debe ser mayor a 0';
    if (formData.total_numeros <= 0) newErrors.total_numeros = 'El total de números debe ser mayor a 0';
    if (!formData.fecha_sorteo) newErrors.fecha_sorteo = 'La fecha del sorteo es obligatoria';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitting(true);
      const { error } = await supabase
        .from('rifas')
        .update({
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          imagen: formData.imagen,
          precio_por_numero: formData.precio_por_numero,
          total_numeros: formData.total_numeros,
          fecha_sorteo: formData.fecha_sorteo
        })
        .eq('id', id);
        
      setSubmitting(false);
      
      if (error) {
        console.error('Error al actualizar rifa:', error);
        alert('Hubo un error al actualizar la rifa. Intenta de nuevo.');
      } else {
        alert('Rifa actualizada exitosamente!');
        navigate('/admin'); // Redirigir al panel de administración
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Cargando datos de la rifa...</div>;
  }

  if (errorFetching) {
    return <div className="text-center py-12 text-red-500">{errorFetching}</div>;
  }
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Editar Rifa</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <FormField 
            label="Título de la Rifa" 
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ej: iPhone 15 Pro Max"
            icon={<Ticket />}
            error={errors.titulo}
          />
          
          <div className="form-group">
            <label className="block text-gray-700 font-medium mb-2">
              Descripción
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Info className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe el premio y las condiciones de la rifa"
                className={`w-full pl-10 pr-4 py-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                rows="4"
              />
            </div>
            {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
          </div>
          
          <FormField 
            label="URL de la Imagen" 
            name="imagen"
            value={formData.imagen}
            onChange={handleChange}
            placeholder="https://ejemplo.com/imagen.jpg"
            icon={<Image />}
            error={errors.imagen}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Precio por Número (Bs)" 
              name="precio_por_numero"
              type="number"
              value={formData.precio_por_numero}
              onChange={handleChange}
              placeholder="50"
              icon={<CurrencyIcon />}
              error={errors.precio_por_numero}
            />
            
            <FormField 
              label="Total de Números" 
              name="total_numeros"
              type="number"
              value={formData.total_numeros}
              onChange={handleChange}
              placeholder="100"
              icon={<Hash />}
              error={errors.total_numeros}
            />
          </div>
          
          <FormField 
            label="Fecha del Sorteo" 
            name="fecha_sorteo"
            type="date"
            value={formData.fecha_sorteo}
            onChange={handleChange}
            icon={<Calendar />}
            error={errors.fecha_sorteo}
          />
          
          <div className="flex justify-end pt-4">
            <motion.button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-lg font-medium shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={submitting}
            >
              {submitting ? 'Actualizando...' : 'Actualizar Rifa'}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

const FormField = ({ label, name, value, onChange, placeholder, icon, type = "text", error }) => (
  <div className="form-group">
    <label className="block text-gray-700 font-medium mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {React.cloneElement(icon, { className: "h-5 w-5 text-gray-400" })}
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const CurrencyIcon = () => (
  <div className="flex items-center justify-center w-5 h-5 text-gray-400 font-bold">
    Bs
  </div>
);

export default EditarRifaForm;