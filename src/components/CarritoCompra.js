import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, User, Mail, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CarritoCompra = ({ cartItems, onRemoveFromCart, onCheckout }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Revisar carrito, 2: Datos personales
  
  const totalItems = cartItems.reduce((total, item) => total + item.numeros.length, 0);
  const totalPrecio = cartItems.reduce((total, item) => total + (item.precioPorNumero * item.numeros.length), 0);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.telefono) newErrors.telefono = 'El teléfono es obligatorio';
    else if (!/^\d{10}$/.test(formData.telefono)) newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    if (!formData.email) newErrors.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El correo no es válido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleContinuar = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateForm()) {
        handlePagar();
      }
    }
  };
  
  const handlePagar = () => {
    // Crear mensaje para WhatsApp
    const detalleCompra = cartItems.map(item => {
      return `*${item.rifaTitulo}*\nNúmeros: ${item.numeros.join(', ')}\nPrecio: Bs ${item.precioPorNumero * item.numeros.length}`;
    }).join('\n\n');
    
    const mensaje = encodeURIComponent(
      `¡Hola! Quiero comprar los siguientes números:\n\n${detalleCompra}\n\n*Total: Bs ${totalPrecio}*\n\n*Mis datos:*\nNombre: ${formData.nombre}\nTeléfono: ${formData.telefono}\nEmail: ${formData.email}`
    );
    
    // Guardar datos del participante
    onCheckout(formData);
    
    // Redirigir a WhatsApp
    window.open(`https://wa.me/584264491058?text=${mensaje}`, '_blank');
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega números de rifas para continuar</p>
          <Link to="/mis-rifas">
            <motion.button 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver rifas disponibles
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div 
        className="bg-white rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              {step === 1 ? 'Tu Carrito' : 'Datos Personales'}
            </h1>
          </div>
        </div>
        
        {step === 1 ? (
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {cartItems.map((item, index) => (
                <motion.div 
                  key={`${item.rifaId}-${index}`}
                  className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="sm:w-24 h-24 flex-shrink-0">
                    <img 
                      src={item.rifaImagen} 
                      alt={item.rifaTitulo} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.rifaTitulo}</h3>
                    <div className="flex flex-wrap gap-1 my-2">
                      {item.numeros.map(numero => (
                        <span 
                          key={numero} 
                          className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-sm"
                        >
                          {numero}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-green-600 font-bold">
                        Bs {item.precioPorNumero * item.numeros.length}
                      </p>
                      <motion.button
                        onClick={() => onRemoveFromCart(item.rifaId)}
                        className="text-red-500 hover:text-red-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal ({totalItems} números):</span>
                <span className="font-bold">Bs {totalPrecio}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">Bs {totalPrecio}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Link to="/mis-rifas">
                <motion.button 
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={18} />
                  Seguir comprando
                </motion.button>
              </Link>
              
              <motion.button 
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContinuar}
              >
                Continuar
                <CreditCard size={18} />
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ingresa tus datos para completar la compra</h3>
              
              <div className="space-y-4">
                <FormField 
                  label="Nombre completo" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  icon={<User />}
                  error={errors.nombre}
                />
                
                <FormField 
                  label="Teléfono (sin código de país)" 
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 4264491058"
                  icon={<Phone />}
                  error={errors.telefono}
                />
                
                <FormField 
                  label="Correo electrónico" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ej: ejemplo@correo.com"
                  icon={<Mail />}
                  error={errors.email}
                />
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total a pagar:</span>
                <span className="font-bold text-green-600">Bs {totalPrecio}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Al hacer clic en "Pagar ahora", serás redirigido a WhatsApp para completar tu pago.
              </p>
            </div>
            
            <div className="flex justify-between">
              <motion.button 
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={18} />
                Volver
              </motion.button>
              
              <motion.button 
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContinuar}
              >
                Pagar ahora
                <WhatsApp size={18} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const FormField = ({ label, name, value, onChange, placeholder, icon, error }) => (
  <div className="form-group">
    <label className="block text-gray-700 font-medium mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {React.cloneElement(icon, { className: "h-5 w-5 text-gray-400" })}
      </div>
      <input
        type="text"
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

const WhatsApp = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

export default CarritoCompra;