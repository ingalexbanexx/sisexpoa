import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Departamento,
  Rol,
  Usuario,
  Expediente,
  ExpedientePase,
  AuditoriaLog,
  TipoAdjunto,
  TipoRol,
} from '../types';
import {
  DEPARTAMENTOS_INICIALES,
  ROLES_DEFINICION,
  USUARIOS_INICIALES,
  EXPEDIENTES_INICIALES,
  AUDITORIA_INICIAL,
} from '../data/initialData';

interface AppContextType {
  departamentos: Departamento[];
  usuarios: Usuario[];
  usuarioActual: Usuario;
  roles: Record<string, Rol>;
  expedientes: Expediente[];
  auditoriaLogs: AuditoriaLog[];
  switchUsuario: (usuarioId: number) => void;
  iniciarExpediente: (data: {
    asunto: string;
    tramiteInicio: string;
    fojasInicio: number;
  }) => { success: boolean; claveUnica?: string; error?: string };
  crearPase: (
    expedienteId: number,
    data: {
      deptoReceptorId: number;
      usuarioReceptorId: number;
      observacion: string;
      fojasPase: number;
    }
  ) => { success: boolean; error?: string };
  recepcionarPase: (
    paseId: number,
    observacionRecepcion: string
  ) => { success: boolean; error?: string };
  rechazarPase: (
    paseId: number,
    motivoRechazo: string
  ) => { success: boolean; error?: string };
  archivarExpediente: (
    expedienteId: number,
    data: {
      nroCaja: string;
      observacion: string;
      fojasArchivado?: number;
    }
  ) => { success: boolean; error?: string };
  desarchivarExpediente: (
    expedienteId: number,
    motivo: string
  ) => { success: boolean; error?: string };
  agregarAdjunto: (
    expedienteId: number,
    data: {
      tipoAdjunto: TipoAdjunto;
      titulo: string;
      descripcion: string;
      archivoNombre: string;
      archivoTamano: string;
    }
  ) => { success: boolean; error?: string };
  agregarDepartamento: (data: Omit<Departamento, 'id'>) => void;
  editarDepartamento: (id: number, data: Partial<Departamento>) => void;
  agregarUsuario: (data: Omit<Usuario, 'id'>) => void;
  editarUsuario: (id: number, data: Partial<Usuario>) => void;
  restablecerDatos: () => void;
  calcularTotalFojas: (expediente: Expediente) => number;
  getDepartamento: (id?: number) => Departamento | undefined;
  getUsuario: (id?: number) => Usuario | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_DEPTS = 'siged_departamentos_v1';
const STORAGE_KEY_USERS = 'siged_usuarios_v1';
const STORAGE_KEY_CURRENT_USER = 'siged_current_user_v1';
const STORAGE_KEY_EXPEDIENTES = 'siged_expedientes_v1';
const STORAGE_KEY_AUDITORIA = 'siged_auditoria_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DEPTS);
    return saved ? JSON.parse(saved) : DEPARTAMENTOS_INICIALES;
  });

  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    return saved ? JSON.parse(saved) : USUARIOS_INICIALES;
  });

  const [usuarioActual, setUsuarioActual] = useState<Usuario>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (savedId) {
      const found = USUARIOS_INICIALES.find((u) => u.id === Number(savedId));
      if (found) return found;
    }
    return USUARIOS_INICIALES[0]; // Carlos Martínez por defecto
  });

  const [expedientes, setExpedientes] = useState<Expediente[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPEDIENTES);
    return saved ? JSON.parse(saved) : EXPEDIENTES_INICIALES;
  });

  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUDITORIA);
    return saved ? JSON.parse(saved) : AUDITORIA_INICIAL;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DEPTS, JSON.stringify(departamentos));
  }, [departamentos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, String(usuarioActual.id));
  }, [usuarioActual]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPEDIENTES, JSON.stringify(expedientes));
  }, [expedientes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDITORIA, JSON.stringify(auditoriaLogs));
  }, [auditoriaLogs]);

  const registrarAuditoria = (
    tablaAfectada: string,
    registroId: number | string,
    accion: AuditoriaLog['accion'],
    datosNuevos?: Record<string, unknown> | null,
    datosAnteriores?: Record<string, unknown> | null
  ) => {
    const nuevoLog: AuditoriaLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tablaAfectada,
      registroId,
      accion,
      usuarioId: usuarioActual.id,
      datosNuevos: datosNuevos || null,
      datosAnteriores: datosAnteriores || null,
      ipAddress: '192.168.10.15',
      timestamp: new Date().toISOString(),
    };
    setAuditoriaLogs((prev) => [nuevoLog, ...prev]);
  };

  const getDepartamento = (id?: number) => departamentos.find((d) => d.id === id);
  const getUsuario = (id?: number) => usuarios.find((u) => u.id === id);

  const calcularTotalFojas = (expediente: Expediente): number => {
    const fojasPases = (expediente.pases || []).reduce(
      (sum, p) => sum + (Number(p.fojasPase) || 0),
      0
    );
    return (Number(expediente.fojasInicio) || 1) + fojasPases;
  };

  const switchUsuario = (usuarioId: number) => {
    const target = usuarios.find((u) => u.id === usuarioId);
    if (target) {
      registrarAuditoria(
        '/auth/login',
        target.id,
        'LOGIN',
        { usuario: target.username, rol: target.rolId }
      );
      setUsuarioActual(target);
    }
  };

  const iniciarExpediente = (data: {
    asunto: string;
    tramiteInicio: string;
    fojasInicio: number;
  }) => {
    // Validar permisos
    const rol = ROLES_DEFINICION[usuarioActual.rolId];
    if (!rol?.permisos.puedeIniciar) {
      return {
        success: false,
        error: 'Su rol (' + usuarioActual.rolId + ') no posee permisos para iniciar expedientes.',
      };
    }

    const currentYear = new Date().getFullYear();
    const codigoReparticion = '2100';

    // Generar correlativo anual
    const expedientesAnio = expedientes.filter(
      (e) => e.anio === currentYear && e.codigoReparticion === codigoReparticion
    );
    const maxNumero = expedientesAnio.reduce(
      (max, e) => (e.numeroExpediente > max ? e.numeroExpediente : max),
      0
    );
    const nuevoNumero = maxNumero + 1;
    const claveUnica = `${codigoReparticion}-${nuevoNumero}-${currentYear}`;

    const now = new Date().toISOString();

    const nuevoExpediente: Expediente = {
      id: Date.now(),
      codigoReparticion,
      numeroExpediente: nuevoNumero,
      anio: currentYear,
      claveUnica,
      departamentoInicioId: usuarioActual.departamentoId,
      usuarioInicioId: usuarioActual.id,
      fechaInicio: now,
      asunto: data.asunto.trim(),
      tramiteInicio: data.tramiteInicio.trim(),
      fojasInicio: Math.max(1, Number(data.fojasInicio) || 1),
      estado: 'iniciado',
      createdAt: now,
      updatedAt: now,
      departamentoActualId: usuarioActual.departamentoId,
      usuarioActualId: usuarioActual.id,
      pases: [],
      adjuntos: [],
    };

    setExpedientes((prev) => [nuevoExpediente, ...prev]);

    registrarAuditoria(
      '/expedientes/iniciar',
      claveUnica,
      'CREATE',
      {
        claveUnica,
        asunto: data.asunto,
        fojasInicio: data.fojasInicio,
        departamentoInicio: getDepartamento(usuarioActual.departamentoId)?.nombre,
        iniciadoPor: `${usuarioActual.firstName} ${usuarioActual.lastName}`,
      }
    );

    return { success: true, claveUnica };
  };

  const crearPase = (
    expedienteId: number,
    data: {
      deptoReceptorId: number;
      usuarioReceptorId: number;
      observacion: string;
      fojasPase: number;
    }
  ) => {
    const expediente = expedientes.find((e) => e.id === expedienteId);
    if (!expediente) return { success: false, error: 'Expediente no encontrado.' };

    if (expediente.estado === 'archivado') {
      return { success: false, error: 'No se puede pasear un expediente archivado.' };
    }

    // Comprobar posesión
    const ultimoPase = expediente.pases.find((p) => p.esUltimoPase);
    const poseeExpediente = ultimoPase
      ? ultimoPase.usuarioReceptorId === usuarioActual.id &&
        ultimoPase.estadoPase === 'recepcionado'
      : expediente.usuarioInicioId === usuarioActual.id &&
        expediente.estado === 'iniciado';

    const esAdminOEncargado =
      usuarioActual.rolId === 'admin' ||
      usuarioActual.rolId === 'superadmin' ||
      usuarioActual.esEncargado;

    if (!poseeExpediente && !esAdminOEncargado) {
      return {
        success: false,
        error:
          'Solo el usuario que posee y recepcionó el expediente, su encargado o un administrador puede pasearlo.',
      };
    }

    const now = new Date().toISOString();

    const nuevoPase: ExpedientePase = {
      id: Date.now(),
      expedienteId,
      usuarioEmisorId: usuarioActual.id,
      departamentoEmisorId: usuarioActual.departamentoId,
      fechaPase: now,
      usuarioReceptorId: data.usuarioReceptorId,
      departamentoReceptorId: data.deptoReceptorId,
      observacion: data.observacion.trim(),
      fojasPase: Math.max(0, Number(data.fojasPase) || 0),
      estadoPase: 'pendiente',
      esUltimoPase: true,
    };

    setExpedientes((prev) =>
      prev.map((exp) => {
        if (exp.id !== expedienteId) return exp;

        const updatedPases = (exp.pases || []).map((p) => ({
          ...p,
          esUltimoPase: false,
        }));

        return {
          ...exp,
          estado: 'pase',
          departamentoActualId: data.deptoReceptorId,
          usuarioActualId: data.usuarioReceptorId,
          updatedAt: now,
          pases: [...updatedPases, nuevoPase],
        };
      })
    );

    registrarAuditoria(
      '/expedientes/pase',
      expediente.claveUnica,
      'PASE',
      {
        expediente: expediente.claveUnica,
        emisor: `${usuarioActual.firstName} ${usuarioActual.lastName}`,
        deptoEmisor: getDepartamento(usuarioActual.departamentoId)?.nombre,
        receptor: getUsuario(data.usuarioReceptorId)?.username,
        deptoReceptor: getDepartamento(data.deptoReceptorId)?.nombre,
        fojasAgregadas: data.fojasPase,
        observacion: data.observacion,
      }
    );

    return { success: true };
  };

  const recepcionarPase = (paseId: number, observacionRecepcion: string) => {
    let expedienteClave = '';
    const now = new Date().toISOString();

    setExpedientes((prev) =>
      prev.map((exp) => {
        const paseIndex = (exp.pases || []).findIndex((p) => p.id === paseId);
        if (paseIndex === -1) return exp;

        expedienteClave = exp.claveUnica;
        const updatedPases = [...exp.pases];
        updatedPases[paseIndex] = {
          ...updatedPases[paseIndex],
          estadoPase: 'recepcionado',
          fechaRecepcion: now,
          observacionRecepcion: observacionRecepcion.trim() || 'Recepcionado conforme.',
        };

        return {
          ...exp,
          departamentoActualId: updatedPases[paseIndex].departamentoReceptorId,
          usuarioActualId: updatedPases[paseIndex].usuarioReceptorId,
          updatedAt: now,
          pases: updatedPases,
        };
      })
    );

    registrarAuditoria(
      '/expedientes/recepcionar',
      expedienteClave || paseId,
      'RECEPCION',
      {
        paseId,
        recepcionadoPor: `${usuarioActual.firstName} ${usuarioActual.lastName}`,
        fechaRecepcion: now,
        observacion: observacionRecepcion,
      }
    );

    return { success: true };
  };

  const rechazarPase = (paseId: number, motivoRechazo: string) => {
    let expedienteClave = '';
    const now = new Date().toISOString();

    setExpedientes((prev) =>
      prev.map((exp) => {
        const paseIndex = (exp.pases || []).findIndex((p) => p.id === paseId);
        if (paseIndex === -1) return exp;

        expedienteClave = exp.claveUnica;
        const targetPase = exp.pases[paseIndex];
        const updatedPases = [...exp.pases];

        updatedPases[paseIndex] = {
          ...targetPase,
          estadoPase: 'rechazado',
          observacionRecepcion: `RECHAZADO: ${motivoRechazo.trim()}`,
          fechaRecepcion: now,
          esUltimoPase: false,
        };

        // Devuelve el expediente al emisor
        return {
          ...exp,
          departamentoActualId: targetPase.departamentoEmisorId,
          usuarioActualId: targetPase.usuarioEmisorId,
          updatedAt: now,
          pases: updatedPases,
        };
      })
    );

    registrarAuditoria(
      '/expedientes/rechazar',
      expedienteClave || paseId,
      'RECHAZO',
      {
        paseId,
        rechazadoPor: `${usuarioActual.firstName} ${usuarioActual.lastName}`,
        motivo: motivoRechazo,
      }
    );

    return { success: true };
  };

  const archivarExpediente = (
    expedienteId: number,
    data: {
      nroCaja: string;
      observacion: string;
      fojasArchivado?: number;
    }
  ) => {
    const expediente = expedientes.find((e) => e.id === expedienteId);
    if (!expediente) return { success: false, error: 'Expediente no encontrado.' };

    const rol = ROLES_DEFINICION[usuarioActual.rolId];
    if (!rol?.permisos.puedeArchivar) {
      return { success: false, error: 'No tiene permisos para archivar expedientes.' };
    }

    const totalFojas = data.fojasArchivado || calcularTotalFojas(expediente);
    const now = new Date().toISOString();

    setExpedientes((prev) =>
      prev.map((exp) => {
        if (exp.id !== expedienteId) return exp;

        return {
          ...exp,
          estado: 'archivado',
          departamentoActualId: 800, // Archivo General Central
          usuarioActualId: usuarioActual.id,
          updatedAt: now,
          archivado: {
            id: Date.now(),
            expedienteId,
            nroCaja: data.nroCaja.trim(),
            fechaArchivado: now,
            fojasArchivado: totalFojas,
            observacion: data.observacion.trim(),
            usuarioArchivoId: usuarioActual.id,
          },
        };
      })
    );

    registrarAuditoria(
      '/expedientes/archivar',
      expediente.claveUnica,
      'ARCHIVO',
      {
        expediente: expediente.claveUnica,
        nroCaja: data.nroCaja,
        fojas: totalFojas,
        observacion: data.observacion,
        usuarioArchivo: `${usuarioActual.firstName} ${usuarioActual.lastName}`,
      }
    );

    return { success: true };
  };

  const desarchivarExpediente = (expedienteId: number, motivo: string) => {
    const expediente = expedientes.find((e) => e.id === expedienteId);
    if (!expediente) return { success: false, error: 'Expediente no encontrado.' };

    const rol = ROLES_DEFINICION[usuarioActual.rolId];
    if (!rol?.permisos.puedeDesarchivar) {
      return {
        success: false,
        error: 'Solo administradores pueden reactivar o desarchivar expedientes.',
      };
    }

    const now = new Date().toISOString();

    setExpedientes((prev) =>
      prev.map((exp) => {
        if (exp.id !== expedienteId) return exp;

        return {
          ...exp,
          estado: 'pase',
          updatedAt: now,
          departamentoActualId: usuarioActual.departamentoId,
          usuarioActualId: usuarioActual.id,
          archivado: undefined,
        };
      })
    );

    registrarAuditoria(
      '/expedientes/desarchivar',
      expediente.claveUnica,
      'DESARCHIVO',
      {
        expediente: expediente.claveUnica,
        motivo,
        desarchivadoPor: `${usuarioActual.firstName} ${usuarioActual.lastName}`,
      }
    );

    return { success: true };
  };

  const agregarAdjunto = (
    expedienteId: number,
    data: {
      tipoAdjunto: TipoAdjunto;
      titulo: string;
      descripcion: string;
      archivoNombre: string;
      archivoTamano: string;
    }
  ) => {
    const expediente = expedientes.find((e) => e.id === expedienteId);
    if (!expediente) return { success: false, error: 'Expediente no encontrado.' };

    const now = new Date().toISOString();
    const nuevoAdjunto = {
      id: Date.now(),
      expedienteId,
      tipoAdjunto: data.tipoAdjunto,
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim(),
      archivoNombre: data.archivoNombre.trim(),
      archivoTamano: data.archivoTamano || '1.2 MB',
      fechaAdjunto: now,
      usuarioId: usuarioActual.id,
    };

    setExpedientes((prev) =>
      prev.map((exp) => {
        if (exp.id !== expedienteId) return exp;
        return {
          ...exp,
          adjuntos: [nuevoAdjunto, ...(exp.adjuntos || [])],
          updatedAt: now,
        };
      })
    );

    registrarAuditoria(
      '/expedientes/adjuntos',
      expediente.claveUnica,
      'UPDATE',
      {
        expediente: expediente.claveUnica,
        adjunto: data.titulo,
        tipo: data.tipoAdjunto,
        subidoPor: `${usuarioActual.firstName} ${usuarioActual.lastName}`,
      }
    );

    return { success: true };
  };

  const agregarDepartamento = (data: Omit<Departamento, 'id'>) => {
    const nuevoId = 100 + departamentos.length * 100;
    const nuevo: Departamento = {
      ...data,
      id: nuevoId,
    };
    setDepartamentos((prev) => [...prev, nuevo]);
    registrarAuditoria('/admin/departamentos', nuevoId, 'CREATE', nuevo as unknown as Record<string, unknown>);
  };

  const editarDepartamento = (id: number, data: Partial<Departamento>) => {
    setDepartamentos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data } : d))
    );
    registrarAuditoria('/admin/departamentos', id, 'UPDATE', data as Record<string, unknown>);
  };

  const agregarUsuario = (data: Omit<Usuario, 'id'>) => {
    const nuevoId = Math.max(...usuarios.map((u) => u.id), 0) + 1;
    const nuevo: Usuario = {
      ...data,
      id: nuevoId,
    };
    setUsuarios((prev) => [...prev, nuevo]);
    registrarAuditoria('/admin/usuarios', nuevoId, 'CREATE', nuevo as unknown as Record<string, unknown>);
  };

  const editarUsuario = (id: number, data: Partial<Usuario>) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...data } : u))
    );
    registrarAuditoria('/admin/usuarios', id, 'UPDATE', data as Record<string, unknown>);
  };

  const restablecerDatos = () => {
    localStorage.removeItem(STORAGE_KEY_DEPTS);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem(STORAGE_KEY_EXPEDIENTES);
    localStorage.removeItem(STORAGE_KEY_AUDITORIA);

    setDepartamentos(DEPARTAMENTOS_INICIALES);
    setUsuarios(USUARIOS_INICIALES);
    setUsuarioActual(USUARIOS_INICIALES[0]);
    setExpedientes(EXPEDIENTES_INICIALES);
    setAuditoriaLogs(AUDITORIA_INICIAL);
  };

  return (
    <AppContext.Provider
      value={{
        departamentos,
        usuarios,
        usuarioActual,
        roles: ROLES_DEFINICION,
        expedientes,
        auditoriaLogs,
        switchUsuario,
        iniciarExpediente,
        crearPase,
        recepcionarPase,
        rechazarPase,
        archivarExpediente,
        desarchivarExpediente,
        agregarAdjunto,
        agregarDepartamento,
        editarDepartamento,
        agregarUsuario,
        editarUsuario,
        restablecerDatos,
        calcularTotalFojas,
        getDepartamento,
        getUsuario,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de un AppProvider');
  return context;
};
