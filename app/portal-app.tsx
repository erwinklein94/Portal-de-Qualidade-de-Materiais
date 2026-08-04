"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  PackageCheck,
  Pencil,
  Plus,
  CheckCircle2,
  CircleDot,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type TeamRole = "editor" | "analyst" | "coordinator" | "viewer";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
type UserKind = "team" | "supplier";
type ThemeMode = "light" | "dark";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  user_kind: UserKind;
  team_role: TeamRole | null;
  supplier_id: string | null;
  area_id: string | null;
  is_active: boolean;
  must_change_password: boolean;
};

type MaterialArea = {
  id: string;
  code: string;
  name: string;
  description: string;
  accent_color: string;
};

type Supplier = {
  id: string;
  trade_name: string;
  legal_name: string;
  area_id: string;
  status: string;
};

type QualityRecord = {
  id: string;
  reference_date: string;
  reference_week: number;
  status: string;
  supplier_id: string;
  area_id: string;
  updated_at: string;
  payload: Record<string, unknown>;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type MaterialQualityPayload = {
  order_number: string;
  total_order_volume: number;
  inspected_volume: number;
  rejected_volume: number;
  released_stock_volume: number;
};

type QualityChartDatum = {
  label: string;
  value: number;
};

type QualityChartConfig = {
  id: string;
  title: string;
  subtitle: string;
  unit: "pieces" | "percent";
  kind: "ranked-bar" | "trend" | "progress" | "donut";
  color: string;
  secondaryColor?: string;
  data: QualityChartDatum[];
};

const roleLabels: Record<TeamRole, string> = {
  editor: "Editor",
  analyst: "Analista",
  coordinator: "Coordenador",
  viewer: "Consulta",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  submitted: "Aguardando análise",
  under_review: "Em análise",
  approved: "Aprovado",
  rejected: "Reprovado",
};

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand-lockup ${inverse ? "brand-lockup--inverse" : ""}`}>
      <img src={`${basePath}/rumo-logo.png`} alt="Rumo" />
      <span>Qualidade de Materiais</span>
    </div>
  );
}

function LoginScreen() {
  const [accessType, setAccessType] = useState<UserKind>("team");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setError("Não foi possível entrar. Confira seu e-mail e senha.");
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Apresentação do portal">
        <div className="login-story__pattern" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
        <Logo inverse />
        <div className="login-story__content">
          <p className="eyebrow eyebrow--light">SOMOS O BRASIL EM MOVIMENTO</p>
          <h1>Qualidade que move<br />cada entrega.</h1>
          <p>
            Um ambiente único para conectar fornecedores e equipes Rumo, acompanhar
            conformidade e transformar informações em decisões seguras.
          </p>
          <div className="login-points">
            <div><ShieldCheck size={22} /><span>Dados protegidos por perfil</span></div>
            <div><Gauge size={22} /><span>Visão clara dos indicadores</span></div>
            <div><PackageCheck size={22} /><span>Rastreabilidade dos materiais</span></div>
          </div>
        </div>
        <small>Movimentamos o Brasil com eficiência e segurança.</small>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-logo"><Logo /></div>
          <p className="eyebrow">PORTAL DE QUALIDADE</p>
          <h2>Bem-vindo de volta</h2>
          <p className="muted">Entre com as credenciais fornecidas pela equipe Rumo.</p>

          <div className="access-switch" role="tablist" aria-label="Tipo de acesso">
            <button
              type="button"
              className={accessType === "team" ? "active" : ""}
              onClick={() => setAccessType("team")}
            >
              <Building2 size={18} /> Equipe Rumo
            </button>
            <button
              type="button"
              className={accessType === "supplier" ? "active" : ""}
              onClick={() => setAccessType("supplier")}
            >
              <Boxes size={18} /> Fornecedor
            </button>
          </div>

          <form onSubmit={signIn} className="login-form">
            <label>
              E-mail corporativo
              <input
                type="email"
                required
                autoComplete="email"
                placeholder={accessType === "team" ? "nome@rumolog.com" : "nome@fornecedor.com"}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Senha
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            {accessType === "supplier" && (
              <div className="supplier-note">
                Seu acesso direciona automaticamente para a área e empresa cadastradas.
              </div>
            )}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no portal"}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>
          <p className="login-help">
            Problemas com o acesso? Procure o responsável Rumo pela sua área.
          </p>
        </div>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-page">
      <Logo />
      <div className="loading-track"><span /></div>
      <p>Preparando seu ambiente de qualidade…</p>
    </main>
  );
}

function PortalShell({ session, profile }: { session: Session; profile: Profile }) {
  const [menuOpen, setMenuOpen] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [activeArea, setActiveArea] = useState<string | null>(profile.area_id);
  const [areaMode, setAreaMode] = useState<"dashboard" | "records">("dashboard");
  const [areas, setAreas] = useState<MaterialArea[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [accounts, setAccounts] = useState<Profile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("");
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [presentationMode, setPresentationMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isTeam = profile.user_kind === "team";
  const canCreateAccounts =
    isTeam && (profile.team_role === "editor" || profile.team_role === "coordinator");
  const canEditAccounts =
    isTeam && ["editor", "analyst", "coordinator"].includes(profile.team_role ?? "");
  const canReviewRecords =
    isTeam && ["editor", "analyst", "coordinator"].includes(profile.team_role ?? "");

  const loadData = useCallback(async () => {
    setDataLoading(true);
    let areasQuery = supabase.from("material_areas").select("*").order("sort_order");
    let suppliersQuery = supabase.from("suppliers").select("id, trade_name, legal_name, area_id, status").order("trade_name");
    let recordsQuery = supabase.from("quality_records").select("id, reference_date, reference_week, status, supplier_id, area_id, updated_at, payload, review_notes, reviewed_by, reviewed_at").order("updated_at", { ascending: false }).limit(1000);

    if (!isTeam) {
      if (profile.area_id) {
        areasQuery = areasQuery.eq("id", profile.area_id);
        suppliersQuery = suppliersQuery.eq("area_id", profile.area_id);
        recordsQuery = recordsQuery.eq("area_id", profile.area_id);
      }
      if (profile.supplier_id) {
        suppliersQuery = suppliersQuery.eq("id", profile.supplier_id);
        recordsQuery = recordsQuery.eq("supplier_id", profile.supplier_id);
      }
    }

    const [areasResult, suppliersResult, recordsResult, accountsResult] = await Promise.all([
      areasQuery,
      suppliersQuery,
      recordsQuery,
      isTeam
        ? supabase.from("profiles").select("id, full_name, email, user_kind, team_role, supplier_id, area_id, is_active, must_change_password").order("full_name")
        : Promise.resolve({ data: [] as Profile[] }),
    ]);
    setAreas((areasResult.data as MaterialArea[]) ?? []);
    setSuppliers((suppliersResult.data as Supplier[]) ?? []);
    setRecords((recordsResult.data as QualityRecord[]) ?? []);
    setAccounts((accountsResult.data as Profile[]) ?? []);
    setDataLoading(false);
  }, [isTeam, profile.area_id, profile.supplier_id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("rumo-portal-theme");
    if (savedTheme === "dark") setTheme("dark");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rumo-portal-theme", theme);
  }, [theme]);

  useEffect(() => {
    const syncFullscreen = () => {
      if (!document.fullscreenElement) setPresentationMode(false);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  function selectArea(areaId: string, mode: "dashboard" | "records") {
    setActiveArea(areaId);
    setAreaMode(mode);
    setActiveView("area");
    if (window.innerWidth < 900) setMenuOpen(false);
  }

  const selectedArea = areas.find((area) => area.id === activeArea) ?? areas[0];
  const areaSuppliers = suppliers.filter((supplier) => !selectedArea || supplier.area_id === selectedArea.id);
  const filteredRecords = records.filter((record) => {
    if (selectedArea && record.area_id !== selectedArea.id) return false;
    if (supplierFilter && record.supplier_id !== supplierFilter) return false;
    if (dateFilter && record.reference_date !== dateFilter) return false;
    if (weekFilter && String(record.reference_week) !== weekFilter) return false;
    return true;
  });

  const approved = records.filter((record) => record.status === "approved").length;
  const pending = records.filter((record) => ["submitted", "under_review"].includes(record.status)).length;
  const recentUpdates = useMemo(
    () => [...records].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10),
    [records],
  );

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  async function togglePresentation() {
    if (presentationMode) {
      setPresentationMode(false);
      if (document.fullscreenElement) await document.exitFullscreen();
      return;
    }

    setMenuOpen(false);
    setPresentationMode(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      notify("O navegador bloqueou a tela cheia, mas o layout de apresentação foi ativado.");
    }
  }

  const hasPresentation = isTeam && activeView === "area" && areaMode === "dashboard";

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [notificationsOpen]);

  function openNotification(record: QualityRecord) {
    setSupplierFilter(isTeam ? record.supplier_id : "");
    setDateFilter(record.reference_date);
    setWeekFilter("");
    selectArea(record.area_id, "records");
    setNotificationsOpen(false);
  }

  return (
    <div className={`portal theme-${theme} ${menuOpen ? "menu-open" : "menu-closed"} ${presentationMode ? "presentation-mode" : ""}`}>
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar-head">
          <Logo inverse />
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <nav>
          {isTeam && (
            <button className={activeView === "overview" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("overview")}>
              <Gauge size={19} /><span>Visão geral</span>
            </button>
          )}
          <div className="nav-label">ÁREAS DE MATERIAIS</div>
          {(isTeam ? areas : areas.filter((area) => area.id === profile.area_id)).map((area) => (
            <div className="area-nav" key={area.id}>
              <button className={activeView === "area" && activeArea === area.id ? "nav-item active" : "nav-item"} onClick={() => selectArea(area.id, "dashboard")}>
                <span className="area-dot" style={{ background: area.accent_color }} />
                <span>{area.name}</span><ChevronDown size={15} />
              </button>
              <div className="area-subnav">
                <button onClick={() => selectArea(area.id, "dashboard")}><BarChart3 size={15} /> Dashboard</button>
                <button onClick={() => selectArea(area.id, "records")}><ClipboardCheck size={15} /> Registros</button>
              </div>
            </div>
          ))}
          {isTeam && (
            <>
              <div className="nav-label">ADMINISTRAÇÃO</div>
              <button className={activeView === "accounts" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("accounts")}>
                <Users size={19} /><span>Contas e acessos</span>
              </button>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-avatar">{profile.full_name.slice(0, 2).toUpperCase()}</div>
          <div><strong>{profile.full_name}</strong><span>{profile.team_role ? roleLabels[profile.team_role] : "Fornecedor"}</span></div>
          <button className="icon-button" onClick={() => supabase.auth.signOut()} aria-label="Sair"><LogOut size={18} /></button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu"><Menu /></button>
          <div className="breadcrumb"><span>Qualidade de Materiais</span><ChevronRight size={15} /> <strong>{activeView === "overview" ? "Visão geral" : activeView === "accounts" ? "Contas e acessos" : selectedArea?.name ?? "Área"}</strong></div>
          <div className="topbar-actions">
            {hasPresentation && <button className="topbar-control presentation-button" onClick={() => void togglePresentation()}><Maximize2 size={16} /><span>Modo apresentação</span></button>}
            <button className="topbar-control theme-button" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === "light" ? "Tema escuro" : "Tema claro"}</span></button>
            <button className="icon-button notification" aria-label="Abrir atualizações recentes" aria-haspopup="dialog" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(true)}><Bell size={20} />{recentUpdates.length > 0 && <span className="notification-badge">{recentUpdates.length}</span>}</button>
            <div className="topbar-profile"><span>{profile.full_name.slice(0, 2).toUpperCase()}</span><div><strong>{profile.full_name}</strong><small>{profile.email}</small></div></div>
          </div>
        </header>

        {notificationsOpen && (
          <div className="notifications-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNotificationsOpen(false); }}>
            <section className="notifications-modal" role="dialog" aria-modal="true" aria-labelledby="notifications-title">
              <div className="notifications-modal__heading">
                <div className="notifications-modal__icon"><Bell size={20} /></div>
                <div><p className="eyebrow">ATUALIZAÇÕES RECENTES</p><h2 id="notifications-title">Últimas ocorrências</h2><p>Os 10 registros mais recentes enviados ou atualizados pelos fornecedores.</p></div>
                <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Fechar atualizações"><X size={18} /></button>
              </div>
              <div className="notifications-list">
                {recentUpdates.length ? recentUpdates.map((record) => {
                  const supplier = suppliers.find((item) => item.id === record.supplier_id);
                  const area = areas.find((item) => item.id === record.area_id);
                  return (
                    <button type="button" className="notification-item" key={record.id} onClick={() => openNotification(record)}>
                      <span className="notification-item__marker" style={{ "--notification-accent": area?.accent_color ?? "var(--rumo-cyan)" } as React.CSSProperties}><ClipboardCheck size={17} /></span>
                      <span className="notification-item__content">
                        <strong>{supplier?.trade_name ?? "Fornecedor"}</strong>
                        <span>{area?.name ?? "Área de materiais"} · Pedido {String(record.payload?.order_number ?? "não informado")}</span>
                        <small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(record.updated_at))}</small>
                      </span>
                      <span className="notification-item__action"><span className={`record-status record-status--${record.status}`}>{statusLabels[record.status] ?? record.status}</span><ChevronRight size={17} /></span>
                    </button>
                  );
                }) : <div className="notifications-empty"><Bell size={25} /><strong>Nenhuma atualização disponível</strong><span>Os registros enviados pelos fornecedores aparecerão aqui.</span></div>}
              </div>
            </section>
          </div>
        )}

        <main className="content">
          {activeView === "overview" && isTeam && (
            <Overview areas={areas} records={records} suppliers={suppliers} approved={approved} pending={pending} loading={dataLoading} onArea={selectArea} />
          )}
          {activeView === "area" && selectedArea && (
            <AreaWorkspace
              area={selectedArea}
              mode={areaMode}
              setMode={setAreaMode}
              suppliers={areaSuppliers}
              records={filteredRecords}
              supplierFilter={supplierFilter}
              setSupplierFilter={setSupplierFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              weekFilter={weekFilter}
              setWeekFilter={setWeekFilter}
              isTeam={isTeam}
              canReview={canReviewRecords}
              currentUserId={session.user.id}
              currentSupplierId={profile.supplier_id}
              onRecordCreated={() => { void loadData(); notify("Registro enviado para a equipe Rumo com sucesso."); }}
              onRecordReviewed={() => { void loadData(); notify("Status do registro atualizado com sucesso."); }}
            />
          )}
          {activeView === "accounts" && isTeam && (
            <AccountsPage
              areas={areas}
              suppliers={suppliers}
              accounts={accounts}
              currentUserId={profile.id}
              canCreate={canCreateAccounts}
              canEdit={canEditAccounts}
              onChanged={() => { void loadData(); notify("Contas atualizadas com sucesso."); }}
              onExamplesActivated={() => { void loadData(); notify("Exemplos de todas as áreas ativados."); }}
            />
          )}
        </main>
      </div>
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}
      {presentationMode && <div className="presentation-toolbar"><div><BarChart3 size={17} /><span>Apresentação: {selectedArea?.name}</span></div><button onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} aria-label="Alternar tema">{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button><button onClick={() => void togglePresentation()}><Minimize2 size={16} /><span>Sair da apresentação</span></button></div>}
      {toast && <div className="toast"><FileCheck2 size={19} />{toast}</div>}
    </div>
  );
}

function Overview({ areas, records, suppliers, approved, pending, loading, onArea }: {
  areas: MaterialArea[]; records: QualityRecord[]; suppliers: Supplier[]; approved: number; pending: number; loading: boolean;
  onArea: (areaId: string, mode: "dashboard" | "records") => void;
}) {
  const compliance = records.length ? Math.round((approved / records.length) * 100) : 0;
  return (
    <>
      <section className="page-heading">
        <div><p className="eyebrow">PAINEL INTEGRADO</p><h1>Visão geral da qualidade</h1><p>Acompanhe o fluxo de informações dos fornecedores em todas as áreas.</p></div>
        <div className="heading-date"><CalendarDays size={19} /><div><span>Atualizado hoje</span><strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())}</strong></div></div>
      </section>

      <section className="metric-grid">
        <Metric label="Fornecedores ativos" value={String(suppliers.filter((item) => item.status === "active").length)} detail="Em 5 áreas de materiais" color="blue" icon={<Building2 />} />
        <Metric label="Registros recebidos" value={String(records.length)} detail="Total disponível no portal" color="cyan" icon={<ClipboardCheck />} />
        <Metric label="Aguardando análise" value={String(pending)} detail="Itens que pedem atenção" color="orange" icon={<Search />} />
        <Metric label="Índice de aprovação" value={`${compliance}%`} detail="Registros aprovados" color="green" icon={<ShieldCheck />} />
      </section>

      <section className="section-block">
        <div className="section-title"><div><p className="eyebrow">ÁREAS MONITORADAS</p><h2>Qualidade por material</h2></div><span className="section-help">Selecione uma área para ver os detalhes</span></div>
        <div className="area-card-grid">
          {areas.map((area) => {
            const areaRecords = records.filter((record) => record.area_id === area.id);
            const areaSupplierCount = suppliers.filter((supplier) => supplier.area_id === area.id).length;
            return (
              <button className="area-card" key={area.id} onClick={() => onArea(area.id, "dashboard")}>
                <span className="area-card__bar" style={{ background: area.accent_color }} />
                <div className="area-card__icon" style={{ color: area.accent_color, background: `${area.accent_color}18` }}><Boxes /></div>
                <div><h3>{area.name}</h3><p>{area.description}</p></div>
                <div className="area-card__stats"><span><strong>{areaSupplierCount}</strong> fornecedores</span><span><strong>{areaRecords.length}</strong> registros</span></div>
                <span className="area-card__link">Abrir área <ChevronRight size={16} /></span>
              </button>
            );
          })}
          {loading && <div className="loading-card">Carregando áreas…</div>}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value, detail, color, icon }: { label: string; value: string; detail: string; color: string; icon: React.ReactNode }) {
  return <article className={`metric metric--${color}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function AreaWorkspace({ area, mode, setMode, suppliers, records, supplierFilter, setSupplierFilter, dateFilter, setDateFilter, weekFilter, setWeekFilter, isTeam, canReview, currentUserId, currentSupplierId, onRecordCreated, onRecordReviewed }: {
  area: MaterialArea; mode: "dashboard" | "records"; setMode: (mode: "dashboard" | "records") => void; suppliers: Supplier[]; records: QualityRecord[];
  supplierFilter: string; setSupplierFilter: (value: string) => void; dateFilter: string; setDateFilter: (value: string) => void; weekFilter: string; setWeekFilter: (value: string) => void; isTeam: boolean; canReview: boolean;
  currentUserId: string; currentSupplierId: string | null; onRecordCreated: () => void; onRecordReviewed: () => void;
}) {
  const openNewRecord = () => {
    setMode("records");
    window.setTimeout(() => document.getElementById("material-record-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  return (
    <>
      <section className="area-hero" style={{ "--area-accent": area.accent_color } as React.CSSProperties}>
        <div><p className="eyebrow">ÁREA DE MATERIAL</p><h1>{area.name}</h1><p>{area.description}</p></div>
        {!isTeam && <button className="primary-button primary-button--compact" onClick={openNewRecord}><Plus size={18} /> Novo registro</button>}
      </section>
      <div className="view-tabs">
        <button className={mode === "dashboard" ? "active" : ""} onClick={() => setMode("dashboard")}><BarChart3 size={17} /> Dashboard</button>
        <button className={mode === "records" ? "active" : ""} onClick={() => setMode("records")}><ClipboardCheck size={17} /> Registros</button>
      </div>
      <section className="filter-bar">
        <div className="filter-title"><SlidersHorizontal size={18} /><span>Filtros</span></div>
        {isTeam && <label>Fornecedor<select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}><option value="">Todos os fornecedores</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.trade_name}</option>)}</select></label>}
        <label>Data<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
        <label>Semana<select value={weekFilter} onChange={(event) => setWeekFilter(event.target.value)}><option value="">Todas as semanas</option>{Array.from({ length: 53 }, (_, index) => index + 1).map((week) => <option value={week} key={week}>Semana {week}</option>)}</select></label>
        <button className="text-button" onClick={() => { setSupplierFilter(""); setDateFilter(""); setWeekFilter(""); }}>Limpar filtros</button>
      </section>
      {mode === "dashboard" ? (
        <MaterialQualityDashboard records={records.filter((record) => record.status === "approved")} suppliers={suppliers} />
      ) : (
        <>
          {!isTeam && currentSupplierId && <MaterialQualityRecordForm area={area} supplierId={currentSupplierId} currentUserId={currentUserId} onCreated={onRecordCreated} />}
          <section className="records-card">
            <div className="records-head"><div><h2>Registros de qualidade</h2><p>{records.length} registro(s) no período selecionado</p></div>{!isTeam && <button className="primary-button primary-button--compact" onClick={openNewRecord}><Plus size={18} /> Novo registro</button>}</div>
            <MaterialQualityRecordsTable records={records} suppliers={suppliers} isTeam={isTeam} canReview={canReview} currentUserId={currentUserId} onChanged={onRecordReviewed} />
          </section>
        </>
      )}
    </>
  );
}

function payloadNumber(record: QualityRecord, key: keyof Omit<MaterialQualityPayload, "order_number">) {
  const value = record.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function approvalRate(inspected: number, rejected: number) {
  if (inspected <= 0) return 0;
  return Math.max(0, Math.min(100, ((inspected - rejected) / inspected) * 100));
}

function MaterialQualityDashboard({ records, suppliers }: { records: QualityRecord[]; suppliers: Supplier[] }) {
  const [activeChart, setActiveChart] = useState<QualityChartConfig | null>(null);
  const supplierNames = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.trade_name])), [suppliers]);

  const dashboard = useMemo(() => {
    type Totals = { total: number; inspected: number; rejected: number; released: number };
    const emptyTotals = (): Totals => ({ total: 0, inspected: 0, rejected: 0, released: 0 });
    const overall = emptyTotals();
    const bySupplier = new Map<string, Totals>();
    const byWeek = new Map<string, Totals>();
    const byMonth = new Map<string, Totals>();

    for (const record of records) {
      const values = {
        total: payloadNumber(record, "total_order_volume"),
        inspected: payloadNumber(record, "inspected_volume"),
        rejected: payloadNumber(record, "rejected_volume"),
        released: payloadNumber(record, "released_stock_volume"),
      };
      overall.total += values.total;
      overall.inspected += values.inspected;
      overall.rejected += values.rejected;
      overall.released += values.released;

      const supplierTotals = bySupplier.get(record.supplier_id) ?? emptyTotals();
      supplierTotals.total += values.total;
      supplierTotals.inspected += values.inspected;
      supplierTotals.rejected += values.rejected;
      supplierTotals.released += values.released;
      bySupplier.set(record.supplier_id, supplierTotals);

      const year = record.reference_date.slice(0, 4);
      const weekKey = `${year}-S${String(record.reference_week).padStart(2, "0")}`;
      const weekTotals = byWeek.get(weekKey) ?? emptyTotals();
      weekTotals.inspected += values.inspected;
      weekTotals.rejected += values.rejected;
      byWeek.set(weekKey, weekTotals);

      const monthKey = record.reference_date.slice(0, 7);
      const monthTotals = byMonth.get(monthKey) ?? emptyTotals();
      monthTotals.inspected += values.inspected;
      monthTotals.rejected += values.rejected;
      byMonth.set(monthKey, monthTotals);
    }

    const supplierEntries = [...bySupplier.entries()].map(([supplierId, totals]) => ({
      label: supplierNames.get(supplierId) ?? "Fornecedor",
      ...totals,
    }));
    const supplierData = (selector: (totals: Totals) => number) => supplierEntries
      .map((entry) => ({ label: entry.label, value: selector(entry) }))
      .sort((a, b) => b.value - a.value);

    const weeklyApproval = [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, totals]) => ({
      label: key.replace("-S", "/S"),
      value: approvalRate(totals.inspected, totals.rejected),
    }));
    const monthlyApproval = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, totals]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        label: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1))).replace(" de ", "/"),
        value: approvalRate(totals.inspected, totals.rejected),
      };
    });

    const charts: QualityChartConfig[] = [
      { id: "inspected-supplier", title: "Peças inspecionadas por fornecedor", subtitle: "Ranking do volume inspecionado pela qualidade do fornecedor", unit: "pieces", kind: "ranked-bar", color: "#32A6E6", data: supplierData((item) => item.inspected) },
      { id: "approval-week", title: "Taxa de aprovação por semana", subtitle: "Tendência semanal do percentual aprovado", unit: "percent", kind: "trend", color: "#1E9F7F", data: weeklyApproval },
      { id: "approval-month", title: "Taxa de aprovação por mês", subtitle: "Evolução mensal do percentual de aprovação", unit: "percent", kind: "trend", color: "#7FE06C", data: monthlyApproval },
      { id: "inspection-outcome", title: "Resultado das inspeções", subtitle: "Composição do volume inspecionado entre peças aprovadas e reprovadas", unit: "pieces", kind: "donut", color: "#1E9F7F", secondaryColor: "#F78344", data: [{ label: "Aprovadas", value: Math.max(0, overall.inspected - overall.rejected) }, { label: "Reprovadas", value: overall.rejected }] },
      { id: "approval-supplier", title: "Taxa de aprovação por fornecedor", subtitle: "Comparativo percentual em escala comum de 0 a 100%", unit: "percent", kind: "progress", color: "#003865", data: supplierData((item) => approvalRate(item.inspected, item.rejected)) },
      { id: "rejected-supplier", title: "Peças reprovadas por fornecedor", subtitle: "Ranking do volume acumulado de reprovas", unit: "pieces", kind: "ranked-bar", color: "#F78344", data: supplierData((item) => item.rejected) },
      { id: "released-supplier", title: "Estoque liberado por fornecedor", subtitle: "Comparativo de peças disponíveis para transporte", unit: "pieces", kind: "ranked-bar", color: "#9F4BB9", data: supplierData((item) => item.released) },
      { id: "inspection-coverage", title: "Cobertura de inspeção por fornecedor", subtitle: "Percentual do pedido que já passou por inspeção", unit: "percent", kind: "progress", color: "#FBD300", data: supplierData((item) => item.total > 0 ? Math.min(100, (item.inspected / item.total) * 100) : 0) },
    ];

    return { overall, charts };
  }, [records, supplierNames]);

  useEffect(() => {
    if (!activeChart) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveChart(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [activeChart]);

  const formatPieces = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
  const approvedPieces = Math.max(0, dashboard.overall.inspected - dashboard.overall.rejected);

  return (
    <>
      <section className="material-kpi-grid">
        <Metric label="Peças inspecionadas" value={formatPieces(dashboard.overall.inspected)} detail="Volume acumulado no período" color="cyan" icon={<Search />} />
        <Metric label="Peças aprovadas" value={formatPieces(approvedPieces)} detail="Inspecionadas menos reprovas" color="green" icon={<ShieldCheck />} />
        <Metric label="Taxa de aprovação" value={`${approvalRate(dashboard.overall.inspected, dashboard.overall.rejected).toFixed(1)}%`} detail="Desempenho geral filtrado" color="blue" icon={<Gauge />} />
        <Metric label="Estoque liberado" value={formatPieces(dashboard.overall.released)} detail="Disponível para transporte" color="orange" icon={<PackageCheck />} />
      </section>
      <section className="quality-charts-grid">
        {dashboard.charts.map((chart) => <QualityChartCard chart={chart} key={chart.id} onOpen={() => setActiveChart(chart)} />)}
        <article className="chart-card quality-records-summary"><div className="card-heading"><div><span>Registros que compõem os indicadores</span><p>Dados filtrados enviados pelos fornecedores</p></div></div><MaterialQualityRecordsTable records={records} suppliers={suppliers} compact /></article>
      </section>
      {activeChart && <QualityChartModal chart={activeChart} onClose={() => setActiveChart(null)} />}
    </>
  );
}

function QualityChartCard({ chart, onOpen }: { chart: QualityChartConfig; onOpen: () => void }) {
  return (
    <article className="chart-card quality-chart-card" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(); }} aria-label={`Ampliar gráfico: ${chart.title}`}>
      <div className="card-heading"><div><span>{chart.title}</span><p>{chart.subtitle}</p></div><Maximize2 className="chart-expand-icon" size={17} /></div>
      <QualityChartView chart={chart} />
      <span className="chart-open-hint">Clique para ampliar</span>
    </article>
  );
}

function formatChartValue(value: number, unit: QualityChartConfig["unit"]) {
  return unit === "percent"
    ? `${value.toFixed(1)}%`
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

function QualityChartView({ chart, expanded = false }: { chart: QualityChartConfig; expanded?: boolean }) {
  if (!chart.data.length) return <EmptyState compact />;
  if (chart.kind === "trend") return <QualityTrendChart chart={chart} expanded={expanded} />;
  if (chart.kind === "donut") return <QualityDonutChart chart={chart} expanded={expanded} />;
  return <QualityHorizontalChart chart={chart} expanded={expanded} progress={chart.kind === "progress"} />;
}

function QualityHorizontalChart({ chart, expanded, progress }: { chart: QualityChartConfig; expanded: boolean; progress: boolean }) {
  const maximum = progress || chart.unit === "percent" ? 100 : Math.max(...chart.data.map((item) => item.value), 1);
  return (
    <div className={`quality-horizontal-chart ${progress ? "quality-horizontal-chart--progress" : ""} ${expanded ? "quality-horizontal-chart--expanded" : ""}`} role="img" aria-label={`${chart.title}. ${chart.data.map((item) => `${item.label}: ${formatChartValue(item.value, chart.unit)}`).join(", ")}`}>
      <div className="horizontal-chart-scale"><span>0</span><span>{formatChartValue(maximum / 2, chart.unit)}</span><span>{formatChartValue(maximum, chart.unit)}</span></div>
      <div className="horizontal-chart-rows">
        {chart.data.map((item, index) => {
          const width = maximum ? Math.max(item.value > 0 ? 1.5 : 0, Math.min(100, (item.value / maximum) * 100)) : 0;
          return <div className="horizontal-chart-row" key={item.label}><span className="horizontal-chart-rank">{progress ? "" : `${index + 1}º`}</span><strong title={item.label}>{item.label}</strong><div className="horizontal-chart-track"><span style={{ width: `${width}%`, background: chart.color }} /></div><b>{formatChartValue(item.value, chart.unit)}</b></div>;
        })}
      </div>
    </div>
  );
}

function QualityTrendChart({ chart, expanded }: { chart: QualityChartConfig; expanded: boolean }) {
  const width = 680;
  const height = 270;
  const padding = { top: 20, right: 20, bottom: 45, left: 52 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xAt = (index: number) => chart.data.length === 1 ? padding.left + plotWidth / 2 : padding.left + (index / (chart.data.length - 1)) * plotWidth;
  const yAt = (value: number) => padding.top + plotHeight - (Math.max(0, Math.min(100, value)) / 100) * plotHeight;
  const points = chart.data.map((item, index) => `${xAt(index)},${yAt(item.value)}`).join(" ");
  const areaPoints = `${padding.left},${padding.top + plotHeight} ${points} ${padding.left + plotWidth},${padding.top + plotHeight}`;
  const labelStep = Math.max(1, Math.ceil(chart.data.length / 7));
  const ticks = [0, 25, 50, 75, 100];
  return (
    <div className={`quality-trend-chart ${expanded ? "quality-trend-chart--expanded" : ""}`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`trend-title-${chart.id} trend-desc-${chart.id}`}>
        <title id={`trend-title-${chart.id}`}>{chart.title}</title>
        <desc id={`trend-desc-${chart.id}`}>{chart.data.map((item) => `${item.label}: ${formatChartValue(item.value, chart.unit)}`).join(", ")}</desc>
        {ticks.map((tick) => <g key={tick}><line className="trend-grid-line" x1={padding.left} x2={width - padding.right} y1={yAt(tick)} y2={yAt(tick)} /><text className="trend-axis-label" x={padding.left - 10} y={yAt(tick) + 4} textAnchor="end">{tick}%</text></g>)}
        <polygon className="trend-area" points={areaPoints} style={{ fill: chart.color }} />
        <polyline className="trend-line" points={points} style={{ stroke: chart.color }} />
        {chart.data.map((item, index) => <g key={`${item.label}-${index}`}><circle className="trend-point" cx={xAt(index)} cy={yAt(item.value)} r={expanded ? 5 : 4} style={{ fill: chart.color }}><title>{`${item.label}: ${formatChartValue(item.value, chart.unit)}`}</title></circle>{(index % labelStep === 0 || index === chart.data.length - 1) && <text className="trend-x-label" x={xAt(index)} y={height - 15} textAnchor="middle">{item.label}</text>}</g>)}
      </svg>
    </div>
  );
}

function QualityDonutChart({ chart, expanded }: { chart: QualityChartConfig; expanded: boolean }) {
  const total = chart.data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return <EmptyState compact />;
  const primaryPercent = (chart.data[0].value / total) * 100;
  const secondaryColor = chart.secondaryColor ?? "#F78344";
  return (
    <div className={`quality-donut-layout ${expanded ? "quality-donut-layout--expanded" : ""}`} role="img" aria-label={`${chart.title}. ${chart.data.map((item) => `${item.label}: ${formatChartValue(item.value, chart.unit)}`).join(", ")}`}>
      <div className="quality-donut" style={{ background: `conic-gradient(${chart.color} 0 ${primaryPercent}%, ${secondaryColor} ${primaryPercent}% 100%)` }}><div><strong>{primaryPercent.toFixed(1)}%</strong><span>aprovação</span></div></div>
      <div className="quality-donut-legend">
        {chart.data.map((item, index) => <div key={item.label}><i style={{ background: index === 0 ? chart.color : secondaryColor }} /><span>{item.label}</span><strong>{formatChartValue(item.value, chart.unit)}</strong><small>{((item.value / total) * 100).toFixed(1)}% do inspecionado</small></div>)}
      </div>
    </div>
  );
}

function QualityChartModal({ chart, onClose }: { chart: QualityChartConfig; onClose: () => void }) {
  return (
    <div className="chart-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="chart-modal" role="dialog" aria-modal="true" aria-labelledby={`chart-modal-${chart.id}`}>
        <div className="chart-modal__heading"><div><p className="eyebrow">VISÃO AMPLIADA</p><h2 id={`chart-modal-${chart.id}`}>{chart.title}</h2><p>{chart.subtitle}</p></div><button onClick={onClose} aria-label="Fechar gráfico ampliado"><X size={20} /></button></div>
        <QualityChartView chart={chart} expanded />
      </section>
    </div>
  );
}

function getIsoWeek(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function MaterialQualityRecordForm({ area, supplierId, currentUserId, onCreated }: {
  area: MaterialArea; supplierId: string; currentUserId: string; onCreated: () => void;
}) {
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderNumber, setOrderNumber] = useState("");
  const [totalOrderVolume, setTotalOrderVolume] = useState("");
  const [inspectedVolume, setInspectedVolume] = useState("");
  const [rejectedVolume, setRejectedVolume] = useState("");
  const [releasedStockVolume, setReleasedStockVolume] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function submitRecord(event: FormEvent) {
    event.preventDefault();
    const volumes = [totalOrderVolume, inspectedVolume, rejectedVolume, releasedStockVolume].map(Number);
    if (volumes.some((value) => !Number.isFinite(value) || value < 0)) {
      setHasError(true);
      setMessage("Informe volumes válidos, iguais ou maiores que zero.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setHasError(false);
    const payload: MaterialQualityPayload = {
      order_number: orderNumber.trim(),
      total_order_volume: volumes[0],
      inspected_volume: volumes[1],
      rejected_volume: volumes[2],
      released_stock_volume: volumes[3],
    };
    const { error } = await supabase.from("quality_records").insert({
      supplier_id: supplierId,
      area_id: area.id,
      reference_date: referenceDate,
      reference_week: getIsoWeek(referenceDate),
      status: "submitted",
      payload,
      created_by: currentUserId,
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      setHasError(true);
      setMessage("Não foi possível enviar o registro. Confira os dados e tente novamente.");
    } else {
      setMessage("Registro enviado com sucesso para a equipe Rumo.");
      setOrderNumber("");
      setTotalOrderVolume("");
      setInspectedVolume("");
      setRejectedVolume("");
      setReleasedStockVolume("");
      onCreated();
    }
    setSubmitting(false);
  }

  return (
    <form id="material-record-form" className="material-record-form" onSubmit={submitRecord}>
      <div className="material-record-form__heading">
        <div><p className="eyebrow">NOVO REGISTRO</p><h2>{area.name}</h2><p>Preencha os dados do pedido e envie para análise da equipe Rumo.</p></div>
        <div className="account-icon"><ClipboardCheck /></div>
      </div>
      <div className="form-grid material-record-grid">
        <label>Número do pedido<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Ex.: 4500123456" /></label>
        <label>Data de referência<input required type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} /></label>
        <label>Volume total do pedido<input required type="number" min="0" step="any" value={totalOrderVolume} onChange={(event) => setTotalOrderVolume(event.target.value)} placeholder="0" /></label>
        <label>Volume inspecionado pela equipe de qualidade do fornecedor<input required type="number" min="0" step="any" value={inspectedVolume} onChange={(event) => setInspectedVolume(event.target.value)} placeholder="0" /></label>
        <label>Volume de reprovas<input required type="number" min="0" step="any" value={rejectedVolume} onChange={(event) => setRejectedVolume(event.target.value)} placeholder="0" /></label>
        <label>Volume total em estoque liberado para transporte<input required type="number" min="0" step="any" value={releasedStockVolume} onChange={(event) => setReleasedStockVolume(event.target.value)} placeholder="0" /></label>
      </div>
      {message && <div className={hasError ? "form-error" : "form-feedback"}>{message}</div>}
      <div className="material-record-form__actions"><span>Semana de referência calculada automaticamente: <strong>{getIsoWeek(referenceDate)}</strong></span><button className="primary-button primary-button--compact" disabled={submitting} type="submit"><FileCheck2 size={18} />{submitting ? "Enviando..." : "Enviar registro para a Rumo"}</button></div>
    </form>
  );
}

function MaterialQualityRecordsTable({ records, suppliers, compact = false, isTeam = false, canReview = false, currentUserId, onChanged }: {
  records: QualityRecord[];
  suppliers: Supplier[];
  compact?: boolean;
  isTeam?: boolean;
  canReview?: boolean;
  currentUserId?: string;
  onChanged?: () => void;
}) {
  const [rejectingRecord, setRejectingRecord] = useState<QualityRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState("");

  if (!records.length) return <EmptyState compact={compact} />;

  const formatVolume = (value: unknown) => typeof value === "number" ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value) : "—";
  const formatReviewDate = (value: string | null) => value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "";

  async function changeStatus(record: QualityRecord, status: "under_review" | "approved" | "rejected", reason = "") {
    if (!currentUserId || !canReview) return;
    if (status === "rejected" && !reason.trim()) {
      setReviewError("Informe a justificativa da reprovação.");
      return;
    }

    setUpdatingId(record.id);
    setReviewError("");
    const completed = status === "approved" || status === "rejected";
    const { error } = await supabase
      .from("quality_records")
      .update({
        status,
        review_notes: status === "rejected" ? reason.trim() : null,
        reviewed_by: currentUserId,
        reviewed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", record.id);

    if (error) {
      setReviewError("Não foi possível atualizar o registro. Tente novamente.");
    } else {
      setRejectingRecord(null);
      setRejectionReason("");
      onChanged?.();
    }
    setUpdatingId(null);
  }

  return (
    <>
      <div className="table-wrap">
        <table className={`material-quality-table ${isTeam && !compact ? "material-quality-table--review" : ""}`}>
          <thead><tr><th>Fornecedor</th><th>Pedido</th><th>Data</th><th>Semana</th><th>Volume total</th><th>Volume inspecionado</th><th>Reprovas</th><th>Estoque liberado</th><th>Status</th><th>Retorno da Rumo</th>{isTeam && !compact && <th>Ações</th>}</tr></thead>
          <tbody>
            {records.slice(0, compact ? 5 : 100).map((record) => (
              <tr key={record.id}>
                <td><strong>{suppliers.find((supplier) => supplier.id === record.supplier_id)?.trade_name ?? "Fornecedor"}</strong></td>
                <td>{String(record.payload?.order_number ?? "—")}</td>
                <td>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${record.reference_date}T12:00:00`))}</td>
                <td>Semana {record.reference_week}</td>
                <td>{formatVolume(record.payload?.total_order_volume)}</td>
                <td>{formatVolume(record.payload?.inspected_volume)}</td>
                <td>{formatVolume(record.payload?.rejected_volume)}</td>
                <td>{formatVolume(record.payload?.released_stock_volume)}</td>
                <td><span className={`record-status record-status--${record.status}`}>{statusLabels[record.status] ?? record.status}</span></td>
                <td className="review-return">
                  {record.status === "rejected" && record.review_notes ? <strong>{record.review_notes}</strong> : record.status === "approved" ? <span>Aprovado {formatReviewDate(record.reviewed_at)}</span> : record.status === "under_review" ? <span>Em avaliação pela equipe Rumo</span> : <span>Aguardando avaliação</span>}
                </td>
                {isTeam && !compact && (
                  <td>
                    {canReview ? (
                      <div className="review-actions">
                        <button className="review-action review-action--analysis" disabled={updatingId === record.id || record.status === "under_review"} onClick={() => void changeStatus(record, "under_review")}><CircleDot size={14} /> Em análise</button>
                        <button className="review-action review-action--approve" disabled={updatingId === record.id || record.status === "approved"} onClick={() => void changeStatus(record, "approved")}><CheckCircle2 size={14} /> Aprovar</button>
                        <button className="review-action review-action--reject" disabled={updatingId === record.id} onClick={() => { setReviewError(""); setRejectionReason(record.review_notes ?? ""); setRejectingRecord(record); }}><X size={14} /> Reprovar</button>
                      </div>
                    ) : <span className="review-readonly">Somente consulta</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rejectingRecord && (
        <div className="review-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRejectingRecord(null); }}>
          <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="reject-record-title">
            <div className="review-modal__heading"><div><p className="eyebrow">REPROVAR REGISTRO</p><h2 id="reject-record-title">Justificativa para o fornecedor</h2><p>O motivo ficará visível para a empresa responsável por este registro.</p></div><button onClick={() => setRejectingRecord(null)} aria-label="Fechar"><X size={20} /></button></div>
            <label>Motivo da reprovação<textarea autoFocus required maxLength={1000} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Descreva claramente o que precisa ser corrigido pelo fornecedor." /></label>
            {reviewError && <div className="form-error">{reviewError}</div>}
            <div className="review-modal__actions"><button className="secondary-button" onClick={() => setRejectingRecord(null)}>Cancelar</button><button className="primary-button primary-button--compact review-confirm-reject" disabled={updatingId === rejectingRecord.id || !rejectionReason.trim()} onClick={() => void changeStatus(rejectingRecord, "rejected", rejectionReason)}>{updatingId === rejectingRecord.id ? "Salvando..." : "Confirmar reprovação"}</button></div>
          </section>
        </div>
      )}
      {reviewError && !rejectingRecord && <div className="form-error records-review-error">{reviewError}</div>}
    </>
  );
}

function EmptyState({ compact = false }: { compact?: boolean }) {
  return <div className={`empty-state ${compact ? "empty-state--compact" : ""}`}><div><Sparkles /></div><h3>Pronto para receber informações</h3><p>Os registros enviados pelos fornecedores aparecerão aqui automaticamente.</p></div>;
}

function AccountsPage({ areas, suppliers, accounts, currentUserId, canCreate, canEdit, onChanged, onExamplesActivated }: {
  areas: MaterialArea[];
  suppliers: Supplier[];
  accounts: Profile[];
  currentUserId: string;
  canCreate: boolean;
  canEdit: boolean;
  onChanged: () => void;
  onExamplesActivated: () => void;
}) {
  const [kind, setKind] = useState<UserKind>("supplier");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("viewer");
  const [areaId, setAreaId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editKind, setEditKind] = useState<UserKind>("supplier");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<TeamRole>("viewer");
  const [editAreaId, setEditAreaId] = useState("");
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [editPasswordConfirmation, setEditPasswordConfirmation] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [activatingExamples, setActivatingExamples] = useState(false);
  const [exampleMessage, setExampleMessage] = useState("");
  const [exampleError, setExampleError] = useState(false);

  async function activateExamples() {
    if (!canCreate || activatingExamples) return;
    setActivatingExamples(true);
    setExampleMessage("");
    setExampleError(false);
    const { data, error } = await supabase.functions.invoke("activate-wood-sleeper-examples", { body: {} });
    if (error) {
      let reason = "Não foi possível ativar os exemplos. Tente novamente.";
      if ("context" in error && error.context instanceof Response) {
        try {
          const body = await error.context.clone().json() as { error?: string };
          if (body.error) reason = body.error;
        } catch { /* mantém a mensagem padrão */ }
      }
      setExampleError(true);
      setExampleMessage(reason);
    } else {
      const result = data as { created?: number; total?: number; suppliers?: number; areas?: number; already_active?: boolean };
      setExampleMessage(result.already_active
        ? `Os ${result.total ?? 0} exemplos já estavam ativos nas ${result.areas ?? 0} áreas.`
        : `${result.created ?? 0} exemplos ativados nas ${result.areas ?? 0} áreas para ${result.suppliers ?? 0} fornecedores.`);
      onExamplesActivated();
    }
    setActivatingExamples(false);
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    if (!canCreate) return;
    if (newPassword.length < 8) {
      setMessage("A senha inicial deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("A senha e a confirmação não são iguais.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        email: email.trim(), full_name: name.trim(), user_kind: kind,
        team_role: kind === "team" ? role : null,
        area_id: kind === "supplier" ? areaId : null,
        supplier_id: kind === "supplier" ? supplierId || null : null,
        supplier_name: kind === "supplier" && !supplierId ? newCompany.trim() : null,
        password: newPassword,
      },
    });
    if (error) {
      let reason = "Não foi possível criar a conta. Verifique os dados ou tente novamente.";
      if ("context" in error && error.context instanceof Response) {
        try {
          const body = await error.context.clone().json() as { error?: string };
          if (body.error) reason = body.error;
        } catch { /* mantém a mensagem padrão */ }
      }
      setMessage(reason);
    }
    else { setMessage("Conta criada com sucesso. Informe a senha inicial ao novo usuário por um canal seguro."); setName(""); setEmail(""); setNewCompany(""); setNewPassword(""); setConfirmPassword(""); onChanged(); }
    setSubmitting(false);
  }

  function startEditing(account: Profile) {
    setEditing(account);
    setEditKind(account.user_kind);
    setEditName(account.full_name);
    setEditEmail(account.email);
    setEditRole(account.team_role ?? "viewer");
    setEditAreaId(account.area_id ?? "");
    setEditSupplierId(account.supplier_id ?? "");
    setEditCompanyName(suppliers.find((supplier) => supplier.id === account.supplier_id)?.trade_name ?? "");
    setEditActive(account.is_active);
    setEditPassword("");
    setEditPasswordConfirmation("");
    setEditMessage("");
    window.setTimeout(() => document.getElementById("editar-conta")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    if (!editing || !canEdit) return;
    if (editPassword && editPassword.length < 8) {
      setEditMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (editPassword !== editPasswordConfirmation) {
      setEditMessage("A nova senha e a confirmação não são iguais.");
      return;
    }
    if (editKind === "supplier" && (!editAreaId || (!editSupplierId && !editCompanyName.trim()))) {
      setEditMessage("Selecione a área e informe ou selecione a empresa do fornecedor.");
      return;
    }
    if (editing.id === currentUserId && !editActive) {
      setEditMessage("Você não pode desativar a própria conta.");
      return;
    }

    setSaving(true);
    setEditMessage("");
    const { error } = await supabase.functions.invoke("admin-update-user", {
      body: {
        id: editing.id,
        full_name: editName.trim(),
        email: editEmail.trim(),
        user_kind: editKind,
        team_role: editKind === "team" ? editRole : null,
        area_id: editKind === "supplier" ? editAreaId : null,
        supplier_id: editKind === "supplier" ? editSupplierId || null : null,
        supplier_name: editKind === "supplier" ? editCompanyName.trim() : null,
        is_active: editActive,
        password: editPassword || null,
      },
    });
    if (error) {
      let reason = "Não foi possível salvar as alterações.";
      if ("context" in error && error.context instanceof Response) {
        try {
          const body = await error.context.clone().json() as { error?: string };
          if (body.error) reason = body.error;
        } catch { /* mantém a mensagem padrão */ }
      }
      setEditMessage(reason);
    } else {
      setEditing(null);
      onChanged();
    }
    setSaving(false);
  }

  function accountTable(title: string, subtitle: string, list: Profile[], supplierSection = false) {
    return (
      <section className="account-group" key={title}>
        <div className="account-group__heading">
          <div><h3>{title}</h3><p>{subtitle}</p></div>
          <span>{list.length} {list.length === 1 ? "conta" : "contas"}</span>
        </div>
        <div className="table-wrap account-table-wrap">
          <table className="account-table">
            <thead><tr><th>Usuário</th><th>E-mail</th>{supplierSection ? <th>Empresa</th> : <th>Perfil</th>}<th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              {list.length ? list.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.full_name}</strong>{account.id === currentUserId && <small>Você</small>}</td>
                  <td>{account.email}</td>
                  <td>{supplierSection ? suppliers.find((item) => item.id === account.supplier_id)?.trade_name ?? "Empresa não encontrada" : roleLabels[account.team_role ?? "viewer"]}</td>
                  <td><span className={`account-status ${account.is_active ? "active" : "inactive"}`}>{account.is_active ? "Ativa" : "Inativa"}</span></td>
                  <td><button type="button" className="table-action" disabled={!canEdit} onClick={() => startEditing(account)}><Pencil size={14} />Alterar</button></td>
                </tr>
              )) : <tr><td className="account-table__empty" colSpan={5}>Nenhuma conta registrada nesta categoria.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-heading"><div><p className="eyebrow">ADMINISTRAÇÃO</p><h1>Contas e acessos</h1><p>Controle quem acessa o portal e o alcance de cada perfil.</p></div><button type="button" className="primary-button primary-button--compact examples-button" disabled={!canCreate || activatingExamples} onClick={() => void activateExamples()}><Sparkles size={18} />{activatingExamples ? "Ativando exemplos..." : "Ativar exemplos"}</button></section>
      {exampleMessage && <div className={exampleError ? "form-error examples-feedback" : "form-feedback examples-feedback"}>{exampleMessage}</div>}
      <section className="account-layout">
        <form className="account-form-card" onSubmit={createAccount}>
          <div className="card-heading"><div><span>Nova conta</span><p>Defina o tipo de acesso e os dados do usuário</p></div><div className="account-icon"><Users /></div></div>
          <div className="type-choice">
            <button type="button" className={kind === "supplier" ? "active" : ""} onClick={() => setKind("supplier")}><Boxes /><strong>Fornecedor</strong><span>Acesso limitado à empresa e área</span></button>
            <button type="button" className={kind === "team" ? "active" : ""} onClick={() => setKind("team")}><Building2 /><strong>Equipe Rumo</strong><span>Acesso conforme perfil interno</span></button>
          </div>
          <div className="form-grid">
            <label>Nome completo<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do usuário" /></label>
            <label>E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="usuario@empresa.com" /></label>
            <label>Senha inicial<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" /></label>
            <label>Confirmar senha<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Digite a senha novamente" /></label>
            {kind === "team" ? <label className="full-width">Perfil de acesso<select value={role} onChange={(event) => setRole(event.target.value as TeamRole)}><option value="editor">Editor</option><option value="analyst">Analista</option><option value="coordinator">Coordenador</option><option value="viewer">Consulta</option></select></label> : <>
              <label>Área de atuação<select required value={areaId} onChange={(event) => { setAreaId(event.target.value); setSupplierId(""); }}><option value="">Selecione a área</option>{areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select></label>
              <label>Empresa cadastrada<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Cadastrar nova empresa</option>{suppliers.filter((supplier) => supplier.area_id === areaId && supplier.status === "active").map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.trade_name}</option>)}</select></label>
              {!supplierId && <label className="full-width">Nome da empresa<input required value={newCompany} onChange={(event) => setNewCompany(event.target.value)} placeholder="Razão social ou nome fantasia" /></label>}
            </>}
          </div>
          {!canCreate && <div className="form-warning">A criação de contas é permitida para Editor e Coordenador. Você ainda pode consultar e alterar as contas conforme seu perfil.</div>}
          {message && <div className="form-feedback">{message}</div>}
          <button className="primary-button primary-button--compact" type="submit" disabled={!canCreate || submitting}><Plus size={18} />{submitting ? "Criando conta..." : "Criar conta"}</button>
        </form>
        <aside className="access-guide">
          <h3>Perfis da equipe Rumo</h3>
          <div><span className="role-dot role-dot--editor" /><p><strong>Editor</strong>Gerencia conteúdo, cadastros e estrutura do portal.</p></div>
          <div><span className="role-dot role-dot--analyst" /><p><strong>Analista</strong>Analisa registros e acompanha os indicadores.</p></div>
          <div><span className="role-dot role-dot--coordinator" /><p><strong>Coordenador</strong>Supervisiona áreas, aprova registros e gerencia acessos.</p></div>
          <div><span className="role-dot role-dot--viewer" /><p><strong>Consulta</strong>Visualiza dashboards e registros sem editar.</p></div>
          <div className="guide-note"><ShieldCheck /><p><strong>Princípio do menor acesso</strong>Fornecedores enxergam somente a própria empresa dentro da área vinculada.</p></div>
        </aside>
      </section>
      <section className="accounts-registry">
        <div className="accounts-registry__heading"><div><p className="eyebrow">CONTAS REGISTRADAS</p><h2>Usuários por tipo de acesso</h2><p>Equipe Rumo e fornecedores organizados por área de atuação.</p></div><span>{accounts.length} contas no total</span></div>
        {editing && (
          <form id="editar-conta" className="account-editor" onSubmit={saveAccount}>
            <div className="account-editor__heading"><div><p className="eyebrow">ALTERAR CONTA</p><h3>{editing.full_name}</h3></div><button type="button" className="editor-close" onClick={() => setEditing(null)} aria-label="Fechar edição"><X size={18} /></button></div>
            <div className="form-grid">
              <label className="full-width">Tipo de conta<select value={editKind} onChange={(event) => setEditKind(event.target.value as UserKind)}><option value="team">Equipe Rumo</option><option value="supplier">Fornecedor</option></select></label>
              <label>Nome completo<input required value={editName} onChange={(event) => setEditName(event.target.value)} /></label>
              <label>E-mail<input required type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} /></label>
              {editKind === "team" ? <label className="full-width">Perfil de acesso<select value={editRole} onChange={(event) => setEditRole(event.target.value as TeamRole)}><option value="editor">Editor</option><option value="analyst">Analista</option><option value="coordinator">Coordenador</option><option value="viewer">Consulta</option></select></label> : <>
                <label>Área de atuação<select required value={editAreaId} onChange={(event) => { setEditAreaId(event.target.value); setEditSupplierId(""); setEditCompanyName(""); }}><option value="">Selecione</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
                <label>Empresa cadastrada<select value={editSupplierId} onChange={(event) => { const nextId = event.target.value; setEditSupplierId(nextId); setEditCompanyName(suppliers.find((supplier) => supplier.id === nextId)?.trade_name ?? ""); }}><option value="">Cadastrar nova empresa</option>{suppliers.filter((supplier) => supplier.area_id === editAreaId && supplier.status === "active").map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.trade_name}</option>)}</select></label>
                <label className="full-width">Nome ou razão social da empresa<input required value={editCompanyName} onChange={(event) => setEditCompanyName(event.target.value)} placeholder="Nome completo da empresa" /></label>
              </>}
              <label>Nova senha (opcional)<input type="password" minLength={8} maxLength={72} autoComplete="new-password" value={editPassword} onChange={(event) => setEditPassword(event.target.value)} placeholder="Deixe em branco para manter" /></label>
              <label>Confirmar nova senha<input type="password" minLength={8} maxLength={72} autoComplete="new-password" value={editPasswordConfirmation} onChange={(event) => setEditPasswordConfirmation(event.target.value)} placeholder="Repita somente se alterar" /></label>
              <label className="account-active-toggle full-width"><input type="checkbox" checked={editActive} onChange={(event) => setEditActive(event.target.checked)} /><span>Conta ativa e autorizada a entrar no portal</span></label>
            </div>
            {editMessage && <div className="form-error">{editMessage}</div>}
            <div className="account-editor__actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancelar</button><button className="primary-button primary-button--compact" disabled={saving} type="submit">{saving ? "Salvando..." : "Salvar alterações"}</button></div>
          </form>
        )}
        {accountTable("Equipe Rumo", "Contas internas separadas por perfil de acesso", accounts.filter((account) => account.user_kind === "team"))}
        {areas.map((area) => accountTable(area.name, `Fornecedores vinculados à área ${area.name}`, accounts.filter((account) => account.user_kind === "supplier" && account.area_id === area.id), true))}
      </section>
    </>
  );
}

export function PortalApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const fetchProfile = useCallback(async (currentSession: Session) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", currentSession.user.id).single();
    if (error || !data || !data.is_active) {
      setProfileError("Seu usuário ainda não possui um perfil de acesso ativo.");
      setProfile(null);
    } else {
      setProfile(data as Profile);
      setProfileError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) void fetchProfile(data.session);
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) void fetchProfile(nextSession);
      else { setProfile(null); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  const content = useMemo(() => {
    if (loading) return <LoadingScreen />;
    if (!session) return <LoginScreen />;
    if (profileError || !profile) return <main className="access-error"><Logo /><ShieldCheck /><h1>Acesso ainda não configurado</h1><p>{profileError}</p><button className="primary-button primary-button--compact" onClick={() => supabase.auth.signOut()}>Voltar ao login</button></main>;
    return <PortalShell session={session} profile={profile} />;
  }, [loading, session, profile, profileError]);

  return content;
}
