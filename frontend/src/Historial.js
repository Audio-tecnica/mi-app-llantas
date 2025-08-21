// src/Historial.js
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ⚡ Configura tu Supabase aquí
const supabaseUrl = "https://TU_PROYECTO.supabase.co"; 
const supabaseKey = "TU_API_KEY"; 
const supabase = createClient(supabaseUrl, supabaseKey);

function Historial() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar historial desde la tabla "historial"
  useEffect(() => {
    const fetchHistorial = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("historial")
        .select("*")
        .order("fecha", { ascending: false }); // ordenado más reciente primero

      if (error) {
        console.error("Error al obtener historial:", error);
      } else {
        setHistorial(data || []);
      }
      setLoading(false);
    };

    fetchHistorial();
  }, []);

  if (loading) return <p>Cargando historial...</p>;

  return (
    <div className="overflow-x-auto">
      {historial.length === 0 ? (
        <p className="text-gray-600">No hay registros en el historial.</p>
      ) : (
        <table className="w-full border border-gray-300 rounded-lg text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Acción</th>
              <th className="border px-2 py-1">Referencia</th>
              <th className="border px-2 py-1">Usuario</th>
              <th className="border px-2 py-1">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((item) => (
              <tr key={item.id}>
                <td className="border px-2 py-1">{item.id}</td>
                <td className="border px-2 py-1">{item.accion}</td>
                <td className="border px-2 py-1">{item.referencia}</td>
                <td className="border px-2 py-1">{item.usuario}</td>
                <td className="border px-2 py-1">
                  {new Date(item.fecha).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Historial;


