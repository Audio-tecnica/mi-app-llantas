import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { X, Upload, Printer, FileSpreadsheet } from "lucide-react";

const NominaGenerator = ({ onClose }) => {
  const [datosNomina, setDatosNomina] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef();

  const procesarExcel = async (file) => {
    setCargando(true);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Extraer información del encabezado
      const empresa = json[0]?.[1] || "EMPRESA";
      const nit = json[1]?.[1] || "";
      const periodo = json[2]?.[1] || "Período";

      // Extraer empleados (filas 6 en adelante)
      const empleados = [];
      for (let i = 6; i < json.length; i++) {
        const fila = json[i];
        // Verificar que sea una fila de empleado (tiene nombre y cédula numérica)
        if (fila[1] && fila[2] && fila[1] !== "Total" && !String(fila[1]).includes("Valor hora")) {
          if (typeof fila[2] === "number" && fila[3]) {
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
      }

      // Extraer totales
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
    const printWindow = window.open("", "", "width=900,height=650");

    printWindow.document.write(`
      <html>
        <head>
          <title>Nómina - ${datosNomina?.empresa}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.5cm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, sans-serif;
              font-size: 9px;
              color: #1e293b;
              background: white;
            }
            .nomina-container {
              width: 100%;
              max-width: 21cm;
              margin: 0 auto;
              padding: 0.5cm;
            }
            .header {
              text-align: center;
              margin-bottom: 12px;
              padding-bottom: 10px;
              border-bottom: 3px solid #1e40af;
            }
            .logo-empresa {
              font-size: 22px;
              font-weight: 800;
              color: #1e40af;
              letter-spacing: 2px;
              margin-bottom: 2px;
            }
            .nit {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 6px;
            }
            .periodo {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 9px;
              font-weight: 600;
              display: inline-block;
            }
            .tabla-nomina {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 7.5px;
            }
            .tabla-nomina th {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 6px 3px;
              text-align: center;
              font-weight: 600;
              font-size: 7px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .tabla-nomina td {
              padding: 5px 3px;
              text-align: right;
              border-bottom: 1px solid #e2e8f0;
            }
            .tabla-nomina td:first-child,
            .tabla-nomina td:nth-child(2),
            .tabla-nomina td:nth-child(3) {
              text-align: left;
            }
            .tabla-nomina tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .nombre-empleado {
              font-weight: 600;
              color: #1e293b;
              font-size: 8px;
            }
            .fila-total {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
              color: white !important;
              font-weight: 700;
            }
            .fila-total td {
              color: white !important;
              border-bottom: none;
              padding: 8px 3px;
            }
            .resumen-box {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 10px;
              margin-top: 12px;
            }
            .resumen-titulo {
              font-size: 10px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 8px;
              border-bottom: 2px solid #1e40af;
              padding-bottom: 4px;
            }
            .resumen-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
            }
            .resumen-item {
              text-align: center;
              background: white;
              padding: 8px;
              border-radius: 6px;
            }
            .resumen-label {
              font-size: 7px;
              color: #64748b;
              text-transform: uppercase;
            }
            .resumen-valor {
              font-size: 11px;
              font-weight: 700;
              color: #1e40af;
            }
            .resumen-valor.verde {
              color: #059669;
            }
            .resumen-valor.rojo {
              color: #dc2626;
            }
            .firmas-container {
              margin-top: 30px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 30px;
            }
            .firma-box {
              text-align: center;
              padding-top: 8px;
              border-top: 2px solid #1e293b;
            }
            .firma-label {
              font-size: 8px;
              color: #64748b;
              font-weight: 500;
            }
            .fecha-generacion {
              text-align: right;
              font-size: 7px;
              color: #94a3b8;
              margin-top: 15px;
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
        className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={28} />
              <div>
                <h2 className="text-xl font-bold">Generador de Nómina</h2>
                <p className="text-blue-200 text-sm">
                  Convierte tu Excel en un diseño profesional para imprimir
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 rounded-full p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(95vh - 120px)" }}>
          {!datosNomina ? (
            /* Zona de carga */
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center bg-blue-50">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="nomina-upload"
              />
              <label
                htmlFor="nomina-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload size={40} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    Arrastra o haz clic para subir tu archivo Excel
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos soportados: .xlsx, .xls
                  </p>
                </div>
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all font-semibold">
                  Seleccionar Archivo
                </button>
              </label>

              {cargando && (
                <div className="mt-6">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            /* Vista previa de la nómina */
            <div>
              {/* Botones de acción */}
              <div className="flex gap-3 mb-4 justify-end">
                <button
                  onClick={() => setDatosNomina(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  <Upload size={18} />
                  Cargar otro archivo
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                >
                  <Printer size={18} />
                  Imprimir Nómina
                </button>
              </div>

              {/* Vista previa imprimible */}
              <div
                ref={printRef}
                className="bg-white border border-gray-200 rounded-lg shadow-lg p-6"
                style={{ minHeight: "600px" }}
              >
                <div className="nomina-container">
                  {/* Header */}
                  <div className="header text-center mb-4 pb-3 border-b-4 border-blue-800">
                    <div className="logo-empresa text-2xl font-extrabold text-blue-800 tracking-wide">
                      {datosNomina.empresa}
                    </div>
                    <div className="nit text-gray-500 text-sm mb-2">
                      {datosNomina.nit}
                    </div>
                    <div className="periodo inline-block bg-gradient-to-r from-blue-800 to-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold">
                      {datosNomina.periodo}
                    </div>
                  </div>

                  {/* Tabla de empleados */}
                  <div className="overflow-x-auto">
                    <table className="tabla-nomina w-full text-xs border-collapse">
                      <thead>
                        <tr style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }}>
                          <th className="p-2 text-left text-white font-semibold">Empleado</th>
                          <th className="p-2 text-left text-white font-semibold">Cédula</th>
                          <th className="p-2 text-left text-white font-semibold">Cargo</th>
                          <th className="p-2 text-right text-white font-semibold">Días</th>
                          <th className="p-2 text-right text-white font-semibold">Sueldo</th>
                          <th className="p-2 text-right text-white font-semibold">H. Extra</th>
                          <th className="p-2 text-right text-white font-semibold">Aux. Tpte</th>
                          <th className="p-2 text-right text-white font-semibold">Devengado</th>
                          <th className="p-2 text-right text-white font-semibold">Salud</th>
                          <th className="p-2 text-right text-white font-semibold">Pensión</th>
                          <th className="p-2 text-right text-white font-semibold">Deducido</th>
                          <th className="p-2 text-right font-semibold" style={{ color: "#86efac" }}>
                            Neto a Pagar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosNomina.empleados.map((emp, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="p-2 font-semibold text-slate-800 text-left">
                              {emp.nombre}
                            </td>
                            <td className="p-2 text-gray-600 text-left">{emp.cedula}</td>
                            <td className="p-2 text-gray-600 text-xs text-left">{emp.cargo}</td>
                            <td className="p-2 text-right">{emp.diasTrabajados}</td>
                            <td className="p-2 text-right">
                              {formatearMoneda(emp.sueldoDias)}
                            </td>
                            <td className="p-2 text-right text-blue-600">
                              {formatearMoneda(emp.horasExtra)}
                            </td>
                            <td className="p-2 text-right">
                              {formatearMoneda(emp.auxTransporte)}
                            </td>
                            <td className="p-2 text-right font-semibold">
                              {formatearMoneda(emp.totalDevengado)}
                            </td>
                            <td className="p-2 text-right text-red-500">
                              {formatearMoneda(emp.salud)}
                            </td>
                            <td className="p-2 text-right text-red-500">
                              {formatearMoneda(emp.pension)}
                            </td>
                            <td className="p-2 text-right text-red-600 font-semibold">
                              {formatearMoneda(emp.totalDeducido)}
                            </td>
                            <td className="p-2 text-right font-bold text-green-600 text-sm">
                              {formatearMoneda(emp.netoAPagar)}
                            </td>
                          </tr>
                        ))}
                        {/* Fila de totales */}
                        {datosNomina.totales && (
                          <tr className="fila-total" style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}>
                            <td className="p-3 text-white font-bold text-left" colSpan="3">
                              TOTALES
                            </td>
                            <td className="p-3 text-right text-white">—</td>
                            <td className="p-3 text-right text-white">
                              {formatearMoneda(datosNomina.totales.sueldoDias)}
                            </td>
                            <td className="p-3 text-right text-white">
                              {formatearMoneda(datosNomina.totales.horasExtra)}
                            </td>
                            <td className="p-3 text-right text-white">
                              {formatearMoneda(datosNomina.totales.auxTransporte)}
                            </td>
                            <td className="p-3 text-right text-white">
                              {formatearMoneda(datosNomina.totales.totalDevengado)}
                            </td>
                            <td className="p-3 text-right text-white">
                              {formatearMoneda(datosNomina.totales.salud)}
                            </td>
                            <td className="p-3 text-right text-white">
                              {formatearMoneda(datosNomina.totales.pension)}
                            </td>
                            <td className="p-3 text-right text-white">
                              {formatearMoneda(datosNomina.totales.totalDeducido)}
                            </td>
                            <td className="p-3 text-right text-white text-lg font-bold">
                              {formatearMoneda(datosNomina.totales.netoAPagar)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumen */}
                  <div className="resumen-box mt-6 bg-gray-100 rounded-lg p-4">
                    <h3 className="resumen-titulo text-sm font-bold text-slate-800 mb-3 border-b-2 border-blue-800 pb-2">
                      📊 RESUMEN DE NÓMINA
                    </h3>
                    <div className="resumen-grid grid grid-cols-4 gap-4">
                      <div className="resumen-item text-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="resumen-label text-xs text-gray-500 uppercase">Empleados</div>
                        <div className="resumen-valor text-xl font-bold text-blue-800">
                          {datosNomina.empleados.length}
                        </div>
                      </div>
                      <div className="resumen-item text-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="resumen-label text-xs text-gray-500 uppercase">Total Devengado</div>
                        <div className="resumen-valor text-lg font-bold text-slate-800">
                          {formatearMoneda(datosNomina.totales?.totalDevengado)}
                        </div>
                      </div>
                      <div className="resumen-item text-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="resumen-label text-xs text-gray-500 uppercase">Total Deducido</div>
                        <div className="resumen-valor rojo text-lg font-bold text-red-600">
                          {formatearMoneda(datosNomina.totales?.totalDeducido)}
                        </div>
                      </div>
                      <div className="resumen-item text-center bg-green-50 p-3 rounded-lg shadow-sm border-2 border-green-200">
                        <div className="resumen-label text-xs text-green-700 uppercase font-semibold">
                          Total Neto a Pagar
                        </div>
                        <div className="resumen-valor verde text-xl font-bold text-green-600">
                          {formatearMoneda(datosNomina.totales?.netoAPagar)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Firmas */}
                  <div className="firmas-container mt-8 grid grid-cols-3 gap-8">
                    <div className="firma-box text-center">
                      <div className="border-t-2 border-slate-800 pt-2 mt-12">
                        <p className="firma-label text-xs text-gray-600 font-medium">
                          Elaborado por
                        </p>
                      </div>
                    </div>
                    <div className="firma-box text-center">
                      <div className="border-t-2 border-slate-800 pt-2 mt-12">
                        <p className="firma-label text-xs text-gray-600 font-medium">
                          Revisado por
                        </p>
                      </div>
                    </div>
                    <div className="firma-box text-center">
                      <div className="border-t-2 border-slate-800 pt-2 mt-12">
                        <p className="firma-label text-xs text-gray-600 font-medium">
                          Aprobado por
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fecha de generación */}
                  <div className="fecha-generacion text-right text-xs text-gray-400 mt-6">
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