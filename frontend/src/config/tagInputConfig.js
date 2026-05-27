// Define cómo renderizar el input de valor para cada tag
// input_type: 'text' | 'number' | 'select'
// options: solo para input_type 'select'
// placeholder: sugerencia visual para el usuario

export const TAG_INPUT_CONFIG = {
  // VEHÍCULO
  color_vehiculo: {
    input_type: 'select',
    options: ['Negro', 'Blanco', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Plateado', 'Marrón', 'Naranja']
  },
  modelo_vehiculo: {
    input_type: 'text',
    placeholder: 'Ej: Toyota Corolla, Ford Focus...'
  },
  patente_vehiculo: {
    input_type: 'text',
    placeholder: 'Ej: AB123CD'
  },

  // PERSONA / ACTOR
  pelo_color_actor: {
    input_type: 'select',
    options: ['Negro', 'Castaño', 'Rubio', 'Pelirrojo', 'Canoso', 'Blanco', 'Teñido']
  },
  piel_color_actor: {
    input_type: 'select',
    options: ['Clara', 'Intermedia', 'Morena', 'Oscura']
  },
  edad_actor: {
    input_type: 'number',
    placeholder: 'Ej: 35',
    min: 1,
    max: 100
  },
  altura_actor: {
    input_type: 'number',
    placeholder: 'Ej: 1.75 (en metros)',
    min: 0.5,
    max: 2.5,
    step: 0.01
  },
  genero_actor: {
    input_type: 'select',
    options: ['Masculino', 'Femenino']
  }
}

// Fallback para tags sin config definida (custom tags o nuevos)
export const DEFAULT_TAG_CONFIG = {
  input_type: 'text',
  placeholder: 'Ingresá el valor...'
}