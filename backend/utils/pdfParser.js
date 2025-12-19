// utils/pdfParser.js
const pdf = require('pdf-parse');

/**
 * Extrae datos del PDF de Llantar
 * Formato esperado: MARCA | REF | CODIGO GY | DISEÑO | MEDIDA | VENTA MINIMA PUBLICO
 * Ejemplo: "TOYO TY114020 PXTM1 195/55R15 451,973"
 */
async function extraerDatosPDF(buffer) {
  try {
    const data = await pdf(buffer);
    const texto = data.text;
    const lineas = texto.split('\n');
    
    const llantas = [];
    
    // Expresión regular para capturar líneas con datos
    // Busca: MARCA REFERENCIA DISEÑO MEDIDA PRECIO
    const regex = /^([A-Z\s]+)\s+([A-Z0-9]+)\s+([A-Z0-9\s]+)\s+(\d{3}\/\d{2}[A-Z]\d{2}[A-Z]?)\s+([\d,]+)$/;
    
    for (let linea of lineas) {
      linea = linea.trim();
      
      // Ignorar líneas vacías, headers, y líneas sin precio
      if (!linea || linea.includes('MARCA') || linea.includes('DISEÑO') || linea.includes('MEDIDA')) {
        continue;
      }
      
      // Intenta extraer con regex
      const match = linea.match(regex);
      
      if (match) {
        const marca = match[1].trim();
        const referencia = match[2].trim();
        const diseno = match[3].trim();
        const medida = match[4].trim();
        const precioTexto = match[5].replace(/,/g, '');
        const precio = parseInt(precioTexto);
        
        if (!isNaN(precio)) {
          llantas.push({
            marca,
            referencia,
            diseno,
            medida,
            precio
          });
        }
      } else {
        // Intenta extraer de forma más flexible
        const partes = linea.split(/\s+/);
        
        // Buscar medida (patrón: 195/55R15)
        const medidaIndex = partes.findIndex(p => /^\d{3}\/\d{2}[A-Z]\d{2}/.test(p));
        
        if (medidaIndex !== -1 && partes.length > medidaIndex + 1) {
          const marca = partes[0];
          const referencia = partes[1] || '';
          const medida = partes[medidaIndex];
          const precioTexto = partes[partes.length - 1].replace(/[,$]/g, '');
          const precio = parseInt(precioTexto);
          
          // Diseño es todo lo que está entre referencia y medida
          const diseno = partes.slice(2, medidaIndex).join(' ');
          
          if (!isNaN(precio) && marca && medida) {
            llantas.push({
              marca,
              referencia,
              diseno,
              medida,
              precio
            });
          }
        }
      }
    }
    
    console.log(`✅ PDF procesado: ${llantas.length} llantas encontradas`);
    return llantas;
    
  } catch (error) {
    console.error('❌ Error procesando PDF:', error);
    throw error;
  }
}

module.exports = { extraerDatosPDF };