import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";

const NominaGenerator = ({ onClose }) => {
  const [datosNomina, setDatosNomina] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef();
  const fileInputRef = useRef();

  const procesarExcel = async (file) => {
    setCargando(true);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const empresa = json[0]?.[1] || "EMPRESA";
      const nit = json[1]?.[1] || "";
      const periodo = json[2]?.[1] || "Período";

      const empleados = [];
      const cedulasProcesadas = new Set();
      
      for (let i = 6; i < json.length; i++) {
        const fila = json[i];
        
        if (fila[1] === "Total") {
          break;
        }
        
        if (
          fila[1] && 
          typeof fila[2] === "number" && 
          fila[3] && 
          typeof fila[4] === "number" &&
          !cedulasProcesadas.has(fila[2])
        ) {
          cedulasProcesadas.add(fila[2]);
          empleados.push({
            nombre: fila[1],
            cedula: fila[2],
            cargo: fila[3],
            sueldoBasico: fila[4] || 0,
            diasTrabajados: fila[5] || 0,
            sueldoDias: fila[6] || 0,
            horasExtra: fila[7] || 0,
            totalSueldoHoras: fila[8] || 0,
            auxTransporte: fila[9] || 0,
            totalDevengado: fila[10] || 0,
            salud: fila[11] || 0,
            pension: fila[12] || 0,
            fondoSolidaridad: fila[13] || 0,
            totalDeducido: fila[14] || 0,
            netoAPagar: fila[15] || 0,
          });
        }
      }

      const filaTotales = json.find(
        (f) => f[1] === "Total" && typeof f[4] === "number"
      );
      const totales = filaTotales
        ? {
            sueldoBasico: filaTotales[4] || 0,
            sueldoDias: filaTotales[6] || 0,
            horasExtra: filaTotales[7] || 0,
            totalSueldoHoras: filaTotales[8] || 0,
            auxTransporte: filaTotales[9] || 0,
            totalDevengado: filaTotales[10] || 0,
            salud: filaTotales[11] || 0,
            pension: filaTotales[12] || 0,
            fondoSolidaridad: filaTotales[13] || 0,
            totalDeducido: filaTotales[14] || 0,
            netoAPagar: filaTotales[15] || 0,
          }
        : null;

      setDatosNomina({
        empresa,
        nit,
        periodo,
        empleados,
        totales,
        fechaGeneracion: new Date().toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      });
    } catch (err) {
      console.error(err);
      setError("Error al procesar el archivo. Verifica que sea un Excel válido.");
    } finally {
      setCargando(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      procesarExcel(file);
    }
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatearMoneda = (valor) => {
    const num = Number(valor) || 0;
    return num.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open("", "", "width=1100,height=750");

    printWindow.document.write(`
      <html>
        <head>
          <title>Nómina - ${datosNomina?.empresa}</title>
          <style>
            @page {
              size: letter landscape;
              margin: 0.4cm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, sans-serif;
              font-size: 8px;
              color: #000;
              background: white;
            }
            .nomina-container {
              width: 100%;
              margin: 0 auto;
              padding: 0.3cm;
            }
            .header {
              text-align: center;
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 2px solid #000;
            }
            .logo-empresa {
              font-size: 18px;
              font-weight: 800;
              color: #000;
              letter-spacing: 2px;
              margin-bottom: 2px;
            }
            .nit {
              font-size: 9px;
              color: #444;
              margin-bottom: 4px;
            }
            .periodo {
              border: 2px solid #000;
              color: #000;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 600;
              display: inline-block;
            }
            .tabla-nomina {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              font-size: 7px;
            }
            .tabla-nomina th {
              background: #f0f0f0;
              color: #000;
              padding: 4px 2px;
              text-align: center;
              font-weight: 700;
              font-size: 6.5px;
              text-transform: uppercase;
              border: 1px solid #000;
            }
            .tabla-nomina td {
              padding: 3px 2px;
              text-align: right;
              border: 1px solid #ccc;
              font-size: 7px;
            }
            .tabla-nomina td:first-child,
            .tabla-nomina td:nth-child(2),
            .tabla-nomina td:nth-child(3) {
              text-align: left;
            }
            .tabla-nomina tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .fila-total {
              background: #e8e8e8 !important;
              font-weight: 700;
            }
            .fila-total td {
              border: 1px solid #000;
              padding: 5px 2px;
              font-weight: 700;
            }
            .resumen-box {
              border: 1px solid #000;
              border-radius: 4px;
              padding: 8px;
              margin-top: 8px;
            }
            .resumen-titulo {
              font-size: 9px;
              font-weight: 700;
              color: #000;
              margin-bottom: 6px;
              border-bottom: 1px solid #000;
              padding-bottom: 3px;
            }
            .resumen-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }
            .resumen-item {
              text-align: center;
              border: 1px solid #ccc;
              padding: 6px;
              border-radius: 4px;
            }
            .resumen-item.destacado {
              border: 2px solid #000;
            }
            .resumen-label {
              font-size: 6px;
              color: #444;
              text-transform: uppercase;
            }
            .resumen-valor {
              font-size: 10px;
              font-weight: 700;
              color: #000;
            }
            .firmas-container {
              margin-top: 20px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .firma-box {
              text-align: center;
              padding-top: 6px;
              border-top: 1px solid #000;
            }
            .firma-label {
              font-size: 7px;
              color: #444;
              font-weight: 500;
            }
            .fecha-generacion {
              text-align: right;
              font-size: 6px;
              color: #666;
              margin-top: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <h2 className="text-xl font-bold">Generador de Nómina</h2>
                <p className="text-gray-300 text-sm">
                  Convierte tu Excel en un diseño profesional para imprimir (Horizontal)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-gray-600 rounded-full p-2 text-2xl leading-none w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(95vh - 120px)" }}>
          {!datosNomina ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                  📤
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    Haz clic para subir tu archivo Excel de Nómina
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos soportados: .xlsx, .xls
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={handleSelectFile}
                  className="mt-4 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all font-semibold text-lg cursor-pointer"
                >
                  📂 Seleccionar Archivo
                </button>
              </div>

              {cargando && (
                <div className="mt-6">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <p className="text-gray-600 mt-2">Procesando archivo...</p>
                </div>
              )}

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Botones de acción */}
              <div className="flex gap-3 mb-4 justify-end">
                <button
                  type="button"
                  onClick={() => setDatosNomina(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  📤 Cargar otro archivo
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
                >
                  🖨️ Imprimir Nómina
                </button>
              </div>

              {/* Vista previa imprimible - HORIZONTAL */}
              <div
                ref={printRef}
                className="bg-white border border-gray-300 rounded-lg shadow-lg p-4"
                style={{ minHeight: "500px" }}
              >
                <div className="nomina-container">
                  {/* Header */}
                  <div className="header text-center mb-3 pb-2 border-b-2 border-black">
                    <div className="logo-empresa text-xl font-extrabold text-black tracking-wide">
                      {datosNomina.empresa}
                    </div>
                    <div className="nit text-gray-600 text-sm mb-1">
                      {datosNomina.nit}
                    </div>
                    <div className="periodo inline-block border-2 border-black text-black px-4 py-1 rounded text-xs font-semibold">
                      {datosNomina.periodo}
                    </div>
                  </div>

                  {/* Tabla de empleados - CON FONDO SOLIDARIDAD */}
                  <div className="overflow-x-auto">
                    <table className="tabla-nomina w-full text-xs border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-1 text-left font-bold border border-gray-400 text-[10px]">Empleado</th>
                          <th className="p-1 text-left font-bold border border-gray-400 text-[10px]">Cédula</th>
                          <th className="p-1 text-left font-bold border border-gray-400 text-[10px]">Cargo</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Días</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Sueldo</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">H. Extra</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Aux. Tpte</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Devengado</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Salud 4%</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Pensión 4%</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Fdo. Solidaridad</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Deducido</th>
                          <th className="p-1 text-right font-bold border border-gray-400 text-[10px]">Neto a Pagar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosNomina.empleados.map((emp, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="p-1 font-semibold text-left border border-gray-300 text-[10px]">
                              {emp.nombre}
                            </td>
                            <td className="p-1 text-left border border-gray-300 text-[10px]">{emp.cedula}</td>
                            <td className="p-1 text-left border border-gray-300 text-[9px]">{emp.cargo}</td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">{emp.diasTrabajados}</td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.sueldoDias)}
                            </td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.horasExtra)}
                            </td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.auxTransporte)}
                            </td>
                            <td className="p-1 text-right font-semibold border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.totalDevengado)}
                            </td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.salud)}
                            </td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.pension)}
                            </td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.fondoSolidaridad)}
                            </td>
                            <td className="p-1 text-right border border-gray-300 text-[10px]">
                              {formatearMoneda(emp.totalDeducido)}
                            </td>
                            <td className="p-1 text-right font-bold border border-gray-300 text-[11px]">
                              {formatearMoneda(emp.netoAPagar)}
                            </td>
                          </tr>
                        ))}
                        {/* Fila de totales */}
                        {datosNomina.totales && (
                          <tr className="bg-gray-200 font-bold">
                            <td className="p-2 font-bold text-left border border-gray-400 text-[10px]" colSpan="3">
                              TOTALES
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">—</td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.sueldoDias)}
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.horasExtra)}
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.auxTransporte)}
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.totalDevengado)}
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.salud)}
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.pension)}
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.fondoSolidaridad)}
                            </td>
                            <td className="p-2 text-right border border-gray-400 text-[10px]">
                              {formatearMoneda(datosNomina.totales.totalDeducido)}
                            </td>
                            <td className="p-2 text-right text-sm font-bold border-2 border-black">
                              {formatearMoneda(datosNomina.totales.netoAPagar)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumen */}
                  <div className="resumen-box mt-4 border border-gray-400 rounded-lg p-3">
                    <h3 className="resumen-titulo text-xs font-bold mb-2 border-b border-gray-400 pb-1">
                      📊 RESUMEN DE NÓMINA
                    </h3>
                    <div className="resumen-grid grid grid-cols-4 gap-3">
                      <div className="resumen-item text-center border border-gray-300 p-2 rounded">
                        <div className="resumen-label text-[9px] text-gray-500 uppercase">Empleados</div>
                        <div className="resumen-valor text-lg font-bold">
                          {datosNomina.empleados.length}
                        </div>
                      </div>
                      <div className="resumen-item text-center border border-gray-300 p-2 rounded">
                        <div className="resumen-label text-[9px] text-gray-500 uppercase">Total Devengado</div>
                        <div className="resumen-valor text-sm font-bold">
                          {formatearMoneda(datosNomina.totales?.totalDevengado)}
                        </div>
                      </div>
                      <div className="resumen-item text-center border border-gray-300 p-2 rounded">
                        <div className="resumen-label text-[9px] text-gray-500 uppercase">Total Deducido</div>
                        <div className="resumen-valor text-sm font-bold">
                          {formatearMoneda(datosNomina.totales?.totalDeducido)}
                        </div>
                      </div>
                      <div className="resumen-item destacado text-center border-2 border-black p-2 rounded bg-gray-100">
                        <div className="resumen-label text-[9px] uppercase font-semibold">
                          Total Neto a Pagar
                        </div>
                        <div className="resumen-valor text-lg font-bold">
                          {formatearMoneda(datosNomina.totales?.netoAPagar)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Firmas */}
                  <div className="firmas-container mt-6 grid grid-cols-3 gap-6">
                    <div className="firma-box text-center">
                      <div className="border-t border-black pt-2 mt-8">
                        <p className="firma-label text-[10px] text-gray-600 font-medium">
                          Elaborado por
                        </p>
                      </div>
                    </div>
                    <div className="firma-box text-center">
                      <div className="border-t border-black pt-2 mt-8">
                        <p className="firma-label text-[10px] text-gray-600 font-medium">
                          Revisado por
                        </p>
                      </div>
                    </div>
                    <div className="firma-box text-center">
                      <div className="border-t border-black pt-2 mt-8">
                        <p className="firma-label text-[10px] text-gray-600 font-medium">
                          Aprobado por
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fecha de generación */}
                  <div className="fecha-generacion text-right text-[9px] text-gray-500 mt-4">
                    Generado el {datosNomina.fechaGeneracion}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NominaGenerator;