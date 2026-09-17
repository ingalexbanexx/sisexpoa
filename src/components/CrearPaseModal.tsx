import React, { useState } from 'react';
import {
  X,
  Send,
  Building,
  User,
  AlertCircle,
  ArrowRight,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Expediente } from '../types';
import { useApp } from '../context/AppContext';

interface CrearPaseModalProps {
  expediente: Expediente | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CrearPaseModal: React.FC<CrearPaseModalProps> = ({
  expediente,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    usuarioActual,
    departamentos,
    usuarios,
    crearPase,
    calcularTotalFojas,
    getDepartamento,
  } = useApp();

  const [deptoReceptorId, setDeptoReceptorId] = useState<number>(() => {
    // Default to a different department than current
    const other = departamentos.find((d) => d.id !== usuarioActual.departamentoId);
    return other ? other.id : 200;
  });

  const [usuarioReceptorId, setUsuarioReceptorId] = useState<number>(1);
  const [observacion, setObservacion] = useState('');
  const [fojasPase, setFojasPase] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !expediente) return null;

  // Filtrar usuarios del departamento seleccionado
  const usuariosDestino = usuarios.filter(
    (u) => u.departamentoId === deptoReceptorId && u.isActive
  );

  // Asegurarse de que usuarioReceptorId sea válido para el nuevo depto
  const currentSelectedUserExists = usuariosDestino.some((u) => u.id === usuarioReceptorId);
  if (!currentSelectedUserExists && usuariosDestino.length > 0) {
    setUsuarioReceptorId(usuariosDestino[0].id);
  }

  const fojasActuales = calcularTotalFojas(expediente);
  const fojasFinales = fojasActuales + (Number(fojasPase) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!observacion.trim()) {
      setErrorMsg('Debe consignar el motivo u observación oficial del pase.');
      return;
    }

    if (!usuarioReceptorId) {
      setErrorMsg('Debe seleccionar el agente receptor del pase.');
      return;
    }

    const res = crearPase(expediente.id, {
      deptoReceptorId,
      usuarioReceptorId,
      observacion: observacion.trim(),
      fojasPase: Math.max(0, Number(fojasPase) || 0),
    });

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al confeccionar el pase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#082032] text-white flex items-center justify-between border-b border-[#2C394B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FC4F46] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                Emitir Pase de Expediente
              </h3>
              <p className="text-xs text-slate-300">
                Clave: <span className="font-mono text-white font-bold">{expediente.claveUnica}</span>
              </p>
            </div>
          </div>

          <button
            id="btn-close-crear-pase-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2C394B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Trayecto del Pase */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Emisor Actual
              </span>
              <p className="font-bold text-slate-900 truncate">
                {getDepartamento(usuarioActual.departamentoId)?.nombre}
              </p>
              <p className="text-[11px] text-slate-500">
                {usuarioActual.firstName} {usuarioActual.lastName}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex-1 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Destino Asignado
              </span>
              <p className="font-bold text-blue-700 truncate">
                {getDepartamento(deptoReceptorId)?.nombre}
              </p>
              <p className="text-[11px] text-slate-500">
                {usuarios.find((u) => u.id === usuarioReceptorId)?.firstName || 'Por asignar'}{' '}
                {usuarios.find((u) => u.id === usuarioReceptorId)?.lastName || ''}
              </p>
            </div>
          </div>

          {/* Selectores de Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Departamento Receptor <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-depto-receptor"
                value={deptoReceptorId}
                onChange={(e) => {
                  const newDeptoId = Number(e.target.value);
                  setDeptoReceptorId(newDeptoId);
                  const firstUser = usuarios.find(
                    (u) => u.departamentoId === newDeptoId && u.isActive
                  );
                  if (firstUser) setUsuarioReceptorId(firstUser.id);
                }}
                className="w-full px-3 py-2 bg-white text-xs border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.codigo} - {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Agente Receptor Asignado <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-usuario-receptor"
                value={usuarioReceptorId}
                onChange={(e) => setUsuarioReceptorId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white text-xs border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                {usuariosDestino.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.rolId})
                  </option>
                ))}
                {usuariosDestino.length === 0 && (
                  <option value="">No hay usuarios en este departamento</option>
                )}
              </select>
            </div>
          </div>

          {/* Fojas agregadas y Fojas totales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Fojas Incorporadas en este Pase
              </label>
              <input
                id="input-fojas-pase"
                type="number"
                min={0}
                max={9999}
                value={fojasPase}
                onChange={(e) => setFojasPase(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white text-xs font-mono font-bold border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Agregue las fojas de informes o providencias generadas.
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-blue-800 uppercase block">
                  Cálculo Acumulado de Fojas
                </span>
                <span className="text-xs text-slate-700">
                  Actuales: <strong>{fojasActuales}</strong> + Nuevas: <strong>{fojasPase}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-blue-900 font-mono">
                  {fojasFinales}
                </span>
                <span className="text-[10px] text-blue-700 block">Fojas Totales</span>
              </div>
            </div>
          </div>

          {/* Motivo / Observación de Pase */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Motivo, Providencia u Observación del Pase <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="input-observacion-pase"
              rows={3}
              required
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Indique las instrucciones, requerimientos o informe de pase al área receptora..."
              className="w-full px-3 py-2 bg-white text-xs border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-crear-pase"
              type="submit"
              className="px-5 py-2 bg-[#FC4F46] hover:bg-[#e03e36] text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Emitir Pase Oficial</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
