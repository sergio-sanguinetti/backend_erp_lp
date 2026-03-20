'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { 
  creditosAbonosAPI, 
  clientesAPI, 
  rutasAPI, 
  formasPagoAPI,
  authAPI,
  sedesAPI,
  usuariosAPI,
  type ClienteCredito as ClienteCreditoAPI,
  type NotaCredito as NotaCreditoAPI,
  type Pago as PagoAPI,
  type ResumenCartera,
  type HistorialLimiteCredito,
  type Usuario,
  type Sede,
  type Ruta,
  type FormaPago
} from '@/lib/api'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Badge,
  Tabs,
  Tab,
  InputAdornment,
  Radio
} from '@mui/material'
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Block as BlockIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CreditCard as CreditCardIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Close as CloseIcon,
  Group as GroupIcon
} from '@mui/icons-material'

// Tipos de datos (usando los de la API)
type ClienteCredito = ClienteCreditoAPI
type NotaCredito = NotaCreditoAPI

type ResumenCredito = ResumenCartera

interface AlertaCredito {
  id: string
  tipo: 'critica' | 'importante' | 'automatica'
  titulo: string
  descripcion: string
  fecha: string
  cliente?: string
  monto?: number
  diasVencimiento?: number
}

interface HistorialLimite {
  id: string
  cliente: string
  usuario: string
  fecha: string
  limiteAnterior: number
  limiteNuevo: number
  motivo: string
}

interface FormaPago {
  id: string
  metodo: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque'
  monto: number
  referencia?: string
  banco?: string
}

interface Pago {
  id: string
  clienteId: string
  clienteNombre: string
  notaId?: string
  numeroNota?: string
  montoTotal: number
  formasPago: FormaPago[]
  fechaPago: string
  horaPago: string
  observaciones: string
  usuarioRegistro: string
  usuarioAutorizacion?: string
  estado: 'pendiente' | 'autorizado' | 'rechazado'
  tipo: 'nota-especifica' | 'abono-general'
  aplicadoA: string[]
}

interface PagoPendienteAutorizacion {
  id: string
  cliente: string
  nota: string
  montoPagado: number
  formasPago: FormaPago[]
  registradoPor: string
  registradoPorNombre?: string
  fechaHora: string
  fechaHora: string
  observaciones: string
  ruta?: string
  pagoCompleto?: PagoAPI
}

export default function CreditosAbonosPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'clientes' | 'limites' | 'pagos-pendientes' | 'historial-pagos' | 'clientes-duplicados'>('dashboard')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCredito | null>(null)
  const refFichaCliente = useRef<HTMLDivElement | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [tipoDialogo, setTipoDialogo] = useState<'modificar-limite' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono'>('modificar-limite')
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaCredito | null>(null)
  const [formasPago, setFormasPago] = useState<Array<{ id: string; formaPagoId: string; metodo: string; monto: number; referencia?: string; banco?: string }>>([])
  const [montoTotalPago, setMontoTotalPago] = useState(0)
  const [filtros, setFiltros] = useState({
    nombre: '',
    ruta: '',
    estado: '',
    deuda: '', // '' = todos, 'con-deuda' = solo con saldo > 0, 'sin-deuda' = al día
    saldoMin: '',
    saldoMax: '',
    diasVencimientoMin: '',
    diasVencimientoMax: ''
  })
  const [tabValue, setTabValue] = useState(0)
  const [contadorId, setContadorId] = useState(0)
  
  // Estados para datos del servidor
  const [resumenCredito, setResumenCredito] = useState<ResumenCredito>({
    carteraTotal: 0,
    notasPendientes: 0,
    carteraVencida: 0,
    notasVencidas: 0,
    porcentajeVencida: 0,
    carteraPorVencer: 0,
    notasPorVencer: 0,
    porcentajePorVencer: 0
  })
  const [clientesCredito, setClientesCredito] = useState<ClienteCredito[]>([])
  const [pagosPendientesAutorizacion, setPagosPendientesAutorizacion] = useState<PagoPendienteAutorizacion[]>([])
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([])
  const [historialLimites, setHistorialLimites] = useState<HistorialLimite[]>([])
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [formasPagoDisponibles, setFormasPagoDisponibles] = useState<FormaPago[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [sedeId, setSedeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [nuevoLimite, setNuevoLimite] = useState(0)
  const [motivoLimite, setMotivoLimite] = useState('')
  const [formatoEstadoCuenta, setFormatoEstadoCuenta] = useState<'pdf' | 'excel'>('pdf')
  const [observacionesPago, setObservacionesPago] = useState('')
  const [limitesEditados, setLimitesEditados] = useState<Record<string, { limite: number; motivo: string }>>({})
  const [modalDetallePago, setModalDetallePago] = useState(false)
  const [pagoSeleccionadoDetalle, setPagoSeleccionadoDetalle] = useState<PagoAPI | null>(null)
  const [usuarioRegistroNombre, setUsuarioRegistroNombre] = useState<string>('')
  const [usuarioAutorizacionNombre, setUsuarioAutorizacionNombre] = useState<string>('')

  const [pageClientes, setPageClientes] = useState(0)
  const [rowsPerPageClientes, setRowsPerPageClientes] = useState(10)
  const [totalClientes, setTotalClientes] = useState(0)
  const [pageHistorial, setPageHistorial] = useState(0)
  const [rowsPerPageHistorial, setRowsPerPageHistorial] = useState(10)
  const [totalHistorial, setTotalHistorial] = useState(0)

  // Buscador y filtro de ruta propios de la sección Límites Individuales por Cliente
  const [filtroNombreLimites, setFiltroNombreLimites] = useState('')

  // Buscador y filtro por ruta en Pagos Pendientes e Historial de Pagos
  const [filtroBusquedaPagosPendientes, setFiltroBusquedaPagosPendientes] = useState('')
  const [filtroBusquedaHistorialPagos, setFiltroBusquedaHistorialPagos] = useState('')
  const [filtroRutaPagosPendientes, setFiltroRutaPagosPendientes] = useState<string>('todas')
  // Filtros propios del Historial de Pagos: ruta (todas por defecto) y fechas (hoy por defecto)
  const [filtroRutaHistorialPagos, setFiltroRutaHistorialPagos] = useState<string>('todas')
  const [fechaDesdeHistorialPagos, setFechaDesdeHistorialPagos] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [fechaHastaHistorialPagos, setFechaHastaHistorialPagos] = useState<string>(() => new Date().toISOString().slice(0, 10))

  // Filtros del Dashboard (resumen cartera): ruta y fechas
  const [filtroRutaDashboard, setFiltroRutaDashboard] = useState<string>('todas')
  const [fechaDesdeDashboard, setFechaDesdeDashboard] = useState<string>('')
  const [fechaHastaDashboard, setFechaHastaDashboard] = useState<string>('')

  // Paginación client-side: Pagos Pendientes e Historial de Pagos
  const [pagePagosPendientes, setPagePagosPendientes] = useState(0)
  const [rowsPerPagePagosPendientes, setRowsPerPagePagosPendientes] = useState(10)
  const [pageHistorialPagos, setPageHistorialPagos] = useState(0)
  const [rowsPerPageHistorialPagos, setRowsPerPageHistorialPagos] = useState(10)

  // Clientes duplicados
  const [clientesDuplicados, setClientesDuplicados] = useState<any[][]>([])
  const [loadingDuplicados, setLoadingDuplicados] = useState(false)
  const [principalSel, setPrincipalSel] = useState<Record<number, string>>({})
  const [pageDuplicados, setPageDuplicados] = useState(0)
  const [rowsPerPageDuplicados, setRowsPerPageDuplicados] = useState(10)

  const cargarDuplicados = async () => {
    try {
      setLoadingDuplicados(true)
      const data = await clientesAPI.getDuplicados()
      setClientesDuplicados(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingDuplicados(false)
    }
  }

  useEffect(() => {
    if (vistaActual === 'clientes-duplicados') {
      cargarDuplicados()
    }
  }, [vistaActual])

  const manejarUnificar = async (grupoIndex: number, principalId: string, secundariosIds: string[]) => {
    if (!principalId || secundariosIds.length === 0) {
      setError('Seleccione un cliente principal. Asegúrese de que hay al menos 2 clientes para unificar.')
      return
    }
    try {
      setSaving(true)
      await clientesAPI.unificar(principalId, secundariosIds)
      setSuccessMessage('Clientes unificados correctamente')
      cargarDuplicados()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Mapa ID usuario -> nombre para mostrar en historial de pagos (Registrado por / Autorizado por)
  const [usuariosNombresMapHistorial, setUsuariosNombresMapHistorial] = useState<Map<string, string>>(new Map())

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Flujo obligatorio: primero obtener todas las rutas de la sede, luego con la primera ruta traer clientes
  useEffect(() => {
    const cargarRutas = async (): Promise<Ruta[]> => {
      try {
        if (sedeId) {
          const rutasData = await rutasAPI.getAll({ sedeId })
          setRutas(rutasData)
          return rutasData
        }
        const rutasData = await rutasAPI.getAll()
        setRutas(rutasData)
        return rutasData
      } catch (err) {
        console.error('Error al cargar rutas:', err)
        if (sedeId) {
          try {
            const rutasData = await rutasAPI.getAll()
            setRutas(rutasData)
            return rutasData
          } catch (err2) {
            console.error('Error al cargar todas las rutas:', err2)
            return []
          }
        }
        return []
      }
    }
    cargarRutas().then((rutasData) => {
      if (rutasData && rutasData.length > 0) {
        cargarDatos(rutasData)
      } else {
        setClientesCredito([])
        setTotalClientes(0)
        setHistorialLimites([])
        setTotalHistorial(0)
        setResumenCredito({
          carteraTotal: 0,
          notasPendientes: 0,
          carteraVencida: 0,
          notasVencidas: 0,
          porcentajeVencida: 0,
          carteraPorVencer: 0,
          notasPorVencer: 0,
          porcentajePorVencer: 0
        })
        setPagosPendientesAutorizacion([])
        setHistorialPagos([])
        setLoading(false)
      }
    })
  }, [sedeId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const user = await authAPI.getProfile()
      setUsuario(user)
      
      const [sedesData, formasPagoData] = await Promise.all([
        sedesAPI.getAll(),
        formasPagoAPI.getAll()
      ])
      
      setSedes(sedesData)
      setFormasPagoDisponibles(formasPagoData)

      // Resolver sede: puede venir como ID (UUID) o como nombre
      let sedeUsuarioId: string | null = null
      if (user.sede) {
        const sedeEncontrada = sedesData.find(
          s => s.id === user.sede || s.nombre === user.sede || (typeof user.sede === 'string' && s.nombre.toUpperCase() === user.sede.toUpperCase())
        )
        sedeUsuarioId = sedeEncontrada?.id ?? null
      }

      // Solo superAdministrador puede elegir sede; Administrador y Gestor solo ven su sede asignada
      const initialSedeId = user.rol === 'superAdministrador'
        ? (sedeUsuarioId || sedesData[0]?.id || null)
        : sedeUsuarioId

      // El useEffect que depende de sedeId se encargará de cargar rutas de la sede y luego clientes (primera ruta)
      setSedeId(initialSedeId)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos iniciales')
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarDatos = async (
    rutasRecienCargadas?: Ruta[],
    overrides?: { pageClientes?: number; pageHistorial?: number; rowsPerPageClientes?: number; rowsPerPageHistorial?: number }
  ) => {
    try {
      setLoading(true)
      setError(null)

      const listaRutas = rutasRecienCargadas ?? rutas
      const primeraRutaId = listaRutas.length > 0 ? listaRutas[0].id : undefined

      const filtrosAPI: any = {}
      if (sedeId) {
        filtrosAPI.sedeId = sedeId
      }
      if (filtros.nombre) {
        filtrosAPI.nombre = filtros.nombre
      }
      if (filtros.ruta) {
        const rutaEncontrada = listaRutas.find(r => r.nombre === filtros.ruta)
        if (rutaEncontrada) {
          filtrosAPI.rutaId = rutaEncontrada.id
        }
      }
      if (!filtrosAPI.rutaId && primeraRutaId) {
        filtrosAPI.rutaId = primeraRutaId
      }
      // Solo enviar estadoCliente al API cuando es un valor del enum del backend (activo/suspendido/inactivo).
      // Los valores buen-pagador, vencido, critico, bloqueado son estado de crédito y se filtran en cliente.
      const estadoClienteValidos = ['activo', 'suspendido', 'inactivo']
      if (filtros.estado && estadoClienteValidos.includes(filtros.estado)) {
        filtrosAPI.estadoCliente = filtros.estado
      }
      if (filtros.saldoMin !== '') filtrosAPI.saldoMin = filtros.saldoMin
      if (filtros.saldoMax !== '') filtrosAPI.saldoMax = filtros.saldoMax

      const rutaIdParaCarga = filtrosAPI.rutaId
      const pageC = overrides?.pageClientes ?? pageClientes
      const pageH = overrides?.pageHistorial ?? pageHistorial
      const rppClientes = overrides?.rowsPerPageClientes ?? rowsPerPageClientes
      const rppHistorial = overrides?.rowsPerPageHistorial ?? rowsPerPageHistorial

      // Resumen de cartera: filtros propios del Dashboard (ruta + fechas)
      const resumenFiltros: Parameters<typeof creditosAbonosAPI.getResumenCartera>[0] = {}
      if (filtroRutaDashboard && filtroRutaDashboard !== 'todas') {
        const rutaDashboard = listaRutas.find(r => r.nombre === filtroRutaDashboard)
        if (rutaDashboard) resumenFiltros.rutaId = rutaDashboard.id
      }
      if (fechaDesdeDashboard) resumenFiltros.fechaDesde = fechaDesdeDashboard
      if (fechaHastaDashboard) resumenFiltros.fechaHasta = fechaHastaDashboard
      if (filtrosAPI.estadoCliente) resumenFiltros.estadoCliente = filtrosAPI.estadoCliente
      if (filtros.saldoMin !== '') resumenFiltros.saldoMin = filtros.saldoMin
      if (filtros.saldoMax !== '') resumenFiltros.saldoMax = filtros.saldoMax

      // Historial de pagos: filtros propios (ruta = todas por defecto, fechas = hoy por defecto)
      const historialFiltros: { rutaId?: string; fechaDesde?: string; fechaHasta?: string } = {}
      if (filtroRutaHistorialPagos && filtroRutaHistorialPagos !== 'todas') {
        const rutaHistorial = listaRutas.find(r => r.nombre === filtroRutaHistorialPagos)
        if (rutaHistorial) historialFiltros.rutaId = rutaHistorial.id
      }
      if (fechaDesdeHistorialPagos) historialFiltros.fechaDesde = fechaDesdeHistorialPagos
      if (fechaHastaHistorialPagos) historialFiltros.fechaHasta = fechaHastaHistorialPagos

      const pagosPendientesFiltros: { estado: string; rutaId?: string } = { estado: 'pendiente' }
      if (filtroRutaPagosPendientes && filtroRutaPagosPendientes !== 'todas') {
        const rutaPed = listaRutas.find(r => r.nombre === filtroRutaPagosPendientes)
        if (rutaPed) pagosPendientesFiltros.rutaId = rutaPed.id
      }

      const [resumen, clientesResp, pagos, historial] = await Promise.all([
        creditosAbonosAPI.getResumenCartera(Object.keys(resumenFiltros).length > 0 ? resumenFiltros : undefined),
        creditosAbonosAPI.getClientesCredito({
          ...filtrosAPI,
          page: pageC + 1,
          pageSize: rppClientes
        }),
        creditosAbonosAPI.getAllPagos(pagosPendientesFiltros),
        creditosAbonosAPI.getAllPagos(Object.keys(historialFiltros).length > 0 ? historialFiltros : undefined)
      ])

      setResumenCredito(resumen)
      setClientesCredito(clientesResp.clientes)
      setTotalClientes(clientesResp.total)
      
      // Convertir pagos pendientes al formato esperado
      // Obtener nombres de usuarios únicos
      const usuariosIds = [...new Set(pagos.map(p => p.usuarioRegistro).filter(Boolean))]
      const usuariosMap = new Map<string, Usuario>()
      
      // Cargar información de usuarios en paralelo
      await Promise.all(
        usuariosIds.map(async (userId) => {
          try {
            const usuario = await usuariosAPI.getById(userId)
            usuariosMap.set(userId, usuario)
          } catch (err) {
            console.error(`Error al obtener usuario ${userId}:`, err)
          }
        })
      )

      const pagosPendientes = pagos.map(p => {
        const usuario = usuariosMap.get(p.usuarioRegistro)
        const nombreUsuario = usuario 
          ? `${usuario.nombres} ${usuario.apellidoPaterno}`
          : p.usuarioRegistro

        return {
          id: p.id,
          cliente: p.cliente ? `${p.cliente.nombre} ${p.cliente.apellidoPaterno} ${p.cliente.apellidoMaterno}` : 'N/A',
          nota: p.notaCredito?.numeroNota || 'Abono general',
          ruta: p.cliente?.ruta?.nombre || 'Sin ruta',
          montoPagado: p.montoTotal,
          formasPago: p.formasPago?.map(fp => ({
            id: fp.id,
            metodo: fp.formaPago?.tipo || 'efectivo',
            monto: fp.monto,
            referencia: fp.referencia,
            banco: fp.banco
          })) || [],
          registradoPor: p.usuarioRegistro,
          registradoPorNombre: nombreUsuario,
          fechaHora: `${new Date(p.fechaPago).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })} ${p.horaPago}`,
          observaciones: p.observaciones || '',
          pagoCompleto: p
        }
      })
      setPagosPendientesAutorizacion(pagosPendientes)
      setHistorialPagos(historial)

      // Resolver IDs de usuario a nombres para historial de pagos (Registrado por / Autorizado por)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const idsHistorial = new Set<string>()
      historial.forEach((p: PagoAPI) => {
        if (p.usuarioRegistro && uuidRegex.test(p.usuarioRegistro)) idsHistorial.add(p.usuarioRegistro)
        if (p.usuarioAutorizacion && uuidRegex.test(p.usuarioAutorizacion)) idsHistorial.add(p.usuarioAutorizacion)
      })
      const mapNombres = new Map<string, string>()
      await Promise.all(
        Array.from(idsHistorial).map(async (userId) => {
          try {
            const u = await usuariosAPI.getById(userId)
            mapNombres.set(userId, `${u.nombres || ''} ${u.apellidoPaterno || ''}`.trim() || u.correo || userId)
          } catch {
            mapNombres.set(userId, userId)
          }
        })
      )
      setUsuariosNombresMapHistorial(mapNombres)

      setPagePagosPendientes(0)
      setPageHistorialPagos(0)

      // Cargar historial de límites (paginado; misma ruta que el resto)
      const historialLimitesResp = await creditosAbonosAPI.getHistorialLimites(
        rutaIdParaCarga
          ? { rutaId: rutaIdParaCarga, page: pageH + 1, pageSize: rppHistorial }
          : { page: pageH + 1, pageSize: rppHistorial }
      )
      setHistorialLimites(
        historialLimitesResp.historial.map(h => ({
          id: h.id,
          cliente: h.cliente ? `${h.cliente.nombre} ${h.cliente.apellidoPaterno} ${h.cliente.apellidoMaterno}` : 'N/A',
          usuario: h.usuario ? `${h.usuario.nombres} ${h.usuario.apellidoPaterno}` : 'N/A',
          fecha: h.fechaCreacion,
          limiteAnterior: h.limiteAnterior,
          limiteNuevo: h.limiteNuevo,
          motivo: h.motivo
        }))
      )
      setTotalHistorial(historialLimitesResp.total)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generar alertas basadas en los datos reales
  const alertasCredito = useMemo(() => {
    const alertas: Array<{
      id: string
      tipo: 'critica' | 'importante' | 'automatica'
      titulo: string
      descripcion: string
      fecha: string
      cliente?: string
      monto?: number
      diasVencimiento?: number
    }> = []

    clientesCredito.forEach(cliente => {
      if (cliente.saldoActual > cliente.limiteCredito) {
        alertas.push({
          id: `alerta-${cliente.id}-excede`,
          tipo: 'critica',
          titulo: 'Cliente excede límite de crédito',
          descripcion: `${cliente.nombre} ha excedido su límite de crédito en $${(cliente.saldoActual - cliente.limiteCredito).toLocaleString()}`,
          fecha: new Date().toISOString().split('T')[0],
          cliente: cliente.nombre,
          monto: cliente.saldoActual - cliente.limiteCredito
        })
      }

      const notasVencidas = cliente.notasPendientes.filter(n => n.estado === 'vencida')
      notasVencidas.forEach(nota => {
        if (nota.diasVencimiento < -60) {
          alertas.push({
            id: `alerta-${nota.id}-vencida`,
            tipo: 'critica',
            titulo: 'Deuda vencida más de 60 días',
            descripcion: `${cliente.nombre} tiene deuda vencida desde hace ${Math.abs(nota.diasVencimiento)} días`,
            fecha: new Date().toISOString().split('T')[0],
            cliente: cliente.nombre,
            diasVencimiento: Math.abs(nota.diasVencimiento)
          })
        }
      })
    })

    return alertas
  }, [clientesCredito])

  // Función helper para formatear fechas de manera consistente
  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Mexico_City'
      })
    } catch {
      return fecha
    }
  }

  // Al seleccionar un cliente para ver detalle, hacer scroll al panel de la ficha
  useEffect(() => {
    if (clienteSeleccionado && vistaActual === 'clientes' && refFichaCliente.current) {
      const el = refFichaCliente.current
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [clienteSeleccionado, vistaActual])

  const abrirDialogo = (tipo: 'modificar-limite' | 'bloquear' | 'estado-cuenta' | 'registrar-pago' | 'registrar-abono', cliente?: ClienteCredito, nota?: NotaCredito) => {
    setTipoDialogo(tipo)
    setClienteSeleccionado(cliente || null)
    setNotaSeleccionada(nota || null)
    setFormasPago([])
    setMontoTotalPago(0)
    setNuevoLimite(cliente?.limiteCredito || 0)
    setMotivoLimite('')
    setObservacionesPago('')
    setDialogoAbierto(true)
  }

  const agregarFormaPago = () => {
    const formaPagoEfectivo = formasPagoDisponibles.find(fp => fp.tipo === 'efectivo')
    const nuevaFormaPago = {
      id: `fp-${contadorId}`,
      formaPagoId: formaPagoEfectivo?.id || '',
      metodo: 'efectivo',
      monto: 0
    }
    setFormasPago(prev => [...prev, nuevaFormaPago])
    setContadorId(prev => prev + 1)
  }

  const eliminarFormaPago = (id: string) => {
    setFormasPago(prev => prev.filter(fp => fp.id !== id))
  }

  const actualizarFormaPago = (id: string, campo: string, valor: any) => {
    setFormasPago(prev => prev.map(fp => {
      if (fp.id === id) {
        if (campo === 'metodo') {
          const formaPago = formasPagoDisponibles.find(f => f.tipo === valor)
          return { ...fp, formaPagoId: formaPago?.id || '', metodo: valor }
        }
        return { ...fp, [campo]: valor }
      }
      return fp
    }))
  }

  const guardarLimiteCredito = async () => {
    if (!clienteSeleccionado || nuevoLimite <= 0) return

    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updateLimiteCredito(
        clienteSeleccionado.id,
        nuevoLimite,
        motivoLimite
      )
      await cargarDatos()
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar límite de crédito')
    } finally {
      setSaving(false)
    }
  }

  const guardarBloquearCredito = async () => {
    if (!clienteSeleccionado) return
    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updateLimiteCredito(
        clienteSeleccionado.id,
        0,
        'Crédito bloqueado desde Gestión de Créditos'
      )
      setSuccessMessage(`Crédito bloqueado para ${clienteSeleccionado.nombre}`)
      await cargarDatos()
      cerrarDialogo()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Error al bloquear crédito')
    } finally {
      setSaving(false)
    }
  }

  const generarEstadoCuenta = async () => {
    if (!clienteSeleccionado) return
    try {
      setSaving(true)
      setError(null)
      const notas = clienteSeleccionado.notasPendientes ?? []
      const fecha = new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })
      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Estado de Cuenta - ${clienteSeleccionado.nombre}</title>
        <style>body{font-family:system-ui,sans-serif;margin:2rem;max-width:800px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}h1{font-size:1.25rem}.totales{font-weight:bold;margin-top:1rem}</style></head>
        <body>
          <h1>Estado de Cuenta</h1>
          <p><strong>Cliente:</strong> ${clienteSeleccionado.nombre}</p>
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Límite de crédito:</strong> $${(clienteSeleccionado.limiteCredito ?? 0).toLocaleString()}</p>
          <p><strong>Saldo actual:</strong> $${(clienteSeleccionado.saldoActual ?? 0).toLocaleString()}</p>
          <p><strong>Crédito disponible:</strong> $${(clienteSeleccionado.creditoDisponible ?? 0).toLocaleString()}</p>
          <h2>Notas pendientes</h2>
          <table>
            <thead><tr><th>Número</th><th>Fecha venta</th><th>Vencimiento</th><th>Importe</th><th>Estado</th></tr></thead>
            <tbody>
              ${notas.map((n: NotaCredito) => `<tr><td>${n.numeroNota ?? ''}</td><td>${formatearFecha(n.fechaVenta)}</td><td>${formatearFecha(n.fechaVencimiento)}</td><td>$${(n.importe ?? 0).toLocaleString()}</td><td>${n.estado ?? ''}</td></tr>`).join('')}
            </tbody>
          </table>
          ${notas.length === 0 ? '<p>Sin notas pendientes.</p>' : ''}
          <p class="totales">Total pendiente: $${(clienteSeleccionado.saldoActual ?? 0).toLocaleString()}</p>
        </body></html>`
      const ventana = window.open('', '_blank')
      if (ventana) {
        ventana.document.write(html)
        ventana.document.close()
        if (formatoEstadoCuenta === 'pdf') {
          ventana.print()
        }
      }
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al generar estado de cuenta')
    } finally {
      setSaving(false)
    }
  }

  const actualizarLimiteCliente = async (clienteId: string) => {
    const datosLimite = limitesEditados[clienteId]
    if (!datosLimite || datosLimite.limite <= 0) {
      setError('Por favor ingrese un límite válido')
      return
    }

    const cliente = clientesCredito.find(c => c.id === clienteId)
    if (!cliente) return

    // Verificar que haya un cambio
    if (datosLimite.limite === cliente.limiteCredito && !datosLimite.motivo) {
      setError('No hay cambios para guardar')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      await creditosAbonosAPI.updateLimiteCredito(
        clienteId,
        datosLimite.limite,
        datosLimite.motivo || 'Actualización desde Control de Límites'
      )
      
      // Limpiar el estado editado para este cliente
      setLimitesEditados(prev => {
        const nuevo = { ...prev }
        delete nuevo[clienteId]
        return nuevo
      })
      
      setSuccessMessage(`Límite de crédito actualizado exitosamente para ${cliente.nombre}`)
      
      await cargarDatos()
      
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar límite de crédito')
    } finally {
      setSaving(false)
    }
  }

  const manejarCambioLimite = (clienteId: string, limite: number) => {
    const cliente = clientesCredito.find(c => c.id === clienteId)
    if (!cliente) return
    
    setLimitesEditados(prev => ({
      ...prev,
      [clienteId]: {
        limite: limite || cliente.limiteCredito,
        motivo: prev[clienteId]?.motivo || ''
      }
    }))
  }

  const manejarCambioMotivo = (clienteId: string, motivo: string) => {
    setLimitesEditados(prev => ({
      ...prev,
      [clienteId]: {
        limite: prev[clienteId]?.limite || 0,
        motivo
      }
    }))
  }

  const registrarPago = async () => {
    if (!clienteSeleccionado || formasPago.length === 0 || montoTotalPago <= 0) return

    // Validar referencias
    const metodosRequierenFolio = ['transferencia', 'cheque', 'deposito', 'terminal']
    for (const fp of formasPago) {
      if (metodosRequierenFolio.includes(fp.metodo)) {
        if (!fp.referencia || fp.referencia.trim() === '') {
          const nombreMetodo = formasPagoDisponibles.find(f => f.tipo === fp.metodo)?.nombre || fp.metodo
          setError(`El campo "Folio / Referencia" es obligatorio para el método de pago: ${nombreMetodo}`)
          return
        }
      }
    }

    try {
      setSaving(true)
      setError(null)

      const formasPagoData = formasPago.map(fp => ({
        formaPagoId: fp.formaPagoId,
        monto: fp.monto,
        referencia: fp.referencia,
        banco: fp.banco
      }))

      const nombreUsuarioRegistro = usuario
        ? `${usuario.nombres || ''} ${usuario.apellidoPaterno || ''}`.trim() || usuario.correo
        : ''

      await creditosAbonosAPI.createPago({
        clienteId: clienteSeleccionado.id,
        notaCreditoId: notaSeleccionada?.id,
        montoTotal: montoTotalPago,
        tipo: notaSeleccionada ? 'nota_especifica' : 'abono_general',
        observaciones: observacionesPago,
        usuarioRegistro: nombreUsuarioRegistro,
        formasPago: formasPagoData
      })

      await cargarDatos()
      cerrarDialogo()
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  const autorizarPago = async (pagoId: string) => {
    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updatePagoEstado(pagoId, 'autorizado')
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al autorizar pago')
    } finally {
      setSaving(false)
    }
  }

  const rechazarPago = async (pagoId: string) => {
    try {
      setSaving(true)
      setError(null)
      await creditosAbonosAPI.updatePagoEstado(pagoId, 'rechazado')
      await cargarDatos()
    } catch (err: any) {
      setError(err.message || 'Error al rechazar pago')
    } finally {
      setSaving(false)
    }
  }

  // Calcular total del pago usando useMemo para evitar re-renders infinitos
  const totalPago = useMemo(() => {
    return formasPago.reduce((sum, fp) => sum + fp.monto, 0)
  }, [formasPago])

  // Actualizar montoTotalPago cuando cambie el total
  useEffect(() => {
    setMontoTotalPago(totalPago)
  }, [totalPago])

  const getMetodoPagoColor = (metodo: string) => {
    switch (metodo) {
      case 'efectivo': return 'success'
      case 'transferencia': return 'primary'
      case 'tarjeta': return 'secondary'
      case 'cheque': return 'warning'
      default: return 'default'
    }
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setClienteSeleccionado(null)
    setNotaSeleccionada(null)
    setFormasPago([])
    setMontoTotalPago(0)
    setNuevoLimite(0)
    setMotivoLimite('')
    setObservacionesPago('')
  }

  const manejarCambioFiltros = (campo: string, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'buen-pagador': return 'success'
      case 'vencido': return 'warning'
      case 'critico': return 'error'
      case 'bloqueado': return 'default'
      default: return 'default'
    }
  }

  const getNotaEstadoColor = (estado: string) => {
    switch (estado) {
      case 'vigente': return 'success'
      case 'por-vencer': return 'warning'
      case 'vencida': return 'error'
      default: return 'default'
    }
  }

  const getAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'critica': return 'error'
      case 'importante': return 'warning'
      case 'automatica': return 'info'
      default: return 'default'
    }
  }

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'critica': return <WarningIcon />
      case 'importante': return <ScheduleIcon />
      case 'automatica': return <CheckCircleIcon />
      default: return <NotificationsIcon />
    }
  }

  const clientesFiltrados = useMemo(() => {
    return clientesCredito.filter(cliente => {
      // Solo deben aparecer los clientes con crédito utilizado (saldo pendiente mayor a 0)
      if ((cliente.saldoActual ?? 0) <= 0) return false

      const cumpleNombre = !filtros.nombre || cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
      const cumpleRuta = !filtros.ruta || cliente.ruta === filtros.ruta
      const cumpleEstado = !filtros.estado || cliente.estado === filtros.estado
      const tieneDeuda = true // Como el saldo siempre es mayor a 0 por la condición anterior
      const cumpleDeuda =
        !filtros.deuda ||
        (filtros.deuda === 'con-deuda' && tieneDeuda) ||
        (filtros.deuda === 'sin-deuda' && !tieneDeuda)
      const cumpleSaldoMin = !filtros.saldoMin || cliente.saldoActual >= Number(filtros.saldoMin)
      const cumpleSaldoMax = !filtros.saldoMax || cliente.saldoActual <= Number(filtros.saldoMax)

      return cumpleNombre && cumpleRuta && cumpleEstado && cumpleDeuda && cumpleSaldoMin && cumpleSaldoMax
    })
  }, [clientesCredito, filtros])

  const rutasUnicas = useMemo(() => {
    // Usar las rutas cargadas de la API, no solo las de los clientes cargados
    const rutasDeClientes = [...new Set(clientesCredito.map(c => c.ruta))]
    const rutasDeAPI = rutas.map(r => r.nombre)
    // Combinar ambas y eliminar duplicados
    return [...new Set([...rutasDeAPI, ...rutasDeClientes])].filter(r => r && r !== 'Sin ruta')
  }, [clientesCredito, rutas])

  // Clientes filtrados por nombre dentro de Límites Individuales por Cliente (solo esta sección)
  const clientesCreditoFiltradosLimites = useMemo(() => {
    if (!filtroNombreLimites.trim()) return clientesCredito
    const busqueda = filtroNombreLimites.toLowerCase().trim()
    return clientesCredito.filter(c => c.nombre.toLowerCase().includes(busqueda))
  }, [clientesCredito, filtroNombreLimites])

  // Pagos pendientes filtrados por buscador (cliente, nota)
  const pagosPendientesFiltrados = useMemo(() => {
    if (!filtroBusquedaPagosPendientes.trim()) return pagosPendientesAutorizacion
    const busqueda = filtroBusquedaPagosPendientes.toLowerCase().trim()
    return pagosPendientesAutorizacion.filter(
      p =>
        (p.cliente && p.cliente.toLowerCase().includes(busqueda)) ||
        (p.nota && p.nota.toLowerCase().includes(busqueda)) ||
        (p.registradoPorNombre && p.registradoPorNombre.toLowerCase().includes(busqueda)) ||
        (p.ruta && p.ruta.toLowerCase().includes(busqueda))
    )
  }, [pagosPendientesAutorizacion, filtroBusquedaPagosPendientes])

  // Historial de pagos filtrado por buscador (cliente, nota)
  const historialPagosFiltrado = useMemo(() => {
    if (!filtroBusquedaHistorialPagos.trim()) return historialPagos
    const busqueda = filtroBusquedaHistorialPagos.toLowerCase().trim()
    return historialPagos.filter(p => {
      const pago = p as any
      const cliente = pago.cliente
      const nombreCliente = cliente
        ? `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`.trim()
        : ''
      const nota = pago.notaCredito?.numeroNota || 'Abono general'
      return nombreCliente.toLowerCase().includes(busqueda) || nota.toLowerCase().includes(busqueda)
    })
  }, [historialPagos, filtroBusquedaHistorialPagos])

  // Recargar datos cuando cambien los filtros (volver a página 1)
  useEffect(() => {
    if (rutas.length === 0) return
    setPageClientes(0)
    setPageHistorial(0)
    cargarDatos(undefined, { pageClientes: 0, pageHistorial: 0 })
  }, [
    filtros.nombre, filtros.ruta, filtros.estado, 
    filtroRutaHistorialPagos, fechaDesdeHistorialPagos, fechaHastaHistorialPagos, 
    filtroRutaDashboard, fechaDesdeDashboard, fechaHastaDashboard,
    filtroRutaPagosPendientes
  ])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h4' component='h1'>
          Gestión de Créditos y Abonos
        </Typography>
        
        {/* Selector de Sede solo para superAdministrador; Administrador y Gestor solo ven el nombre de su sede */}
        {usuario?.rol === 'superAdministrador' && (
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Sede</InputLabel>
            <Select
              value={sedeId || ''}
              onChange={(e) => setSedeId(e.target.value || null)}
              label='Sede'
            >
              {sedes.map((sede) => (
                <MenuItem key={sede.id} value={sede.id}>
                  {sede.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {usuario && usuario.rol !== 'superAdministrador' && sedeId && (
          <Chip
            label={sedes.find(s => s.id === sedeId)?.nombre ?? 'N/A'}
            color='primary'
            variant='outlined'
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      )}

      {/* Navegación */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={vistaActual === 'dashboard' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('dashboard')}
            startIcon={<AssessmentIcon />}
          >
            Dashboard
          </Button>
          <Button
            variant={vistaActual === 'clientes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('clientes')}
            startIcon={<PersonIcon />}
          >
            Gestión por Cliente
          </Button>
          <Button
            variant={vistaActual === 'limites' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('limites')}
            startIcon={<CreditCardIcon />}
          >
            Control de Límites
          </Button>
          <Button
            variant={vistaActual === 'pagos-pendientes' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('pagos-pendientes')}
            startIcon={<PaymentIcon />}
          >
            Pagos Pendientes
          </Button>
          <Button
            variant={vistaActual === 'historial-pagos' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('historial-pagos')}
            startIcon={<HistoryIcon />}
          >
            Historial de Pagos
          </Button>
          <Button
            variant={vistaActual === 'clientes-duplicados' ? 'contained' : 'outlined'}
            onClick={() => setVistaActual('clientes-duplicados')}
            startIcon={<GroupIcon />}
          >
            Clientes Duplicados
          </Button>
        </Box>
      </Box>

      {/* Dashboard Principal */}
      {vistaActual === 'dashboard' && (
        <Box>
          {/* Filtros del Dashboard: ruta y fechas */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel>Ruta</InputLabel>
              <Select
                label='Ruta'
                value={filtroRutaDashboard}
                onChange={(e) => setFiltroRutaDashboard(e.target.value)}
              >
                <MenuItem value='todas'>Todas las rutas</MenuItem>
                {rutasUnicas.map((ruta) => (
                  <MenuItem key={ruta} value={ruta}>
                    {ruta}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size='small'
              label='Fecha desde'
              type='date'
              value={fechaDesdeDashboard}
              onChange={(e) => setFechaDesdeDashboard(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              size='small'
              label='Fecha hasta'
              type='date'
              value={fechaHastaDashboard}
              onChange={(e) => setFechaHastaDashboard(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
          </Box>
          {/* Tarjetas de Resumen General */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        CARTERA TOTAL
                      </Typography>
                      <Typography variant='h4' component='div' color='primary'>
                        ${resumenCredito.carteraTotal.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenCredito.notasPendientes} notas pendientes
                      </Typography>
                    </Box>
                    <AccountBalanceIcon color='primary' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        VENCIDA
                      </Typography>
                      <Typography variant='h4' component='div' color='error.main'>
                        ${resumenCredito.carteraVencida.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenCredito.notasVencidas} notas • {resumenCredito.porcentajeVencida}%
                      </Typography>
                    </Box>
                    <WarningIcon color='error' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color='text.secondary' gutterBottom>
                        POR VENCER
                      </Typography>
                      <Typography variant='h4' component='div' color='warning.main'>
                        ${resumenCredito.carteraPorVencer.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {resumenCredito.notasPorVencer} notas • {resumenCredito.porcentajePorVencer}%
                      </Typography>
                    </Box>
                    <ScheduleIcon color='warning' sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Sección de Alertas Críticas */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Alertas Críticas
              </Typography>
              
              <Grid container spacing={2}>
                {alertasCredito.filter(a => a.tipo === 'critica').map((alerta) => (
                  <Grid item xs={12} md={6} key={alerta.id}>
                    <Alert severity={getAlertaColor(alerta.tipo) as any}>
                      <AlertTitle>{alerta.titulo}</AlertTitle>
                      <Typography variant='body2'>
                        {alerta.descripcion}
                      </Typography>
                      {alerta.cliente && (
                        <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
                          Cliente: {alerta.cliente}
                        </Typography>
                      )}
                      {alerta.monto && (
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          Monto: ${alerta.monto.toLocaleString()}
                        </Typography>
                      )}
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Panel de Gestión por Cliente */}
      {vistaActual === 'clientes' && (
        <Box>
          {/* Filtros y Búsqueda Avanzada */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Filtros y Búsqueda Avanzada
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label='Buscar por Nombre'
                    value={filtros.nombre}
                    onChange={(e) => manejarCambioFiltros('nombre', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Ruta</InputLabel>
                    <Select
                      value={filtros.ruta}
                      onChange={(e) => manejarCambioFiltros('ruta', e.target.value)}
                      label='Ruta'
                    >
                      <MenuItem value=''>Todas las rutas</MenuItem>
                      {rutasUnicas.map((ruta) => (
                        <MenuItem key={ruta} value={ruta}>
                          {ruta}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filtros.estado}
                      onChange={(e) => manejarCambioFiltros('estado', e.target.value)}
                      label='Estado'
                    >
                      <MenuItem value=''>Todos los estados</MenuItem>
                      <MenuItem value='activo'>Activo</MenuItem>
                      <MenuItem value='suspendido'>Suspendido</MenuItem>
                      <MenuItem value='inactivo'>Inactivo</MenuItem>
                      <MenuItem value='buen-pagador'>Buen Pagador</MenuItem>
                      <MenuItem value='vencido'>Vencido</MenuItem>
                      <MenuItem value='critico'>Crítico</MenuItem>
                      <MenuItem value='bloqueado'>Bloqueado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Deuda</InputLabel>
                    <Select
                      value={filtros.deuda}
                      onChange={(e) => manejarCambioFiltros('deuda', e.target.value)}
                      label='Deuda'
                    >
                      <MenuItem value=''>Todos</MenuItem>
                      <MenuItem value='con-deuda'>Con deuda</MenuItem>
                      <MenuItem value='sin-deuda'>Sin deuda (al día)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label='Saldo Mínimo'
                      type='number'
                      value={filtros.saldoMin}
                      onChange={(e) => manejarCambioFiltros('saldoMin', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label='Saldo Máximo'
                      type='number'
                      value={filtros.saldoMax}
                      onChange={(e) => manejarCambioFiltros('saldoMax', e.target.value)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Lista de Clientes (solo primera ruta)
              </Typography>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell align='right'>Límite Crédito</TableCell>
                      <TableCell align='right'>Saldo Actual</TableCell>
                      <TableCell align='right'>Crédito Disponible</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Deuda</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientesFiltrados.map((cliente) => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 40, height: 40 }}>
                              {cliente.nombre.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {cliente.nombre}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {cliente.telefono}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={cliente.ruta} size='small' variant='outlined' />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight='bold'>
                            ${cliente.limiteCredito.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography 
                            variant='body2' 
                            fontWeight='bold'
                            color={cliente.saldoActual > cliente.limiteCredito ? 'error' : 'text.primary'}
                          >
                            ${cliente.saldoActual.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography 
                            variant='body2' 
                            fontWeight='bold'
                            color={cliente.creditoDisponible < 0 ? 'error' : 'success.main'}
                          >
                            ${cliente.creditoDisponible.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cliente.estado.replace('-', ' ').toUpperCase()}
                            color={getEstadoColor(cliente.estado) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(cliente.saldoActual ?? 0) > 0 ? 'Con deuda' : 'Al día'}
                            color={((cliente.saldoActual ?? 0) > 0 ? 'warning' : 'success') as any}
                            size='small'
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Ver detalles'>
                              <IconButton size='small' onClick={() => setClienteSeleccionado(cliente)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Modificar límite'>
                              <IconButton size='small' onClick={() => abrirDialogo('modificar-limite', cliente)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Registrar pago'>
                              <IconButton size='small' onClick={() => abrirDialogo('registrar-pago', cliente)}>
                                <PaymentIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component='div'
                  count={totalClientes}
                  page={pageClientes}
                  onPageChange={(_, newPage) => {
                    setPageClientes(newPage)
                    cargarDatos(undefined, { pageClientes: newPage })
                  }}
                  rowsPerPage={rowsPerPageClientes}
                  onRowsPerPageChange={(e) => {
                    const newRpp = parseInt(e.target.value, 10)
                    setRowsPerPageClientes(newRpp)
                    setPageClientes(0)
                    cargarDatos(undefined, { pageClientes: 0, rowsPerPageClientes: newRpp })
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage='Filas por página'
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </TableContainer>
            </CardContent>
          </Card>

          {/* Ficha Individual del Cliente */}
          {clienteSeleccionado && (
            <Box ref={refFichaCliente} sx={{ mt: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 50, height: 50 }}>
                      {(clienteSeleccionado.nombre || ' ').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant='h6'>
                        {clienteSeleccionado.nombre}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {clienteSeleccionado.ruta}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setClienteSeleccionado(null)}>
                    ×
                  </IconButton>
                </Box>

                {/* Datos del Cliente */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='h6' gutterBottom>
                      Datos del Cliente
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {clienteSeleccionado.direccion ?? '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {clienteSeleccionado.telefono ?? '—'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant='h6' gutterBottom>
                      Resumen Financiero
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Límite de Crédito
                        </Typography>
                        <Typography variant='h6' color='primary'>
                          ${clienteSeleccionado.limiteCredito.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Saldo Actual
                        </Typography>
                        <Typography variant='h6' color='text.primary'>
                          ${clienteSeleccionado.saldoActual.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Crédito Disponible
                        </Typography>
                        <Typography 
                          variant='h6' 
                          color={clienteSeleccionado.creditoDisponible < 0 ? 'error' : 'success.main'}
                        >
                          ${clienteSeleccionado.creditoDisponible.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Días Promedio de Pago
                        </Typography>
                        <Typography variant='h6' color='text.primary'>
                          {clienteSeleccionado.diasPromedioPago} días
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Tabla de Notas Pendientes */}
                <Typography variant='h6' gutterBottom>
                  Notas Pendientes
                </Typography>
                
                {(clienteSeleccionado.notasPendientes ?? []).length > 0 ? (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Número de Nota</TableCell>
                          <TableCell>Fecha Venta</TableCell>
                          <TableCell>Fecha Vencimiento</TableCell>
                          <TableCell align='right'>Importe</TableCell>
                          <TableCell align='right'>Días Vencimiento</TableCell>
                          <TableCell align='center'>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(clienteSeleccionado.notasPendientes ?? []).map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {nota.numeroNota}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {formatearFecha(nota.fechaVenta)}
                            </TableCell>
                            <TableCell>
                              {formatearFecha(nota.fechaVencimiento)}
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='h6' color='primary'>
                                ${nota.importe.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography 
                                variant='body2'
                                color={nota.diasVencimiento < 0 ? 'error' : nota.diasVencimiento < 7 ? 'warning' : 'text.primary'}
                              >
                                {nota.diasVencimiento > 0 ? `+${nota.diasVencimiento}` : nota.diasVencimiento}
                              </Typography>
                            </TableCell>
                          <TableCell align='center'>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={nota.estado.replace('-', ' ').toUpperCase()}
                                color={getNotaEstadoColor(nota.estado) as any}
                                size='small'
                              />
                              <Tooltip title='Pagar esta nota'>
                                <IconButton 
                                  size='small' 
                                  onClick={() => abrirDialogo('registrar-pago', clienteSeleccionado, nota)}
                                >
                                  <PaymentIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity='success'>
                    No hay notas pendientes para este cliente.
                  </Alert>
                )}

                {/* Botones de Acción */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant='contained'
                    startIcon={<EditIcon />}
                    onClick={() => abrirDialogo('modificar-limite', clienteSeleccionado)}
                  >
                    Modificar Límite
                  </Button>
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<PaymentIcon />}
                    onClick={() => abrirDialogo('registrar-pago', clienteSeleccionado)}
                  >
                    Registrar Pago
                  </Button>
                  <Button
                    variant='outlined'
                    color='success'
                    startIcon={<PaymentIcon />}
                    onClick={() => abrirDialogo('registrar-abono', clienteSeleccionado)}
                  >
                    Registrar Abono General
                  </Button>
                  <Button
                    variant='outlined'
                    color='error'
                    startIcon={<BlockIcon />}
                    onClick={() => abrirDialogo('bloquear', clienteSeleccionado)}
                  >
                    Bloquear Crédito
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<DescriptionIcon />}
                    onClick={() => abrirDialogo('estado-cuenta', clienteSeleccionado)}
                  >
                    Generar Estado Cuenta
                  </Button>
                </Box>
              </CardContent>
            </Card>
            </Box>
          )}
        </Box>
      )}

      {/* Panel de Control de Límites de Crédito */}
      {vistaActual === 'limites' && (
        <Box>
          {/* Configuración Masiva */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Configuración Masiva de Límites
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Límite para Clientes Nuevos'
                    type='number'
                    defaultValue='25000'
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                  />
                  <Typography variant='caption' color='text.secondary'>
                    Se aplicará automáticamente a todos los clientes nuevos
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Ruta Específica</InputLabel>
                      <Select
                        label='Ruta Específica'
                        value={filtros.ruta}
                        onChange={(e) => manejarCambioFiltros('ruta', e.target.value)}
                      >
                        <MenuItem value=''>Primera ruta (por defecto)</MenuItem>
                        {rutasUnicas.map((ruta) => (
                          <MenuItem key={ruta} value={ruta}>
                            {ruta}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label='Nuevo Límite'
                      type='number'
                      defaultValue='30000'
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>$</InputAdornment>
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Button variant='contained' startIcon={<AddIcon />}>
                  Aplicar Configuración Masiva
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Tabla de Límites Individuales */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Límites Individuales por Cliente
              </Typography>

              {/* Filtros propios de esta sección: buscador y ruta (no usan el filtro de arriba) */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  size='small'
                  placeholder='Buscar por nombre'
                  value={filtroNombreLimites}
                  onChange={(e) => setFiltroNombreLimites(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon color='action' />
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 220 }}
                />
                <FormControl size='small' sx={{ minWidth: 200 }}>
                  <InputLabel>Ruta</InputLabel>
                  <Select
                    label='Ruta'
                    value={filtros.ruta}
                    onChange={(e) => manejarCambioFiltros('ruta', e.target.value)}
                  >
                    <MenuItem value=''>Primera ruta (por defecto)</MenuItem>
                    {rutasUnicas.map((ruta) => (
                      <MenuItem key={ruta} value={ruta}>
                        {ruta}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell align='right'>Límite Actual</TableCell>
                      <TableCell align='right'>Nuevo Límite</TableCell>
                      <TableCell align='center' sx={{ minWidth: 400 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientesCreditoFiltradosLimites.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 40, height: 40 }}>
                              {cliente.nombre.charAt(0)}
                            </Avatar>
                            <Typography variant='subtitle2' fontWeight='bold'>
                              {cliente.nombre}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={cliente.ruta} size='small' variant='outlined' />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${cliente.limiteCredito.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <TextField
                            size='small'
                            type='number'
                            value={limitesEditados[cliente.id]?.limite ?? cliente.limiteCredito}
                            onChange={(e) => manejarCambioLimite(cliente.id, Number(e.target.value))}
                            InputProps={{
                              startAdornment: <InputAdornment position='start'>$</InputAdornment>
                            }}
                            sx={{ minWidth: 150 }}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                              size='small'
                              placeholder='Motivo (opcional)'
                              value={limitesEditados[cliente.id]?.motivo || ''}
                              onChange={(e) => manejarCambioMotivo(cliente.id, e.target.value)}
                              sx={{ minWidth: 180, maxWidth: 250 }}
                            />
                            <Button 
                              variant='outlined' 
                              size='small' 
                              startIcon={<EditIcon />}
                              onClick={() => actualizarLimiteCliente(cliente.id)}
                              disabled={
                                saving || 
                                !limitesEditados[cliente.id] || 
                                limitesEditados[cliente.id].limite <= 0 ||
                                (limitesEditados[cliente.id].limite === cliente.limiteCredito && !limitesEditados[cliente.id].motivo)
                              }
                            >
                              {saving ? 'Guardando...' : 'Actualizar'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component='div'
                count={totalClientes}
                page={pageClientes}
                onPageChange={(_, newPage) => {
                  setPageClientes(newPage)
                  cargarDatos(undefined, { pageClientes: newPage })
                }}
                rowsPerPage={rowsPerPageClientes}
                onRowsPerPageChange={(e) => {
                  const newRpp = parseInt(e.target.value, 10)
                  setRowsPerPageClientes(newRpp)
                  setPageClientes(0)
                  cargarDatos(undefined, { pageClientes: 0, rowsPerPageClientes: newRpp })
                }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage='Filas por página'
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
          </Card>

          {/* Historial de Cambios */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Historial de Cambios de Límites (solo primera ruta)
              </Typography>
              
              <List>
                {historialLimites.map((cambio) => (
                  <ListItem key={cambio.id}>
                    <ListItemIcon>
                      <HistoryIcon color='primary' />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {cambio.cliente}
                          </Typography>
                          <Chip 
                            label={`$${cambio.limiteAnterior.toLocaleString()} → $${cambio.limiteNuevo.toLocaleString()}`}
                            size='small'
                            color={cambio.limiteNuevo > cambio.limiteAnterior ? 'success' : 'warning'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            {cambio.motivo}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {cambio.usuario} • {formatearFecha(cambio.fecha)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <TablePagination
                component='div'
                count={totalHistorial}
                page={pageHistorial}
                onPageChange={(_, newPage) => {
                  setPageHistorial(newPage)
                  cargarDatos(undefined, { pageHistorial: newPage })
                }}
                rowsPerPage={rowsPerPageHistorial}
                onRowsPerPageChange={(e) => {
                  const newRpp = parseInt(e.target.value, 10)
                  setRowsPerPageHistorial(newRpp)
                  setPageHistorial(0)
                  cargarDatos(undefined, { pageHistorial: 0, rowsPerPageHistorial: newRpp })
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage='Filas por página'
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Vista de Pagos Pendientes de Autorización */}
      {vistaActual === 'pagos-pendientes' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Pagos Pendientes de Autorización
          </Typography>
          
          <Card>
            <CardContent>
              {/* Buscador y filtro por ruta dentro de la tabla */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  size='small'
                  placeholder='Buscar por cliente, nota o registrado por'
                  value={filtroBusquedaPagosPendientes}
                  onChange={(e) => {
                    setFiltroBusquedaPagosPendientes(e.target.value)
                    setPagePagosPendientes(0)
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon color='action' />
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 280 }}
                />
                <FormControl size='small' sx={{ minWidth: 200 }}>
                  <InputLabel>Ruta</InputLabel>
                  <Select
                    label='Ruta'
                    value={filtroRutaPagosPendientes}
                    onChange={(e) => {
                      setFiltroRutaPagosPendientes(e.target.value)
                      setPagePagosPendientes(0)
                    }}
                  >
                    <MenuItem value='todas'>Todas las rutas</MenuItem>
                    {rutasUnicas.map((ruta) => (
                      <MenuItem key={ruta} value={ruta}>
                        {ruta}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell align='right'>Monto Pagado</TableCell>
                      <TableCell>Formas de Pago</TableCell>
                      <TableCell>Registrado por</TableCell>
                      <TableCell>Fecha/Hora</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagosPendientesFiltrados
                      .slice(
                        pagePagosPendientes * rowsPerPagePagosPendientes,
                        pagePagosPendientes * rowsPerPagePagosPendientes + rowsPerPagePagosPendientes
                      )
                      .map((pago) => (
                      <TableRow key={pago.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.cliente}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.ruta}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.nota}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${pago.montoPagado.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {pago.formasPago.map((forma, index) => (
                              <Chip
                                key={index}
                                label={`${forma.metodo}: $${forma.monto.toLocaleString()}`}
                                color={getMetodoPagoColor(forma.metodo) as any}
                                size='small'
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.registradoPorNombre || pago.registradoPor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.fechaHora}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Ver detalles'>
                              <IconButton 
                                size='small' 
                                onClick={async () => {
                                  if (pago.pagoCompleto) {
                                    setPagoSeleccionadoDetalle(pago.pagoCompleto)
                                    setModalDetallePago(true)
                                    
                                    // Cargar nombres de usuarios
                                    try {
                                      if (pago.pagoCompleto.usuarioRegistro) {
                                        const usuarioReg = await usuariosAPI.getById(pago.pagoCompleto.usuarioRegistro)
                                        setUsuarioRegistroNombre(`${usuarioReg.nombres} ${usuarioReg.apellidoPaterno}`)
                                      }
                                      if (pago.pagoCompleto.usuarioAutorizacion) {
                                        const usuarioAut = await usuariosAPI.getById(pago.pagoCompleto.usuarioAutorizacion)
                                        setUsuarioAutorizacionNombre(`${usuarioAut.nombres} ${usuarioAut.apellidoPaterno}`)
                                      }
                                    } catch (err) {
                                      console.error('Error al cargar información de usuarios:', err)
                                      setUsuarioRegistroNombre(pago.pagoCompleto.usuarioRegistro)
                                      if (pago.pagoCompleto.usuarioAutorizacion) {
                                        setUsuarioAutorizacionNombre(pago.pagoCompleto.usuarioAutorizacion)
                                      }
                                    }
                                  }
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Autorizar'>
                              <IconButton size='small' color='success' onClick={() => autorizarPago(pago.id)}>
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Rechazar'>
                              <IconButton size='small' color='error' onClick={() => rechazarPago(pago.id)}>
                                <CloseIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component='div'
                count={pagosPendientesFiltrados.length}
                page={pagePagosPendientes}
                onPageChange={(_, newPage) => setPagePagosPendientes(newPage)}
                rowsPerPage={rowsPerPagePagosPendientes}
                onRowsPerPageChange={(e) => {
                  setRowsPerPagePagosPendientes(parseInt(e.target.value, 10))
                  setPagePagosPendientes(0)
                }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage='Filas por página'
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Vista de Historial de Pagos */}
      {vistaActual === 'historial-pagos' && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Historial de Pagos
          </Typography>
          
          <Card>
            <CardContent>
              {/* Buscador, filtro por ruta (incl. Todas las rutas) y por fechas (por defecto hoy) */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
                <TextField
                  size='small'
                  placeholder='Buscar por cliente o nota'
                  value={filtroBusquedaHistorialPagos}
                  onChange={(e) => {
                    setFiltroBusquedaHistorialPagos(e.target.value)
                    setPageHistorialPagos(0)
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon color='action' />
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 260 }}
                />
                <FormControl size='small' sx={{ minWidth: 200 }}>
                  <InputLabel>Ruta</InputLabel>
                  <Select
                    label='Ruta'
                    value={filtroRutaHistorialPagos}
                    onChange={(e) => {
                      setFiltroRutaHistorialPagos(e.target.value)
                      setPageHistorialPagos(0)
                    }}
                  >
                    <MenuItem value='todas'>Todas las rutas</MenuItem>
                    {rutasUnicas.map((ruta) => (
                      <MenuItem key={ruta} value={ruta}>
                        {ruta}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size='small'
                  label='Fecha desde'
                  type='date'
                  value={fechaDesdeHistorialPagos}
                  onChange={(e) => {
                    setFechaDesdeHistorialPagos(e.target.value)
                    setPageHistorialPagos(0)
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  size='small'
                  label='Fecha hasta'
                  type='date'
                  value={fechaHastaHistorialPagos}
                  onChange={(e) => {
                    setFechaHastaHistorialPagos(e.target.value)
                    setPageHistorialPagos(0)
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 160 }}
                />
              </Box>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha/Hora</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell align='right'>Monto Total</TableCell>
                      <TableCell>Formas de Pago</TableCell>
                      <TableCell>Registrado por</TableCell>
                      <TableCell>Autorizado por</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historialPagosFiltrado
                      .slice(
                        pageHistorialPagos * rowsPerPageHistorialPagos,
                        pageHistorialPagos * rowsPerPageHistorialPagos + rowsPerPageHistorialPagos
                      )
                      .map((pago) => (
                      <TableRow key={pago.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {formatearFecha(pago.fechaPago)}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {pago.horaPago}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.cliente ? `${pago.cliente.nombre} ${pago.cliente.apellidoPaterno} ${pago.cliente.apellidoMaterno}` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {pago.notaCredito?.numeroNota || 'Abono general'}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            ${pago.montoTotal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {pago.formasPago.map((forma, index) => {
                              const metodoLabel = forma.metodo ?? (forma as any).formaPago?.nombre ?? (forma as any).formaPago?.tipo ?? 'Otro'
                              return (
                                <Chip
                                  key={index}
                                  label={`${metodoLabel}: $${forma.monto.toLocaleString()}`}
                                  color={getMetodoPagoColor(metodoLabel) as any}
                                  size='small'
                                />
                              )
                            })}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.usuarioRegistro
                              ? (usuariosNombresMapHistorial.get(pago.usuarioRegistro) || pago.usuarioRegistro)
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {pago.usuarioAutorizacion
                              ? (usuariosNombresMapHistorial.get(pago.usuarioAutorizacion) || pago.usuarioAutorizacion)
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={pago.estado.toUpperCase()}
                            color={
                              pago.estado === 'autorizado' ? 'success' :
                              pago.estado === 'pendiente' ? 'warning' : 'error'
                            }
                            size='small'
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component='div'
                count={historialPagosFiltrado.length}
                page={pageHistorialPagos}
                onPageChange={(_, newPage) => setPageHistorialPagos(newPage)}
                rowsPerPage={rowsPerPageHistorialPagos}
                onRowsPerPageChange={(e) => {
                  setRowsPerPageHistorialPagos(parseInt(e.target.value, 10))
                  setPageHistorialPagos(0)
                }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage='Filas por página'
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Modales */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth='sm' fullWidth>
        <DialogTitle>
          {tipoDialogo === 'modificar-limite' && 'Modificar Límite de Crédito'}
          {tipoDialogo === 'bloquear' && 'Bloquear Crédito'}
          {tipoDialogo === 'estado-cuenta' && 'Generar Estado de Cuenta'}
          {tipoDialogo === 'registrar-pago' && 'Registrar Pago'}
          {tipoDialogo === 'registrar-abono' && 'Registrar Abono General'}
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='h6' gutterBottom>
                Cliente: {clienteSeleccionado.nombre}
              </Typography>
              
              {tipoDialogo === 'modificar-limite' && (
                <Box>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Límite actual: ${clienteSeleccionado.limiteCredito.toLocaleString()}
                  </Typography>
                  <TextField
                    fullWidth
                    label='Nuevo Límite de Crédito'
                    type='number'
                    value={nuevoLimite}
                    onChange={(e) => setNuevoLimite(Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    fullWidth
                    label='Motivo del Cambio'
                    multiline
                    rows={3}
                    value={motivoLimite}
                    onChange={(e) => setMotivoLimite(e.target.value)}
                    sx={{ mt: 2 }}
                    required
                  />
                </Box>
              )}
              
              {tipoDialogo === 'bloquear' && (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  <AlertTitle>Advertencia</AlertTitle>
                  Esta acción bloqueará el crédito del cliente inmediatamente.
                </Alert>
              )}
              
              {tipoDialogo === 'estado-cuenta' && (
                <Box>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Se generará un estado de cuenta detallado para este cliente (imprimir o ver en nueva pestaña).
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Formato</InputLabel>
                    <Select
                      label='Formato'
                      value={formatoEstadoCuenta}
                      onChange={(e) => setFormatoEstadoCuenta(e.target.value as 'pdf' | 'excel')}
                    >
                      <MenuItem value='pdf'>PDF (imprimir)</MenuItem>
                      <MenuItem value='excel'>Ver en pantalla</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {(tipoDialogo === 'registrar-pago' || tipoDialogo === 'registrar-abono') && (
                <Box>
                  {notaSeleccionada && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant='h6' gutterBottom>
                        Nota a Pagar: {notaSeleccionada.numeroNota}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Importe de la nota: ${notaSeleccionada.importe.toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant='h6' gutterBottom>
                    Formas de Pago
                  </Typography>

                  {formasPago.map((forma, index) => (
                    <Card key={forma.id} variant='outlined' sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems='center'>
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                              <InputLabel>Método</InputLabel>
                              <Select
                                value={forma.metodo}
                                onChange={(e) => actualizarFormaPago(forma.id, 'metodo', e.target.value)}
                                label='Método'
                              >
                                {formasPagoDisponibles
                                  .filter(fp => fp.tipo !== 'credito')
                                  .map(fp => (
                                  <MenuItem key={fp.id} value={fp.tipo}>
                                    {fp.nombre}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label='Monto'
                              type='number'
                              value={forma.monto}
                              onChange={(e) => actualizarFormaPago(forma.id, 'monto', Number(e.target.value))}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>$</InputAdornment>
                              }}
                            />
                          </Grid>
                          {['transferencia', 'cheque', 'deposito', 'terminal'].includes(forma.metodo) && (
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label='Folio / Referencia *'
                                value={forma.referencia || ''}
                                onChange={(e) => actualizarFormaPago(forma.id, 'referencia', e.target.value)}
                                error={!forma.referencia || forma.referencia.trim() === ''}
                              />
                            </Grid>
                          )}
                          {['transferencia', 'cheque', 'deposito'].includes(forma.metodo) && (
                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                label='Banco'
                                value={forma.banco || ''}
                                onChange={(e) => actualizarFormaPago(forma.id, 'banco', e.target.value)}
                              />
                            </Grid>
                          )}
                          <Grid item xs={12} sm={1}>
                            <IconButton 
                              color='error' 
                              onClick={() => eliminarFormaPago(forma.id)}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  <Button 
                    variant='outlined' 
                    startIcon={<AddIcon />}
                    onClick={agregarFormaPago}
                    sx={{ mb: 2 }}
                  >
                    Agregar otra forma de pago
                  </Button>

                  <Card sx={{ bgcolor: 'success.light', mb: 2 }}>
                    <CardContent>
                      <Typography variant='h6' gutterBottom>
                        Resumen del Pago
                      </Typography>
                      <Typography variant='h4' color='primary'>
                        Total a pagar: ${totalPago.toLocaleString()}
                      </Typography>
                      {notaSeleccionada && (
                        <Typography variant='body2' color='text.secondary'>
                          Faltante: ${(notaSeleccionada.importe - totalPago).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  <TextField
                    fullWidth
                    label='Observaciones'
                    multiline
                    rows={3}
                    value={observacionesPago}
                    onChange={(e) => setObservacionesPago(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder='Observaciones sobre el pago...'
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            variant='contained' 
            color={tipoDialogo === 'bloquear' ? 'error' : 'primary'}
            onClick={() => {
              if (tipoDialogo === 'modificar-limite') {
                guardarLimiteCredito()
              } else if (tipoDialogo === 'bloquear') {
                guardarBloquearCredito()
              } else if (tipoDialogo === 'estado-cuenta') {
                generarEstadoCuenta()
              } else if (tipoDialogo === 'registrar-pago' || tipoDialogo === 'registrar-abono') {
                registrarPago()
              }
            }}
            disabled={saving}
          >
            {saving ? 'Guardando...' : (
              <>
                {tipoDialogo === 'modificar-limite' && 'Actualizar Límite'}
                {tipoDialogo === 'bloquear' && 'Bloquear Crédito'}
                {tipoDialogo === 'estado-cuenta' && 'Generar Estado'}
                {tipoDialogo === 'registrar-pago' && 'Registrar Pago'}
                {tipoDialogo === 'registrar-abono' && 'Registrar Abono'}
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalles del Pago */}
      <Dialog 
        open={modalDetallePago} 
        onClose={() => {
          setModalDetallePago(false)
          setPagoSeleccionadoDetalle(null)
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon />
              <Typography variant="h6">
                Detalles del Pago
              </Typography>
            </Box>
            <IconButton 
              onClick={() => {
                setModalDetallePago(false)
                setPagoSeleccionadoDetalle(null)
                setUsuarioRegistroNombre('')
                setUsuarioAutorizacionNombre('')
              }} 
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {pagoSeleccionadoDetalle && (
            <Box sx={{ mt: 2 }}>
              {/* Información del Cliente */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    Información del Cliente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {pagoSeleccionadoDetalle.cliente 
                          ? `${pagoSeleccionadoDetalle.cliente.nombre} ${pagoSeleccionadoDetalle.cliente.apellidoPaterno} ${pagoSeleccionadoDetalle.cliente.apellidoMaterno}`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Teléfono
                      </Typography>
                      <Typography variant="body1">
                        {pagoSeleccionadoDetalle.cliente?.telefono || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Información del Pago */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon />
                    Información del Pago
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Número de Nota
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {pagoSeleccionadoDetalle.notaCredito?.numeroNota || 'Abono general'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tipo de Pago
                      </Typography>
                      <Chip
                        label={pagoSeleccionadoDetalle.tipo === 'nota_especifica' ? 'Nota Específica' : 'Abono General'}
                        color={pagoSeleccionadoDetalle.tipo === 'nota_especifica' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Monto Total
                      </Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        ${pagoSeleccionadoDetalle.montoTotal.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estado
                      </Typography>
                      <Chip
                        label={pagoSeleccionadoDetalle.estado.toUpperCase()}
                        color={
                          pagoSeleccionadoDetalle.estado === 'autorizado' ? 'success' :
                          pagoSeleccionadoDetalle.estado === 'pendiente' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Pago
                      </Typography>
                      <Typography variant="body1">
                        {new Date(pagoSeleccionadoDetalle.fechaPago).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'America/Mexico_City'
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Hora de Pago
                      </Typography>
                      <Typography variant="body1">
                        {pagoSeleccionadoDetalle.horaPago}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Formas de Pago */}
              {pagoSeleccionadoDetalle.formasPago && pagoSeleccionadoDetalle.formasPago.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoneyIcon />
                      Formas de Pago
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Método</TableCell>
                            <TableCell align="right">Monto</TableCell>
                            <TableCell>Referencia</TableCell>
                            <TableCell>Banco</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pagoSeleccionadoDetalle.formasPago.map((forma, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Chip
                                  label={forma.formaPago?.nombre || forma.formaPago?.tipo || 'N/A'}
                                  color={getMetodoPagoColor(forma.formaPago?.tipo || 'efectivo') as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight="bold">
                                  ${forma.monto.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {forma.referencia || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {forma.banco || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Información de Registro */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon />
                    Información de Registro
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Registrado por
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {usuarioRegistroNombre || pagoSeleccionadoDetalle.usuarioRegistro || 'N/A'}
                      </Typography>
                    </Grid>
                    {pagoSeleccionadoDetalle.usuarioAutorizacion && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Autorizado por
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {usuarioAutorizacionNombre || pagoSeleccionadoDetalle.usuarioAutorizacion}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Creación
                      </Typography>
                      <Typography variant="body1">
                        {new Date(pagoSeleccionadoDetalle.fechaCreacion).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Última Modificación
                      </Typography>
                      <Typography variant="body1">
                        {new Date(pagoSeleccionadoDetalle.fechaModificacion).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Observaciones */}
              {pagoSeleccionadoDetalle.observaciones && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pagoSeleccionadoDetalle.observaciones}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setModalDetallePago(false)
              setPagoSeleccionadoDetalle(null)
              setUsuarioRegistroNombre('')
              setUsuarioAutorizacionNombre('')
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vista de Clientes Duplicados */}
      {vistaActual === 'clientes-duplicados' && (
        <Box>
          <Typography variant="h6" gutterBottom>Unificación de Clientes Duplicados</Typography>
          {loadingDuplicados ? <LinearProgress /> : clientesDuplicados.length === 0 ? (
            <Alert severity="info">No se encontraron clientes duplicados (por tener nombre y apellidos idénticos).</Alert>
          ) : (
            <Box>
              <Grid container spacing={3}>
                {clientesDuplicados
                  .slice(pageDuplicados * rowsPerPageDuplicados, pageDuplicados * rowsPerPageDuplicados + rowsPerPageDuplicados)
                  .map((grupo, idxLocal) => {
                  const idx = pageDuplicados * rowsPerPageDuplicados + idxLocal;
                  const pId = principalSel[idx] || grupo[0].id;
                  const secIds = grupo.filter(c => c.id !== pId).map(c => c.id);
                  return (
                    <Grid item xs={12} key={idx}>
                      <Card sx={{ border: '2px solid #ed6c02' }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Grupo {idx + 1}: {grupo[0].nombre} {grupo[0].apellidoPaterno} {grupo[0].apellidoMaterno}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Seleccione LA CUENTA PRINCIPAL a conservar (las demás se unificarán a ésta y desaparecerán).
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            {grupo.map(cliente => (
                              <Box key={cliente.id} sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, bgcolor: pId === cliente.id ? '#fcf0e3' : 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Radio
                                  checked={pId === cliente.id}
                                  onChange={() => setPrincipalSel(prev => ({ ...prev, [idx]: cliente.id }))}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Typography fontWeight="bold">Email: {cliente.email || 'N/A'}</Typography>
                                  <Typography variant="body2">Tel: {cliente.telefono || 'N/A'} · Domicilio: {cliente.calle} {cliente.numeroExterior}</Typography>
                                  <Typography variant="body2" color="error" fontWeight="bold">Saldo: ${cliente.saldoActual.toLocaleString()}</Typography>
                                </Box>
                                <Chip label={pId === cliente.id ? "Principal" : "A unificar"} color={pId === cliente.id ? "primary" : "default"} />
                              </Box>
                            ))}
                          </Box>
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" color="warning" onClick={() => manejarUnificar(idx, pId, secIds)}>
                              Unificar seleccionados
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
              <TablePagination
                component="div"
                count={clientesDuplicados.length}
                page={pageDuplicados}
                onPageChange={(_, newPage) => setPageDuplicados(newPage)}
                rowsPerPage={rowsPerPageDuplicados}
                onRowsPerPageChange={(e) => {
                  setRowsPerPageDuplicados(parseInt(e.target.value, 10));
                  setPageDuplicados(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Grupos por página"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

