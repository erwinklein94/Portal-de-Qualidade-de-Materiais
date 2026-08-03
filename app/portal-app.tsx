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
  Menu,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
};

type WoodSleeperPayload = {
  order_number: string;
  total_order_volume: number;
  inspected_volume: number;
  rejected_volume: number;
  released_stock_volume: number;
};

const roleLabels: Record<TeamRole, string> = {
  editor: "Editor",
  analyst: "Analista",
  coordinator: "Coordenador",
  viewer: "Consulta",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  submitted: "Enviado",
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

  const isTeam = profile.user_kind === "team";
  const canCreateAccounts =
    isTeam && (profile.team_role === "editor" || profile.team_role === "coordinator");
  const canEditAccounts =
    isTeam && ["editor", "analyst", "coordinator"].includes(profile.team_role ?? "");

  const loadData = useCallback(async () => {
    setDataLoading(true);
    const [areasResult, suppliersResult, recordsResult, accountsResult] = await Promise.all([
      supabase.from("material_areas").select("*").order("sort_order"),
      supabase.from("suppliers").select("id, trade_name, legal_name, area_id, status").order("trade_name"),
      supabase.from("quality_records").select("id, reference_date, reference_week, status, supplier_id, area_id, updated_at, payload").order("updated_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id, full_name, email, user_kind, team_role, supplier_id, area_id, is_active, must_change_password").order("full_name"),
    ]);
    setAreas((areasResult.data as MaterialArea[]) ?? []);
    setSuppliers((suppliersResult.data as Supplier[]) ?? []);
    setRecords((recordsResult.data as QualityRecord[]) ?? []);
    setAccounts((accountsResult.data as Profile[]) ?? []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  return (
    <div className={`portal ${menuOpen ? "menu-open" : "menu-closed"}`}>
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
            <button className="icon-button notification" aria-label="Notificações"><Bell size={20} /><span /></button>
            <div className="topbar-profile"><span>{profile.full_name.slice(0, 2).toUpperCase()}</span><div><strong>{profile.full_name}</strong><small>{profile.email}</small></div></div>
          </div>
        </header>

        <main className="content">
          {profile.must_change_password && (
            <div className="security-banner"><ShieldCheck size={20} /><span>Este é um acesso inicial. Por segurança, programe a troca da senha compartilhada.</span><button onClick={() => notify("Fluxo de troca de senha preparado para a próxima etapa.")}>Entendi</button></div>
          )}
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
              currentUserId={session.user.id}
              currentSupplierId={profile.supplier_id}
              onRecordCreated={() => { void loadData(); notify("Registro enviado para a equipe Rumo com sucesso."); }}
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
            />
          )}
        </main>
      </div>
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}
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

function AreaWorkspace({ area, mode, setMode, suppliers, records, supplierFilter, setSupplierFilter, dateFilter, setDateFilter, weekFilter, setWeekFilter, isTeam, currentUserId, currentSupplierId, onRecordCreated }: {
  area: MaterialArea; mode: "dashboard" | "records"; setMode: (mode: "dashboard" | "records") => void; suppliers: Supplier[]; records: QualityRecord[];
  supplierFilter: string; setSupplierFilter: (value: string) => void; dateFilter: string; setDateFilter: (value: string) => void; weekFilter: string; setWeekFilter: (value: string) => void; isTeam: boolean;
  currentUserId: string; currentSupplierId: string | null; onRecordCreated: () => void;
}) {
  const approved = records.filter((record) => record.status === "approved").length;
  const openNewRecord = () => {
    setMode("records");
    window.setTimeout(() => document.getElementById("wood-sleeper-record-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  return (
    <>
      <section className="area-hero" style={{ "--area-accent": area.accent_color } as React.CSSProperties}>
        <div><p className="eyebrow">ÁREA DE MATERIAL</p><h1>{area.name}</h1><p>{area.description}</p></div>
        {!isTeam && area.code === "wood_sleeper" && <button className="primary-button primary-button--compact" onClick={openNewRecord}><Plus size={18} /> Novo registro</button>}
      </section>
      <div className="view-tabs">
        <button className={mode === "dashboard" ? "active" : ""} onClick={() => setMode("dashboard")}><BarChart3 size={17} /> Dashboard</button>
        <button className={mode === "records" ? "active" : ""} onClick={() => setMode("records")}><ClipboardCheck size={17} /> Registros</button>
      </div>
      <section className="filter-bar">
        <div className="filter-title"><SlidersHorizontal size={18} /><span>Filtros</span></div>
        <label>Fornecedor<select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}><option value="">Todos os fornecedores</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.trade_name}</option>)}</select></label>
        <label>Data<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
        <label>Semana<select value={weekFilter} onChange={(event) => setWeekFilter(event.target.value)}><option value="">Todas as semanas</option>{Array.from({ length: 53 }, (_, index) => index + 1).map((week) => <option value={week} key={week}>Semana {week}</option>)}</select></label>
        <button className="text-button" onClick={() => { setSupplierFilter(""); setDateFilter(""); setWeekFilter(""); }}>Limpar filtros</button>
      </section>
      {mode === "dashboard" ? (
        <section className="dashboard-grid">
          <article className="chart-card"><div className="card-heading"><div><span>Conformidade</span><strong>{records.length ? Math.round((approved / records.length) * 100) : 0}%</strong></div><span className="status-pill">Período filtrado</span></div><div className="donut" style={{ "--value": `${records.length ? Math.round((approved / records.length) * 100) : 0}%`, "--accent": area.accent_color } as React.CSSProperties}><div><strong>{approved}</strong><span>aprovados</span></div></div><div className="chart-legend"><span><i className="approved" /> Aprovados</span><span><i className="pending" /> Em análise</span><span><i className="rejected" /> Reprovados</span></div></article>
          <article className="chart-card chart-card--wide"><div className="card-heading"><div><span>Registros por semana</span><p>Evolução das informações recebidas</p></div></div>{records.length ? <div className="bar-chart">{[35, 55, 42, 75, 58, 84, 70, 92].map((height, index) => <div key={index}><span style={{ height: `${height}%`, background: area.accent_color }} /><small>S{index + 1}</small></div>)}</div> : <EmptyState compact />}</article>
          <article className="chart-card chart-card--full"><div className="card-heading"><div><span>Fornecedores da área</span><p>Visão consolidada por empresa</p></div></div>{area.code === "wood_sleeper" ? <WoodSleeperRecordsTable records={records} suppliers={suppliers} compact /> : <RecordsTable records={records} suppliers={suppliers} compact />}</article>
        </section>
      ) : (
        <>
          {!isTeam && area.code === "wood_sleeper" && currentSupplierId && <WoodSleeperRecordForm areaId={area.id} supplierId={currentSupplierId} currentUserId={currentUserId} onCreated={onRecordCreated} />}
          <section className="records-card">
            <div className="records-head"><div><h2>Registros de qualidade</h2><p>{records.length} registro(s) no período selecionado</p></div>{!isTeam && area.code === "wood_sleeper" && <button className="primary-button primary-button--compact" onClick={openNewRecord}><Plus size={18} /> Novo registro</button>}</div>
            {area.code === "wood_sleeper" ? <WoodSleeperRecordsTable records={records} suppliers={suppliers} /> : <RecordsTable records={records} suppliers={suppliers} />}
          </section>
        </>
      )}
    </>
  );
}

function getIsoWeek(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function WoodSleeperRecordForm({ areaId, supplierId, currentUserId, onCreated }: {
  areaId: string; supplierId: string; currentUserId: string; onCreated: () => void;
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
    const payload: WoodSleeperPayload = {
      order_number: orderNumber.trim(),
      total_order_volume: volumes[0],
      inspected_volume: volumes[1],
      rejected_volume: volumes[2],
      released_stock_volume: volumes[3],
    };
    const { error } = await supabase.from("quality_records").insert({
      supplier_id: supplierId,
      area_id: areaId,
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
    <form id="wood-sleeper-record-form" className="material-record-form" onSubmit={submitRecord}>
      <div className="material-record-form__heading">
        <div><p className="eyebrow">NOVO REGISTRO</p><h2>Dormente de Madeira</h2><p>Preencha os dados do pedido e envie para análise da equipe Rumo.</p></div>
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

function WoodSleeperRecordsTable({ records, suppliers, compact = false }: { records: QualityRecord[]; suppliers: Supplier[]; compact?: boolean }) {
  if (!records.length) return <EmptyState compact={compact} />;
  const formatVolume = (value: unknown) => typeof value === "number" ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value) : "—";
  return <div className="table-wrap"><table className="wood-sleeper-table"><thead><tr><th>Fornecedor</th><th>Pedido</th><th>Data</th><th>Semana</th><th>Volume total</th><th>Volume inspecionado</th><th>Reprovas</th><th>Estoque liberado</th><th>Status</th></tr></thead><tbody>{records.slice(0, compact ? 5 : 50).map((record) => <tr key={record.id}><td><strong>{suppliers.find((supplier) => supplier.id === record.supplier_id)?.trade_name ?? "Fornecedor"}</strong></td><td>{String(record.payload?.order_number ?? "—")}</td><td>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${record.reference_date}T12:00:00`))}</td><td>Semana {record.reference_week}</td><td>{formatVolume(record.payload?.total_order_volume)}</td><td>{formatVolume(record.payload?.inspected_volume)}</td><td>{formatVolume(record.payload?.rejected_volume)}</td><td>{formatVolume(record.payload?.released_stock_volume)}</td><td><span className={`record-status record-status--${record.status}`}>{statusLabels[record.status] ?? record.status}</span></td></tr>)}</tbody></table></div>;
}

function RecordsTable({ records, suppliers, compact = false }: { records: QualityRecord[]; suppliers: Supplier[]; compact?: boolean }) {
  if (!records.length) return <EmptyState compact={compact} />;
  return <div className="table-wrap"><table><thead><tr><th>Fornecedor</th><th>Data de referência</th><th>Semana</th><th>Status</th><th>Última atualização</th></tr></thead><tbody>{records.slice(0, compact ? 5 : 50).map((record) => <tr key={record.id}><td><strong>{suppliers.find((supplier) => supplier.id === record.supplier_id)?.trade_name ?? "Fornecedor"}</strong></td><td>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${record.reference_date}T12:00:00`))}</td><td>Semana {record.reference_week}</td><td><span className={`record-status record-status--${record.status}`}>{statusLabels[record.status] ?? record.status}</span></td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(record.updated_at))}</td></tr>)}</tbody></table></div>;
}

function EmptyState({ compact = false }: { compact?: boolean }) {
  return <div className={`empty-state ${compact ? "empty-state--compact" : ""}`}><div><Sparkles /></div><h3>Pronto para receber informações</h3><p>Os registros enviados pelos fornecedores aparecerão aqui automaticamente.</p></div>;
}

function AccountsPage({ areas, suppliers, accounts, currentUserId, canCreate, canEdit, onChanged }: {
  areas: MaterialArea[];
  suppliers: Supplier[];
  accounts: Profile[];
  currentUserId: string;
  canCreate: boolean;
  canEdit: boolean;
  onChanged: () => void;
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
      <section className="page-heading"><div><p className="eyebrow">ADMINISTRAÇÃO</p><h1>Contas e acessos</h1><p>Controle quem acessa o portal e o alcance de cada perfil.</p></div></section>
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
              <label>Empresa cadastrada<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Cadastrar nova empresa</option>{suppliers.filter((supplier) => supplier.area_id === areaId).map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.trade_name}</option>)}</select></label>
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
                <label>Empresa cadastrada<select value={editSupplierId} onChange={(event) => { const nextId = event.target.value; setEditSupplierId(nextId); setEditCompanyName(suppliers.find((supplier) => supplier.id === nextId)?.trade_name ?? ""); }}><option value="">Cadastrar nova empresa</option>{suppliers.filter((supplier) => supplier.area_id === editAreaId).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.trade_name}</option>)}</select></label>
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
