import React, { useState } from 'react';
import {
  X,
  FileText,
  Calendar,
  Building,
  User,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  Paperclip,
  Printer,
  Copy,
  Check,
  Send,
  Download,
  Eye,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Expediente, TipoAdjunto } from '../types';
import { useApp } from '../context/AppContext';

interface DetalleExpedienteModalProps {
  expediente: Expediente | null;
  onClose: () => void;
  onOpenCrearPase: (exp: Expediente) => void;
  onOpenRecepcionarPase: (paseId: number) => void;
  onOpenArchivar: (exp: Expediente) => void;
  onOpenPrintCaratula: (exp: Expediente) => void;
}

export const DetalleExpedienteModal: React.FC<DetalleExpedienteModalProps> = ({
  expediente,
  onClose,
  onOpenCrearPase,
  onOpenRecepcionarPase,
  onOpenArchivar,
  onOpenPrintCaratula,
}) => {
  const {
    usuarioActual,
    getDepartamento,
    getUsuario,
    calcularTotalFojas,
    desarchivarExpediente,
    agregarAdjunto,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'hoja_ruta' | 'adjuntos' | 'caratula'>('hoja_ruta');
  const [showAddAdjunto, setShowAddAdjunto] = useState(false);
  const [adjuntoTipo, setAdjuntoTipo] = useState<TipoAdjunto>('documento');
  const [adjuntoTitulo, setAdjuntoTitulo] = useState('');
  const [adjuntoDesc, setAdjuntoDesc] = useState('');
  const [desarchivarMotivo, setDesarchivarMotivo] = useState('');
  const [showDesarchivarInput, setShowDesarchivarInput] = useState(false);

  if (!expediente) return null;

  const deptoInicio = getDepartamento(expediente.departamentoInicioId);
  const usuarioInicio = getUsuario(expediente.usuarioInicioId);
  const deptoActual = getDepartamento(expediente.departamentoActualId);
  const usuarioActualTitular = getUsuario(expediente.usuarioActualId);
  const totalFojas = calcularTotalFojas(expediente);

  // Determinar si el usuario logueado posee el expediente para pasear o archivar
  const ultimoPase = expediente.pases?.find((p) => p.esUltimoPase);
  const esPoseedor = ultimoPase
    ? ultimoPase.usuarioReceptorId === usuarioActual.id && ultimoPase.estadoPase === 'recepcionado'
    : expediente.usuarioInicioId === usuarioActual.id && expediente.estado === 'iniciado';

  const tienePasePendienteParaMi = ultimoPase &&
    ultimoPase.usuarioReceptorId === usuarioActual.id &&
    ultimoPase.estadoPase === 'pendiente';

  const puedeDesarchivar =
    expediente.estado === 'archivado' &&
    (usuarioActual.rolId === 'admin' || usuarioActual.rolId === 'superadmin');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(expediente.claveUnica);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAdjunto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjuntoTitulo.trim()) return;

    agregarAdjunto(expediente.id, {
      tipoAdjunto: adjuntoTipo,
      titulo: adjuntoTitulo.trim(),
      descripcion: adjuntoDesc.trim(),
      archivoNombre: `${adjuntoTitulo.replace(/\s+/g, '_')}.pdf`,
      archivoTamano: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
    });

    setAdjuntoTitulo('');
    setAdjuntoDesc('');
    setShowAddAdjunto(false);
  };

  const handleDesarchivar = () => {
    if (!desarchivarMotivo.trim()) return;
    desarchivarExpediente(expediente.id, desarchivarMotivo);
    setShowDesarchivarInput(false);
    setDesarchivarMotivo('');
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '-';
    const date = new Date(isoStr);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#082032] text-white flex items-center justify-between border-b border-[#2C394B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FC4F46] flex items-center justify-center text-white shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-tight text-white">
                  {expediente.claveUnica}
                </span>
                <button
                  id="btn-copy-clave"
                  onClick={copyToClipboard}
                  className="p-1 rounded hover:bg-[#2C394B] text-slate-400 hover:text-slate-200 transition-colors"
                  title="Copiar Clave Única"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span
                  className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    expediente.estado === 'archivado'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                      : expediente.estado === 'pase'
                      ? 'bg-[#2C394B] text-[#FC4F46] border-[#FC4F46]'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {expediente.estado === 'archivado'
                    ? 'Archivado'
                    : expediente.estado === 'pase'
                    ? 'En Pase'
                    : 'Iniciado'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Repartición 2100 • Año {expediente.anio} • N° Correlativo: {expediente.numeroExpediente}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-caratula"
              onClick={() => onOpenPrintCaratula(expediente)}
              className="px-3 py-1.5 bg-[#2C394B] hover:bg-[#082032] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-[#2C394B]"
            >
              <Printer className="w-3.5 h-3.5 text-[#FC4F46]" />
              <span>Carátula Oficial</span>
            </button>
            <button
              id="btn-close-detalle-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2C394B] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de Estado Archivado (si corresponde) */}
        {expediente.estado === 'archivado' && expediente.archivado && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <p className="font-bold">
                  Expediente Archivado en Caja Física:{' '}
                  <span className="font-mono text-amber-950 underline">
                    {expediente.archivado.nroCaja}
                  </span>
                </p>
                <p className="text-amber-800 text-[11px]">
                  Archivado el {formatDate(expediente.archivado.fechaArchivado)} por{' '}
                  {getUsuario(expediente.archivado.usuarioArchivoId)?.firstName || 'Archivo Central'} con{' '}
                  {expediente.archivado.fojasArchivado} fojas foliadas. Motivo: &quot;{expediente.archivado.observacion}&quot;
                </p>
              </div>
            </div>

            {puedeDesarchivar && (
              <div>
                {!showDesarchivarInput ? (
                  <button
                    onClick={() => setShowDesarchivarInput(true)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Desarchivar / Reanudar Trámite
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Motivo de reactivación..."
                      value={desarchivarMotivo}
                      onChange={(e) => setDesarchivarMotivo(e.target.value)}
                      className="px-2 py-1 bg-white border border-amber-300 text-xs rounded text-slate-800 outline-none w-48"
                    />
                    <button
                      onClick={handleDesarchivar}
                      className="px-2 py-1 bg-amber-700 text-white rounded font-bold text-xs"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowDesarchivarInput(false)}
                      className="text-amber-800 hover:text-amber-950 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resumen Superior / Datos Generales */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-200">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Asunto Oficial
              </span>
              <p className="text-sm font-medium text-slate-900 mt-0.5 leading-relaxed">
                {expediente.asunto}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  Trámite de Inicio
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block mt-0.5" title={expediente.tramiteInicio}>
                  {expediente.tramiteInicio}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  Iniciado Por
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                  {usuarioInicio ? `${usuarioInicio.firstName} ${usuarioInicio.lastName}` : '-'}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">
                  {deptoInicio?.codigo} • {formatDate(expediente.fechaInicio).split(' ')[0]}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  Ubicación Actual
                </span>
                <span className="text-xs font-bold text-blue-700 truncate block mt-0.5">
                  {deptoActual?.nombre || 'En tránsito'}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">
                  {usuarioActualTitular ? `${usuarioActualTitular.firstName} ${usuarioActualTitular.lastName}` : 'Sin receptor'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    Fojas Totales
                  </span>
                  <span className="text-base font-extrabold text-slate-900 block mt-0.5 font-mono">
                    {totalFojas}
                  </span>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-mono">
                  <span>Inicial: {expediente.fojasInicio}</span>
                  <br />
                  <span>Pases: +{totalFojas - expediente.fojasInicio}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de Detalle */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('hoja_ruta')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'hoja_ruta'
                  ? 'border-[#FC4F46] text-[#082032]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#FC4F46]" />
              <span>Hoja de Ruta y Pases ({expediente.pases?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('adjuntos')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'adjuntos'
                  ? 'border-[#FC4F46] text-[#082032]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Documentos Adjuntos ({expediente.adjuntos?.length || 0})</span>
            </button>
          </div>

          {/* Acciones de Flujo de Trabajo (Pase / Recepción / Archivo) */}
          <div className="flex items-center gap-2 py-2">
            {tienePasePendienteParaMi && (
              <button
                id="btn-modal-recepcionar-pase"
                onClick={() => ultimoPase && onOpenRecepcionarPase(ultimoPase.id)}
                className="px-3 py-1.5 bg-[#FC4F46] hover:bg-[#e03e36] text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Recepcionar Pase</span>
              </button>
            )}

            {esPoseedor && expediente.estado !== 'archivado' && (
              <>
                <button
                  id="btn-modal-crear-pase"
                  onClick={() => onOpenCrearPase(expediente)}
                  className="px-3 py-1.5 bg-[#082032] hover:bg-[#2C394B] text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#FC4F46]" />
                  <span>Enviar Pase</span>
                </button>

                <button
                  id="btn-modal-archivar"
                  onClick={() => onOpenArchivar(expediente)}
                  className="px-3 py-1.5 bg-[#2C394B] hover:bg-[#082032] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archivar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {activeTab === 'hoja_ruta' && (
            <div className="space-y-6">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Evento 0: Inicio del Expediente */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    0
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Iniciado en {deptoInicio?.nombre}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatDate(expediente.fechaInicio)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      Iniciado por{' '}
                      <strong>
                        {usuarioInicio?.firstName} {usuarioInicio?.lastName}
                      </strong>{' '}
                      con <strong>{expediente.fojasInicio} fojas</strong> bajo el trámite:{' '}
                      <em>{expediente.tramiteInicio}</em>.
                    </p>
                  </div>
                </div>

                {/* Lista cronológica de Pases */}
                {(expediente.pases || []).map((pase, idx) => {
                  const emisor = getUsuario(pase.usuarioEmisorId);
                  const dptoEmisor = getDepartamento(pase.departamentoEmisorId);
                  const receptor = getUsuario(pase.usuarioReceptorId);
                  const dptoReceptor = getDepartamento(pase.departamentoReceptorId);

                  return (
                    <div key={pase.id} className="relative">
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                          pase.estadoPase === 'pendiente'
                            ? 'bg-amber-500 text-white animate-bounce'
                            : pase.estadoPase === 'rechazado'
                            ? 'bg-rose-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div
                        className={`border p-4 rounded-xl transition-all ${
                          pase.estadoPase === 'pendiente'
                            ? 'bg-amber-50/50 border-amber-200'
                            : pase.estadoPase === 'rechazado'
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {dptoEmisor?.codigo} ({dptoEmisor?.nombre})
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-blue-700">
                              {dptoReceptor?.codigo} ({dptoReceptor?.nombre})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                pase.estadoPase === 'pendiente'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : pase.estadoPase === 'rechazado'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}
                            >
                              {pase.estadoPase === 'pendiente'
                                ? 'Pendiente Recepción'
                                : pase.estadoPase === 'rechazado'
                                ? 'Rechazado'
                                : 'Recepcionado'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {formatDate(pase.fechaPase)}
                            </span>
                          </div>
                        </div>

                        {/* Detalle del pase */}
                        <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                          <p>
                            <strong>Emisor:</strong> {emisor?.firstName} {emisor?.lastName} •{' '}
                            <strong>Destinatario asignado:</strong> {receptor?.firstName}{' '}
                            {receptor?.lastName}
                          </p>
                          <p className="bg-white p-2.5 rounded border border-slate-200/80 text-slate-800 italic">
                            &quot;{pase.observacion}&quot;
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                            <span>Fojas incorporadas en este pase: +{pase.fojasPase} fojas</span>
                            {pase.estadoPase === 'recepcionado' && (
                              <span className="text-blue-700 flex items-center gap-1 font-sans">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                Recepcionado el {formatDate(pase.fechaRecepcion)}
                              </span>
                            )}
                          </div>

                          {pase.observacionRecepcion && (
                            <p className="text-[11px] text-slate-600 bg-slate-100/80 p-2 rounded mt-1">
                              <strong>Nota de recepción:</strong> {pase.observacionRecepcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'adjuntos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Documentos y Actuaciones Digitales
                  </h4>
                  <p className="text-xs text-slate-500">
                    Dictámenes, notas, resoluciones y pliegos adjuntos al cuerpo del expediente.
                  </p>
                </div>
                <button
                  id="btn-open-add-adjunto"
                  onClick={() => setShowAddAdjunto(!showAddAdjunto)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incorporar Documento</span>
                </button>
              </div>

              {/* Formulario para agregar nuevo adjunto */}
              {showAddAdjunto && (
                <form
                  onSubmit={handleCreateAdjunto}
                  className="bg-slate-50 border border-blue-200 p-4 rounded-xl space-y-3 animate-in fade-in duration-150"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Tipo de Actuación
                      </label>
                      <select
                        value={adjuntoTipo}
                        onChange={(e) => setAdjuntoTipo(e.target.value as TipoAdjunto)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="documento">Documento General</option>
                        <option value="nota">Nota Administrativa</option>
                        <option value="memo">Memorándum Interno</option>
                        <option value="resolucion">Resolución Ministerial / Dictamen</option>
                        <option value="imagen">Imagen / Peritaje</option>
                        <option value="otro">Otro Anexo</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Título o Denominación del Documento
                      </label>
                      <input
                        type="text"
                        required
                        value={adjuntoTitulo}
                        onChange={(e) => setAdjuntoTitulo(e.target.value)}
                        placeholder="Ej: Dictamen_Juridico_45_2026.pdf"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Descripción o Resumen del Contenido
                    </label>
                    <textarea
                      rows={2}
                      value={adjuntoDesc}
                      onChange={(e) => setAdjuntoDesc(e.target.value)}
                      placeholder="Breve reseña de la providencia o dictamen..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAdjunto(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800"
                    >
                      Confirmar Incorporación
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de adjuntos */}
              {(!expediente.adjuntos || expediente.adjuntos.length === 0) ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    No hay documentos anexados aún
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Utilice el botón &quot;Incorporar Documento&quot; para subir providencias, notas o resoluciones.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {expediente.adjuntos.map((adj) => {
                    const u = getUsuario(adj.usuarioId);
                    return (
                      <div
                        key={adj.id}
                        className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              {adj.titulo}
                              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {adj.tipoAdjunto}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {adj.descripcion || 'Sin descripción adicional'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {adj.archivoTamano} • Incorporado por {u?.firstName} {u?.lastName} el{' '}
                              {formatDate(adj.fechaAdjunto)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              alert(
                                `Descargando copia fiel digital: ${adj.archivoNombre}\nHash SHA-256 verificado: 8a4c9f1... (Firma Digital válida)`
                              )
                            }
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Descargar documento"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Última actualización: {formatDate(expediente.updatedAt)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
