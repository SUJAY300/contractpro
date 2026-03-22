import { useState, useEffect, useCallback } from "react";

// ══════════════════════════════════════════════════════════
// CONFIG — your real Supabase project
// ══════════════════════════════════════════════════════════
const SUPABASE_URL = "https://vkczzgkyryturtdijfev.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY3p6Z2t5cnl0dXJ0ZGlqZmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzE1MjAsImV4cCI6MjA4OTc0NzUyMH0.7h6R5eKL4WV9JDx4LF4AcVkh54J6bodEOlXaWvpb5rY";
const FN = (name) => `${SUPABASE_URL}/functions/v1/${name}`;

const call = async (fnName, body) => {
  const res = await fetch(FN(fnName), {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// ══════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════
const sha256sim = (str) => {
  let h = 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    h = (h << 13) | (h >>> 19);
  }
  return "0x" + (h >>> 0).toString(16).toUpperCase().padStart(8, "0") +
    Math.abs(str.split("").reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(8, "0");
};

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const shortTx = (tx) => tx && tx !== "CONTRACT_NOT_DEPLOYED" ? tx.slice(0, 10) + "..." + tx.slice(-6) : tx || "—";
const explorerUrl = (tx) => `https://amoy.polygonscan.com/tx/${tx}`;

const ROLES = {
  gov_authority: { label: "Government Authority", color: "#1e3a5f", bg: "#e8eef7", icon: "🏛️" },
  contractor:    { label: "Contractor",           color: "#5b21b6", bg: "#ede9fe", icon: "🔨" },
  inspector:     { label: "Inspector",            color: "#065f46", bg: "#d1fae5", icon: "🔍" },
  auditor:       { label: "Auditor",              color: "#92400e", bg: "#fef3c7", icon: "📋" },
};

const ST = {
  active:               { label: "Active",                  c: "#16a34a", bg: "#dcfce7" },
  on_hold:              { label: "On Hold",                 c: "#d97706", bg: "#fef3c7" },
  completed:            { label: "Completed",               c: "#2563eb", bg: "#dbeafe" },
  pending_inspection:   { label: "Pending Inspection",      c: "#7c3aed", bg: "#ede9fe" },
  pending_gov_approval: { label: "Awaiting Final Approval", c: "#0891b2", bg: "#cffafe" },
  approved:             { label: "Approved",                c: "#16a34a", bg: "#dcfce7" },
  rejected:             { label: "Rejected",                c: "#dc2626", bg: "#fee2e2" },
  locked:               { label: "Locked 🔒",              c: "#6b7280", bg: "#f3f4f6" },
  not_started:          { label: "Not Started",             c: "#6b7280", bg: "#f3f4f6" },
  payment_released:     { label: "Payment Released ✓",     c: "#059669", bg: "#d1fae5" },
  pending:              { label: "Pending Review",          c: "#d97706", bg: "#fef3c7" },
};

// ══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════
const Badge = ({ s }) => {
  const c = ST[s] || { label: s, c: "#6b7280", bg: "#f3f4f6" };
  return <span style={{ background: c.bg, color: c.c, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{c.label}</span>;
};

const TxBadge = ({ tx }) => {
  if (!tx || tx === "CONTRACT_NOT_DEPLOYED") return <span style={{ fontSize: 10, color: "#9ca3af" }}>DB only (contract pending)</span>;
  return (
    <a href={explorerUrl(tx)} target="_blank" rel="noopener noreferrer"
      style={{ fontSize: 10, color: "#3730a3", background: "#f0f4ff", padding: "2px 7px", borderRadius: 5, fontFamily: "monospace", textDecoration: "none" }}>
      🔗 {shortTx(tx)}
    </a>
  );
};

const Modal = ({ title, onClose, children, wide }) => (
  <div onClick={(e) => e.target === e.currentTarget && onClose()}
    style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 16, padding: 26, width: "100%", maxWidth: wide ? 720 : 500, maxHeight: "92vh", overflow: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #e5e7eb" }}>
        <h3 style={{ margin: 0, color: "#1e3a5f", fontSize: 17, fontWeight: 800 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const StatCard = ({ label, value, icon, color = "#1e3a5f", sub }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderLeft: `4px solid ${color}`, flex: 1, minWidth: 140 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ color: "#111827", fontSize: 20, fontWeight: 800 }}>{value}</div>
        {sub && <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 2 }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
  </div>
);

const FG = ({ label, children, req }) => (
  <div style={{ marginBottom: 13 }}>
    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label} {req && <span style={{ color: "#dc2626" }}>*</span>}
    </label>
    {children}
  </div>
);

const inp = { width: "100%", padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa", fontFamily: "inherit" };
const Inp = (p) => <input {...p} style={{ ...inp, ...p.style }} />;
const Sel = (p) => <select {...p} style={{ ...inp, background: "#fff", ...p.style }} />;
const Txta = (p) => <textarea {...p} style={{ ...inp, resize: "vertical", minHeight: 65, ...p.style }} />;

const Btn = ({ children, onClick, v = "primary", disabled, sm, loading }) => {
  const vs = { primary: { bg: "#1e3a5f", fg: "#fff" }, success: { bg: "#16a34a", fg: "#fff" }, danger: { bg: "#dc2626", fg: "#fff" }, warn: { bg: "#d97706", fg: "#fff" }, outline: { bg: "#fff", fg: "#1e3a5f", bdr: "1.5px solid #1e3a5f" }, ghost: { bg: "#f3f4f6", fg: "#374151" }, gold: { bg: "#e8a020", fg: "#fff" } };
  const s = vs[v] || vs.primary;
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ background: (disabled || loading) ? "#e5e7eb" : s.bg, color: (disabled || loading) ? "#9ca3af" : s.fg, border: s.bdr || "none", padding: sm ? "6px 12px" : "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: sm ? 11 : 13, cursor: (disabled || loading) ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
      {loading ? "⏳ Processing..." : children}
    </button>
  );
};

const HR = () => <div style={{ height: 1, background: "#e5e7eb", margin: "13px 0" }} />;

const InfoBox = ({ type = "info", children }) => {
  const t = { info: { bg: "#eff6ff", b: "#3b82f6", c: "#1d4ed8" }, warn: { bg: "#fffbeb", b: "#f59e0b", c: "#92400e" }, danger: { bg: "#fef2f2", b: "#ef4444", c: "#991b1b" }, success: { bg: "#f0fdf4", b: "#22c55e", c: "#14532d" } };
  const s = t[type];
  return <div style={{ background: s.bg, borderLeft: `4px solid ${s.b}`, color: s.c, padding: "9px 13px", borderRadius: "0 8px 8px 0", fontSize: 12, marginBottom: 13 }}>{children}</div>;
};

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTop: "3px solid #1e3a5f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ══════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState("demo");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const demoUsers = [
    { email: "gov@contractpro.in",        label: "Rajesh Kumar",            role: "gov_authority", initials: "RK" },
    { email: "contractor@contractpro.in", label: "Priya Construction Ltd.", role: "contractor",    initials: "PC" },
    { email: "inspector@contractpro.in",  label: "Amit Sharma",            role: "inspector",     initials: "AS" },
    { email: "auditor@contractpro.in",    label: "Sonia Verma",            role: "auditor",       initials: "SV" },
  ];

  const loginWithEmail = async (emailVal) => {
    setLoading(true); setErr("");
    try {
      const res = await call("auth-otp", { action: "send_otp", identifier: emailVal });
      setOtpSent(true);
      setDevOtp(res.dev_otp || "");
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const verifyOtpCode = async (otpVal) => {
    setLoading(true); setErr("");
    try {
      const res = await call("auth-otp", { action: "verify_otp", identifier: email, otp: otpVal });
      onLogin(res.user);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const quickLogin = async (emailVal) => {
    setLoading(true); setErr("");
    try {
      const res = await call("auth-otp", { action: "send_otp", identifier: emailVal });
      const res2 = await call("auth-otp", { action: "verify_otp", identifier: emailVal, otp: res.dev_otp });
      onLogin(res2.user);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1628 0%,#1e3a5f 50%,#0a1628 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'IBM Plex Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, background: "linear-gradient(135deg,#e8a020,#f5c842)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📜</div>
            <span style={{ color: "#fff", fontSize: 26, fontFamily: "'Playfair Display',serif", fontWeight: 800 }}>ContractPro</span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Blockchain-Powered Government Procurement · Polygon Amoy</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 26, boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Sign In to ContractPro</h2>
          <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: 12 }}>Secure government procurement portal</p>

          <div style={{ display: "flex", gap: 3, background: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 18 }}>
            {[["demo","Quick Demo"],["otp","OTP Login"],["google","Google"]].map(([k,l]) => (
              <button key={k} onClick={() => { setTab(k); setErr(""); setOtpSent(false); setOtp(""); setEmail(""); }}
                style={{ flex: 1, padding: "7px 4px", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", background: tab===k?"#fff":"transparent", color: tab===k?"#1e3a5f":"#6b7280", boxShadow: tab===k?"0 1px 4px rgba(0,0,0,0.12)":"none", fontFamily: "inherit" }}>
                {l}
              </button>
            ))}
          </div>

          {err && <InfoBox type="danger">{err}</InfoBox>}

          {tab === "demo" && (
            <div>
              <p style={{ color: "#6b7280", fontSize: 11, marginBottom: 11 }}>Login is real — OTP verified against Supabase. Select a role:</p>
              {demoUsers.map(u => (
                <button key={u.email} onClick={() => quickLogin(u.email)} disabled={loading}
                  style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fafafa", cursor: loading?"not-allowed":"pointer", width: "100%", marginBottom: 7, textAlign: "left", fontFamily: "inherit" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: ROLES[u.role].bg, color: ROLES[u.role].color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{u.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{u.label}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{ROLES[u.role].icon} {ROLES[u.role].label}</div>
                  </div>
                  <span style={{ color: "#d1d5db" }}>›</span>
                </button>
              ))}
              {loading && <InfoBox type="info">⏳ Authenticating & setting up blockchain wallet...</InfoBox>}
            </div>
          )}

          {tab === "otp" && (
            <div>
              {!otpSent ? (
                <>
                  <FG label="Registered Email" req><Inp type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@gov.in" /></FG>
                  <Btn onClick={() => loginWithEmail(email)} disabled={!email} loading={loading}>Send OTP →</Btn>
                </>
              ) : (
                <>
                  {devOtp && <InfoBox type="success">OTP for testing: <strong>{devOtp}</strong> <br/><span style={{fontSize:10}}>(In production this goes via SMS/email)</span></InfoBox>}
                  <FG label="Enter 6-Digit OTP" req>
                    <Inp type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" style={{ letterSpacing: "0.3em", fontSize: 18, textAlign: "center" }} />
                  </FG>
                  <Btn onClick={() => verifyOtpCode(otp)} disabled={otp.length !== 6} loading={loading} v="success">Verify & Sign In</Btn>
                </>
              )}
            </div>
          )}

          {tab === "google" && (
            <div>
              <InfoBox type="info">Google OAuth is configured for production deployment. Use Quick Demo or OTP tab for now.</InfoBox>
            </div>
          )}

          <div style={{ marginTop: 18, padding: "9px 11px", background: "#f8f9fa", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, marginBottom: 2 }}>🔒 BLOCKCHAIN SECURITY</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>Every action is cryptographically signed and recorded on Polygon Amoy blockchain. Users never handle crypto directly.</div>
          </div>
        </div>
        <p style={{ textAlign: "center", color: "#475569", fontSize: 10, marginTop: 14 }}>ContractPro v2.1 · Polygon Amoy Testnet · Ministry of Finance, GoI</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SIDEBAR & TOPBAR
// ══════════════════════════════════════════════════════════
const NAV = {
  gov_authority: [{ k:"dashboard",l:"Dashboard",i:"📊"},{k:"projects",l:"Projects",i:"📁"},{k:"approvals",l:"Approval Queue",i:"✅"},{k:"contractors",l:"Stakeholders",i:"👷"},{k:"payments",l:"Payments",i:"💰"}],
  contractor:    [{ k:"dashboard",l:"Dashboard",i:"📊"},{k:"milestones",l:"My Milestones",i:"🎯"},{k:"procurement",l:"Procurement",i:"🛒"},{k:"fund_requests",l:"Fund Requests",i:"📤"}],
  inspector:     [{ k:"dashboard",l:"Dashboard",i:"📊"},{k:"pending",l:"Pending Inspections",i:"🔍"},{k:"history",l:"Inspection History",i:"📜"}],
  auditor:       [{ k:"dashboard",l:"Dashboard",i:"📊"},{k:"audit_trail",l:"Audit Trail",i:"⛓️"},{k:"procurement_audit",l:"Procurement Records",i:"📦"},{k:"reputation",l:"Reputation Registry",i:"⭐"},{k:"payments",l:"Payment History",i:"💰"}],
};

function Sidebar({ user, view, setView, collapsed, setCollapsed }) {
  const r = ROLES[user.role];
  const nav = NAV[user.role] || [];
  return (
    <div style={{ width: collapsed?54:208, minHeight:"100vh", background:"#0f1f3d", display:"flex", flexDirection:"column", transition:"width 0.2s", flexShrink:0 }}>
      <div style={{ padding: collapsed?"15px 9px":"15px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:28,height:28,background:"linear-gradient(135deg,#e8a020,#f5c842)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0 }}>📜</div>
        {!collapsed && <span style={{ color:"#fff",fontWeight:800,fontSize:14,fontFamily:"'Playfair Display',serif" }}>ContractPro</span>}
        <button onClick={()=>setCollapsed(!collapsed)} style={{ marginLeft:"auto",background:"rgba(255,255,255,0.08)",border:"none",color:"#94a3b8",borderRadius:5,width:20,height:20,cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          {collapsed?"›":"‹"}
        </button>
      </div>
      <div style={{ padding:collapsed?"11px 9px":"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:8 }}>
        <div style={{ width:30,height:30,borderRadius:8,background:r.bg,color:r.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,flexShrink:0 }}>{user.initials}</div>
        {!collapsed && (
          <div style={{ overflow:"hidden" }}>
            <div style={{ color:"#f1f5f9",fontSize:11,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user.name}</div>
            <div style={{ color:"#64748b",fontSize:9 }}>{r.icon} {r.label}</div>
          </div>
        )}
      </div>
      <nav style={{ flex:1,padding:"9px 5px" }}>
        {nav.map(n => (
          <button key={n.k} onClick={()=>setView(n.k)}
            style={{ display:"flex",alignItems:"center",gap:7,width:"100%",padding:collapsed?"9px 0":"9px 11px",justifyContent:collapsed?"center":"flex-start",border:"none",borderRadius:7,background:view===n.k?"rgba(232,160,32,0.15)":"transparent",color:view===n.k?"#f5c842":"#94a3b8",fontWeight:view===n.k?700:500,fontSize:11,cursor:"pointer",marginBottom:2,fontFamily:"inherit" }}>
            <span style={{ fontSize:13,flexShrink:0 }}>{n.i}</span>
            {!collapsed && n.l}
          </button>
        ))}
      </nav>
      <div style={{ padding:"9px 5px",borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ padding:collapsed?"5px 0":"5px 11px",display:"flex",alignItems:"center",gap:5,justifyContent:collapsed?"center":"flex-start" }}>
          <div style={{ width:6,height:6,borderRadius:3,background:"#22c55e",flexShrink:0 }}/>
          {!collapsed && <span style={{ color:"#475569",fontSize:9 }}>Polygon Amoy Connected</span>}
        </div>
      </div>
    </div>
  );
}

function TopBar({ user, view, onLogout, refreshing }) {
  const r = ROLES[user.role];
  const nav = NAV[user.role] || [];
  const title = nav.find(n=>n.k===view)?.l || "Dashboard";
  return (
    <div style={{ height:54,background:"#fff",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",padding:"0 18px",gap:10,flexShrink:0 }}>
      <div style={{ flex:1 }}>
        <span style={{ fontSize:14,fontWeight:800,color:"#111827" }}>{title}</span>
        <span style={{ color:"#9ca3af",fontSize:11,marginLeft:7 }}>· {r.icon} {r.label}</span>
        {refreshing && <span style={{ color:"#3b82f6",fontSize:10,marginLeft:10 }}>⟳ Syncing blockchain...</span>}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:9 }}>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#111827" }}>{user.name}</div>
          <div style={{ fontSize:9,color:"#6b7280" }}>
            Rep: {user.reputation}/100 · {user.wallet_address ? `${user.wallet_address.slice(0,6)}...${user.wallet_address.slice(-4)}` : "Wallet pending"}
          </div>
        </div>
        <div style={{ width:30,height:30,borderRadius:8,background:r.bg,color:r.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10 }}>{user.initials}</div>
        <button onClick={onLogout} style={{ background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>Logout</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// GOV VIEWS
// ══════════════════════════════════════════════════════════
function GovDashboard({ data, user }) {
  const myProjects = data.projects.filter(p => p.gov_id === user.id);
  const pending = data.milestones.filter(m => !m.gov_approval && m.insp_approval === "approved");
  const totalPaid = data.payments.filter(p => p.status === "released").reduce((a,b) => a+b.amount, 0);
  return (
    <div>
      <div style={{ display:"flex",gap:13,marginBottom:18,flexWrap:"wrap" }}>
        <StatCard label="Total Projects" value={myProjects.length} icon="📁" color="#1e3a5f"/>
        <StatCard label="Active" value={myProjects.filter(p=>p.status==="active").length} icon="🟢" color="#16a34a"/>
        <StatCard label="Awaiting Approval" value={pending.length} icon="⏳" color="#d97706" sub="Inspector approved"/>
        <StatCard label="Total Disbursed" value={fmt(totalPaid)} icon="💰" color="#7c3aed"/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <div style={{ background:"#fff",borderRadius:12,padding:17,boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
          <h4 style={{ margin:"0 0 11px",fontWeight:800,fontSize:13 }}>Project Overview</h4>
          {myProjects.map(p => (
            <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontWeight:700,fontSize:12 }}>{p.title}</div>
                <div style={{ fontSize:10,color:"#6b7280" }}>{p.category} · {fmt(p.budget)}</div>
              </div>
              <Badge s={p.status}/>
            </div>
          ))}
          {myProjects.length === 0 && <p style={{ color:"#6b7280",fontSize:12 }}>No projects yet. Create one!</p>}
        </div>
        <div style={{ background:"#fff",borderRadius:12,padding:17,boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
          <h4 style={{ margin:"0 0 11px",fontWeight:800,fontSize:13 }}>🔔 Pending Final Approvals</h4>
          {pending.length === 0 ? <p style={{ color:"#6b7280",fontSize:12 }}>All clear — nothing awaiting approval.</p> :
            pending.map(m => {
              const prj = data.projects.find(p=>p.id===m.project_id);
              return (
                <div key={m.id} style={{ padding:"8px 9px",marginBottom:6,background:"#fff9f0",borderRadius:7,border:"1px solid #fde68a" }}>
                  <div style={{ fontWeight:700,fontSize:12 }}>{m.title}</div>
                  <div style={{ fontSize:10,color:"#6b7280" }}>{prj?.title?.split(" ").slice(0,3).join(" ")} · {fmt(m.amount)}</div>
                  <div style={{ fontSize:10,color:"#92400e",marginTop:2 }}>Inspector: {m.insp_notes?.slice(0,55)}...</div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

function GovProjects({ data, user, refresh }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showMilestone, setShowMilestone] = useState(null);
  const [showReassign, setShowReassign] = useState(null);
  const [form, setForm] = useState({ title:"",desc:"",budget:"",location:"",category:"",contractorId:"",inspectorId:"" });
  const [mForm, setMForm] = useState({ title:"",desc:"",amount:"",seq:"" });
  const [loading, setLoading] = useState(false);
  const [txInfo, setTxInfo] = useState(null);

  const contractors = data.users.filter(u=>u.role==="contractor");
  const inspectors  = data.users.filter(u=>u.role==="inspector");

  const createProject = async () => {
    if (!form.title||!form.budget||!form.contractorId||!form.inspectorId) return;
    setLoading(true); setTxInfo(null);
    try {
      const res = await call("blockchain-actions", { action:"create_project", userId:user.id, title:form.title, description:form.desc, budget:+form.budget, location:form.location, category:form.category, contractorId:form.contractorId, inspectorId:form.inspectorId });
      setTxInfo(res.txHash);
      setShowCreate(false); setForm({title:"",desc:"",budget:"",location:"",category:"",contractorId:"",inspectorId:""});
      refresh();
    } catch(e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  const addMilestone = async (pid) => {
    if (!mForm.title||!mForm.amount) return;
    setLoading(true);
    try {
      await call("blockchain-actions", { action:"define_milestone", userId:user.id, projectId:pid, title:mForm.title, description:mForm.desc, amount:+mForm.amount, seq:+mForm.seq||1 });
      setShowMilestone(null); setMForm({title:"",desc:"",amount:"",seq:""});
      refresh();
    } catch(e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  const reassign = async (pid, newCid) => {
    setLoading(true);
    try {
      await call("blockchain-actions", { action:"reassign_contractor", userId:user.id, projectId:pid, newContractorId:newCid });
      setShowReassign(null); refresh();
    } catch(e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:16 }}>
        <h3 style={{ margin:0,fontWeight:800,fontSize:15 }}>All Projects</h3>
        <Btn onClick={()=>setShowCreate(true)} v="gold">+ Create New Project</Btn>
      </div>
      {txInfo && txInfo !== "CONTRACT_NOT_DEPLOYED" && (
        <InfoBox type="success">✓ Recorded on Polygon! <TxBadge tx={txInfo}/></InfoBox>
      )}

      {data.projects.filter(p=>p.gov_id===user.id).map(p => {
        const pMs = data.milestones.filter(m=>m.project_id===p.id);
        const paid = data.payments.filter(pay=>pay.project_id===p.id&&pay.status==="released").reduce((a,b)=>a+b.amount,0);
        const contr = data.users.find(u=>u.id===p.contractor_id);
        const insp  = data.users.find(u=>u.id===p.inspector_id);
        return (
          <div key={p.id} style={{ background:"#fff",borderRadius:13,padding:18,marginBottom:12,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:p.status==="on_hold"?"2px solid #fde68a":"1px solid #f3f4f6" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9 }}>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                  <span style={{ fontWeight:800,fontSize:14 }}>{p.title}</span>
                  <Badge s={p.status}/>
                </div>
                <div style={{ fontSize:10,color:"#6b7280" }}>{p.category} · {p.location} · Budget: {fmt(p.budget)} · Paid: {fmt(paid)}</div>
                <div style={{ fontSize:10,color:"#6b7280",marginTop:1 }}>Contractor: {contr?.name} · Inspector: {insp?.name}</div>
                {p.creation_tx_hash && <div style={{ marginTop:3 }}>Chain: <TxBadge tx={p.creation_tx_hash}/></div>}
              </div>
              <div style={{ display:"flex",gap:6 }}>
                <Btn sm onClick={()=>setShowMilestone(p.id)} v="outline">+ Milestone</Btn>
                {p.status==="on_hold" && <Btn sm onClick={()=>setShowReassign(p.id)} v="warn">Reassign</Btn>}
              </div>
            </div>
            {pMs.length > 0 && (
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:"#9ca3af",marginBottom:5 }}>MILESTONES</div>
                {pMs.sort((a,b)=>a.seq-b.seq).map(m => (
                  <div key={m.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 9px",background:"#f9fafb",borderRadius:7,marginBottom:4 }}>
                    <div style={{ width:18,height:18,borderRadius:5,background:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#6b7280" }}>{m.seq}</div>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:700,fontSize:11 }}>{m.title}</span>
                      <span style={{ color:"#6b7280",fontSize:10,marginLeft:7 }}>{fmt(m.amount)}</span>
                    </div>
                    <Badge s={m.status}/>
                    {m.definition_tx_hash && <TxBadge tx={m.definition_tx_hash}/>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {data.projects.filter(p=>p.gov_id===user.id).length === 0 && (
        <div style={{ background:"#fff",borderRadius:12,padding:40,textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:36,marginBottom:10 }}>📁</div>
          <div style={{ color:"#6b7280",fontSize:14 }}>No projects yet. Create your first government project.</div>
        </div>
      )}

      {showCreate && (
        <Modal title="Create New Project" onClose={()=>setShowCreate(false)} wide>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
            <FG label="Project Title" req><Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g., NH-48 Highway Expansion"/></FG>
            <FG label="Budget (₹)" req><Inp type="number" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))} placeholder="e.g., 45000000"/></FG>
            <FG label="Location"><Inp value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="State / District"/></FG>
            <FG label="Category"><Sel value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}><option value="">Select...</option>{["Road Infrastructure","Bridge","Urban Infrastructure","Water Supply","Public Building","Rural Development"].map(c=><option key={c}>{c}</option>)}</Sel></FG>
            <FG label="Assign Contractor" req><Sel value={form.contractorId} onChange={e=>setForm(f=>({...f,contractorId:e.target.value}))}><option value="">Select contractor</option>{contractors.map(c=><option key={c.id} value={c.id}>{c.name} (Rep: {c.reputation})</option>)}</Sel></FG>
            <FG label="Assign Inspector" req><Sel value={form.inspectorId} onChange={e=>setForm(f=>({...f,inspectorId:e.target.value}))}><option value="">Select inspector</option>{inspectors.map(i=><option key={i.id} value={i.id}>{i.name} (Rep: {i.reputation})</option>)}</Sel></FG>
          </div>
          <FG label="Description"><Txta value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Project scope and objectives..."/></FG>
          <InfoBox type="info">🔗 Creating this project will write a transaction to <strong>Polygon Amoy blockchain</strong>. The record will be permanently immutable.</InfoBox>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={createProject} v="gold" loading={loading}>Create & Record on Blockchain</Btn>
            <Btn onClick={()=>setShowCreate(false)} v="ghost">Cancel</Btn>
          </div>
        </Modal>
      )}

      {showMilestone && (
        <Modal title="Add Milestone" onClose={()=>setShowMilestone(null)}>
          <FG label="Milestone Title" req><Inp value={mForm.title} onChange={e=>setMForm(f=>({...f,title:e.target.value}))} placeholder="e.g., Foundation & Sub-base Layer"/></FG>
          <FG label="Payment Amount (₹)" req><Inp type="number" value={mForm.amount} onChange={e=>setMForm(f=>({...f,amount:e.target.value}))} placeholder="Released on completion"/></FG>
          <FG label="Sequence No."><Inp type="number" value={mForm.seq} onChange={e=>setMForm(f=>({...f,seq:e.target.value}))} placeholder="1, 2, 3..."/></FG>
          <FG label="Description"><Txta value={mForm.desc} onChange={e=>setMForm(f=>({...f,desc:e.target.value}))} placeholder="Scope of work..."/></FG>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={()=>addMilestone(showMilestone)} v="primary" loading={loading}>Add Milestone on Chain</Btn>
            <Btn onClick={()=>setShowMilestone(null)} v="ghost">Cancel</Btn>
          </div>
        </Modal>
      )}

      {showReassign && (
        <Modal title="Reassign Contractor" onClose={()=>setShowReassign(null)}>
          <InfoBox type="warn">Reassigning will resume the project and reset the rejected milestone.</InfoBox>
          {contractors.map(c => (
            <button key={c.id} onClick={()=>reassign(showReassign,c.id)} disabled={loading}
              style={{ display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"11px 13px",border:"1.5px solid #d1d5db",borderRadius:9,marginBottom:7,cursor:"pointer",background:"#fafafa",fontFamily:"inherit" }}>
              <div>
                <div style={{ fontWeight:700,fontSize:13 }}>{c.name}</div>
                <div style={{ fontSize:10,color:"#6b7280" }}>Reputation: {c.reputation}/100 · {c.wallet_address ? c.wallet_address.slice(0,12)+"..." : "Wallet pending"}</div>
              </div>
              <Btn sm v="outline">Assign</Btn>
            </button>
          ))}
        </Modal>
      )}
    </div>
  );
}

function GovApprovals({ data, user, refresh }) {
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState({});
  const pending = data.milestones.filter(m=>m.insp_approval==="approved"&&!m.gov_approval);

  const decide = async (mid, action) => {
    setLoading(l=>({...l,[mid]:true}));
    try {
      const res = await call("blockchain-actions", { action, userId:user.id, milestoneId:mid, notes:notes[mid]||"" });
      if (action==="gov_approve") {
        alert(`✓ Payment of ${fmt(data.milestones.find(m=>m.id===mid)?.amount)} released via Smart Contract!\nTx: ${res.txHash}`);
      }
      refresh();
    } catch(e) { alert("Error: " + e.message); }
    setLoading(l=>({...l,[mid]:false}));
  };

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h3 style={{ margin:"0 0 3px",fontWeight:800,fontSize:15 }}>Final Approval Queue</h3>
        <p style={{ margin:0,color:"#6b7280",fontSize:11 }}>Smart Contract releases payment automatically after your approval — no manual transfer needed.</p>
      </div>
      {pending.length === 0 ? (
        <div style={{ background:"#fff",borderRadius:12,padding:36,textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:36,marginBottom:10 }}>✅</div>
          <div style={{ color:"#6b7280",fontSize:14 }}>No milestones pending your approval</div>
        </div>
      ) : pending.map(m => {
        const proj = data.projects.find(p=>p.id===m.project_id);
        const procs = data.procurements.filter(pr=>pr.milestone_id===m.id);
        return (
          <div key={m.id} style={{ background:"#fff",borderRadius:13,padding:18,marginBottom:13,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:"2px solid #cffafe" }}>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:3 }}>{m.title}</div>
            <div style={{ fontSize:10,color:"#6b7280",marginBottom:8 }}>{proj?.title} · Seq #{m.seq} · Release: <strong style={{color:"#0f2d5e"}}>{fmt(m.amount)}</strong></div>
            <div style={{ padding:"7px 10px",background:"#d1fae5",borderRadius:7,fontSize:11,color:"#065f46",marginBottom:10 }}>
              <strong>Inspector Notes:</strong> {m.insp_notes}
              {m.insp_approval_tx_hash && <span style={{marginLeft:8}}><TxBadge tx={m.insp_approval_tx_hash}/></span>}
            </div>
            <div style={{ fontSize:10,color:"#6b7280",marginBottom:6 }}>Procurement: {procs.length} items · {fmt(procs.reduce((a,b)=>a+b.cost,0))}</div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
              {procs.map(pr=>(
                <div key={pr.id} style={{ padding:"4px 9px",background:"#f0f4ff",borderRadius:7,fontSize:10 }}>
                  {pr.item_name} · {fmt(pr.cost)} {pr.record_tx_hash&&<TxBadge tx={pr.record_tx_hash}/>}
                </div>
              ))}
            </div>
            <FG label="Your Decision Notes">
              <Txta value={notes[m.id]||""} onChange={e=>setNotes(n=>({...n,[m.id]:e.target.value}))} placeholder="Add decision notes..." style={{minHeight:50}}/>
            </FG>
            <InfoBox type="info">Clicking Approve triggers the Smart Contract — funds release to contractor's blockchain wallet automatically.</InfoBox>
            <div style={{ display:"flex",gap:8 }}>
              <Btn onClick={()=>decide(m.id,"gov_approve")} v="success" loading={loading[m.id]}>✓ Approve & Release {fmt(m.amount)} via Smart Contract</Btn>
              <Btn onClick={()=>decide(m.id,"gov_reject")} v="danger" disabled={loading[m.id]}>✗ Reject</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GovPayments({ data }) {
  return (
    <div>
      <h3 style={{ margin:"0 0 16px",fontWeight:800,fontSize:15 }}>Payment History — Smart Contract Releases</h3>
      <div style={{ background:"#fff",borderRadius:13,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11 }}>
          <thead><tr style={{ background:"#f8fafc" }}>{["Milestone","Contractor","Amount","Block","Blockchain Tx","Released At"].map(h=><th key={h} style={{ padding:"10px 13px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:10,borderBottom:"1px solid #e5e7eb" }}>{h}</th>)}</tr></thead>
          <tbody>
            {data.payments.map(p => {
              const m = data.milestones.find(x=>x.id===p.milestone_id);
              const contr = data.users.find(u=>u.id===p.contractor_id);
              return (
                <tr key={p.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                  <td style={{ padding:"10px 13px",fontWeight:700 }}>{m?.title}</td>
                  <td style={{ padding:"10px 13px" }}>{contr?.name}</td>
                  <td style={{ padding:"10px 13px",fontWeight:800,color:"#16a34a" }}>{fmt(p.amount)}</td>
                  <td style={{ padding:"10px 13px",color:"#6b7280" }}>{p.block_number||"—"}</td>
                  <td style={{ padding:"10px 13px" }}><TxBadge tx={p.tx_hash}/></td>
                  <td style={{ padding:"10px 13px",color:"#6b7280" }}>{fmtTime(p.released_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.payments.length===0&&<div style={{ padding:36,textAlign:"center",color:"#6b7280" }}>No payments released yet</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// CONTRACTOR VIEWS
// ══════════════════════════════════════════════════════════
function ContractorMilestones({ data, user, refresh }) {
  const [loading, setLoading] = useState({});
  const myMs = data.milestones.filter(m=>m.contractor_id===user.id);

  const submit = async (mid) => {
    setLoading(l=>({...l,[mid]:true}));
    try {
      const res = await call("blockchain-actions", { action:"submit_milestone", userId:user.id, milestoneId:mid });
      refresh();
    } catch(e) { alert("Error: "+e.message); }
    setLoading(l=>({...l,[mid]:false}));
  };

  return (
    <div>
      <h3 style={{ margin:"0 0 16px",fontWeight:800,fontSize:15 }}>My Milestones</h3>
      {myMs.length===0&&<InfoBox type="info">No milestones assigned yet. Wait for Government Authority to define milestones for your projects.</InfoBox>}
      {myMs.sort((a,b)=>a.seq-b.seq).map(m => {
        const proj = data.projects.find(p=>p.id===m.project_id);
        const procs = data.procurements.filter(pr=>pr.milestone_id===m.id);
        const canSubmit = (m.status==="active"||m.status==="not_started") && procs.length>0;
        return (
          <div key={m.id} style={{ background:"#fff",borderRadius:13,padding:17,marginBottom:11,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",opacity:m.status==="locked"?0.6:1,border:m.status==="rejected"?"2px solid #fecaca":"1px solid #f3f4f6" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7 }}>
              <div>
                <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:3 }}>
                  <span style={{ fontWeight:800,fontSize:13 }}>#{m.seq} {m.title}</span>
                  <Badge s={m.status}/>
                </div>
                <div style={{ fontSize:10,color:"#6b7280" }}>{proj?.title} · Payment: <strong>{fmt(m.amount)}</strong></div>
                {m.definition_tx_hash&&<div style={{marginTop:2}}>Defined on chain: <TxBadge tx={m.definition_tx_hash}/></div>}
                {m.status==="rejected"&&<div style={{ marginTop:6,padding:"6px 9px",background:"#fee2e2",borderRadius:7,fontSize:11,color:"#991b1b" }}><strong>Rejection:</strong> {m.insp_notes||m.gov_notes}</div>}
              </div>
              {canSubmit&&<Btn sm onClick={()=>submit(m.id)} v="success" loading={loading[m.id]}>Submit for Inspection</Btn>}
            </div>
            <div style={{ fontSize:10,color:"#6b7280" }}>Procurement: {procs.length} items · {fmt(procs.reduce((a,b)=>a+b.cost,0))}</div>
            {procs.length===0&&(m.status==="active"||m.status==="not_started")&&<InfoBox type="warn">Add procurement records first before submitting.</InfoBox>}
            {m.payment_tx_hash&&m.payment_tx_hash!=="CONTRACT_NOT_DEPLOYED"&&(
              <div style={{ marginTop:6,padding:"6px 9px",background:"#d1fae5",borderRadius:7,fontSize:10,color:"#065f46" }}>
                💰 Payment released via Smart Contract: <TxBadge tx={m.payment_tx_hash}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ContractorProcurement({ data, user, refresh }) {
  const [form, setForm] = useState({ mid:"",item:"",supplier:"",type:"",cost:"",invRef:"" });
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const myMs = data.milestones.filter(m=>m.contractor_id===user.id&&["active","not_started"].includes(m.status));
  const myProc = data.procurements.filter(pr=>pr.contractor_id===user.id);

  const submit = async () => {
    if (!form.mid||!form.item||!form.supplier||!form.cost||!form.invRef) return;
    setLoading(true);
    try {
      const docHash = sha256sim(form.invRef + form.cost + form.item);
      const res = await call("blockchain-actions", { action:"record_procurement", userId:user.id, milestoneId:form.mid, itemName:form.item, supplierName:form.supplier, materialType:form.type, cost:+form.cost, invoiceRef:form.invRef, documentHash:docHash });
      setLastTx(res.txHash);
      setForm({ mid:"",item:"",supplier:"",type:"",cost:"",invRef:"" });
      refresh();
    } catch(e) { alert("Error: "+e.message); }
    setLoading(false);
  };

  const docHash = form.invRef&&form.cost&&form.item ? sha256sim(form.invRef+form.cost+form.item) : null;

  return (
    <div style={{ display:"grid",gridTemplateColumns:"390px 1fr",gap:18 }}>
      <div style={{ background:"#fff",borderRadius:13,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px",fontWeight:800,fontSize:14 }}>Record Material Purchase</h3>
        {lastTx&&<InfoBox type="success">✓ Recorded on blockchain! <TxBadge tx={lastTx}/></InfoBox>}
        <FG label="Milestone" req>
          <Sel value={form.mid} onChange={e=>setForm(f=>({...f,mid:e.target.value}))}>
            <option value="">Select milestone</option>
            {myMs.map(m=>{const p=data.projects.find(x=>x.id===m.project_id);return <option key={m.id} value={m.id}>#{m.seq} {m.title} ({p?.title?.split(" ").slice(0,2).join(" ")})</option>;})}
          </Sel>
        </FG>
        <FG label="Item / Material Name" req><Inp value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} placeholder="e.g., Portland Cement OPC 53"/></FG>
        <FG label="Supplier Name" req><Inp value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} placeholder="e.g., UltraTech Cement Ltd."/></FG>
        <FG label="Material Type">
          <Sel value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            <option value="">Select type</option>
            {["Binding Material","Aggregate","Sub-base Material","Bituminous Material","Steel/Reinforcement","Drainage Material","Electrical","Other"].map(t=><option key={t}>{t}</option>)}
          </Sel>
        </FG>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 11px" }}>
          <FG label="Cost (₹)" req><Inp type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="Amount"/></FG>
          <FG label="Invoice Ref" req><Inp value={form.invRef} onChange={e=>setForm(f=>({...f,invRef:e.target.value}))} placeholder="INV-2025-XXXX"/></FG>
        </div>
        {docHash && (
          <div style={{ padding:"8px 11px",background:"#f0f4ff",borderRadius:8,marginBottom:12 }}>
            <div style={{ fontSize:9,color:"#6b7280",marginBottom:3 }}>Document Hash (stored on Polygon):</div>
            <code style={{ fontSize:10,color:"#3730a3" }}>{docHash}</code>
          </div>
        )}
        <InfoBox type="info">🔗 Invoice hash is stored <strong>immutably on Polygon blockchain</strong>. Any tampering produces a different hash — fraud is mathematically detectable.</InfoBox>
        <Btn onClick={submit} v="primary" loading={loading} disabled={!form.mid||!form.item||!form.supplier||!form.cost||!form.invRef}>Record on Blockchain 🔗</Btn>
      </div>

      <div style={{ background:"#fff",borderRadius:13,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px",fontWeight:800,fontSize:14 }}>My Procurement Records</h3>
        {myProc.length===0?<p style={{color:"#6b7280"}}>No records yet.</p>:
          myProc.map(pr=>{
            const m=data.milestones.find(x=>x.id===pr.milestone_id);
            return (
              <div key={pr.id} style={{ padding:"11px 13px",marginBottom:9,border:"1px solid #e5e7eb",borderRadius:10,background:"#fafafa" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontWeight:700,fontSize:12 }}>{pr.item_name}</span>
                  <span style={{ fontWeight:800,color:"#0f2d5e",fontSize:12 }}>{fmt(pr.cost)}</span>
                </div>
                <div style={{ fontSize:10,color:"#6b7280" }}>Supplier: {pr.supplier_name} · {pr.material_type}</div>
                <div style={{ fontSize:10,color:"#6b7280" }}>Milestone: {m?.title} · Invoice: {pr.invoice_ref}</div>
                <div style={{ marginTop:4,fontSize:10 }}>🔒 Hash: <code style={{color:"#3730a3",fontSize:9}}>{pr.document_hash}</code></div>
                {pr.record_tx_hash&&<div style={{marginTop:3}}>Chain: <TxBadge tx={pr.record_tx_hash}/></div>}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

function ContractorFundRequests({ data, user, refresh }) {
  const [form, setForm] = useState({ mid:"",amount:"",reason:"" });
  const [loading, setLoading] = useState(false);
  const myMs = data.milestones.filter(m=>m.contractor_id===user.id&&["active","not_started"].includes(m.status));
  const myFR = data.fund_requests.filter(fr=>fr.contractor_id===user.id);

  const submit = async () => {
    if (!form.mid||!form.amount||!form.reason) return;
    setLoading(true);
    try {
      const m = data.milestones.find(x=>x.id===form.mid);
      await call("blockchain-actions", { action:"submit_fund_request", userId:user.id, milestoneId:form.mid, projectId:m?.project_id, amount:+form.amount, reason:form.reason });
      setForm({mid:"",amount:"",reason:""}); refresh();
    } catch(e) { alert("Error: "+e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display:"grid",gridTemplateColumns:"370px 1fr",gap:18 }}>
      <div style={{ background:"#fff",borderRadius:13,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px",fontWeight:800,fontSize:14 }}>Request Fund Advance</h3>
        <FG label="Milestone" req><Sel value={form.mid} onChange={e=>setForm(f=>({...f,mid:e.target.value}))}><option value="">Select</option>{myMs.map(m=><option key={m.id} value={m.id}>#{m.seq} {m.title}</option>)}</Sel></FG>
        <FG label="Amount (₹)" req><Inp type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="Amount needed"/></FG>
        <FG label="Reason / Justification" req><Txta value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder="What will funds be used for..."/></FG>
        <Btn onClick={submit} loading={loading} disabled={!form.mid||!form.amount||!form.reason}>Submit Request</Btn>
      </div>
      <div style={{ background:"#fff",borderRadius:13,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px",fontWeight:800,fontSize:14 }}>My Fund Requests</h3>
        {myFR.length===0?<p style={{color:"#6b7280"}}>No requests yet.</p>:
          myFR.map(fr=>{const m=data.milestones.find(x=>x.id===fr.milestone_id);return (
            <div key={fr.id} style={{ padding:"11px",marginBottom:9,border:"1px solid #e5e7eb",borderRadius:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                <span style={{ fontWeight:700,fontSize:12 }}>{m?.title}</span>
                <span style={{ fontWeight:800,color:"#0f2d5e",fontSize:12 }}>{fmt(fr.amount)}</span>
              </div>
              <p style={{ margin:"0 0 6px",fontSize:11,color:"#374151" }}>{fr.reason}</p>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:9,color:"#6b7280" }}>{fmtDate(fr.created_at)}</span>
                <Badge s={fr.status}/>
              </div>
            </div>
          );})
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// INSPECTOR VIEWS
// ══════════════════════════════════════════════════════════
function InspectorPending({ data, user, refresh }) {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState({});
  const pending = data.milestones.filter(m=>m.inspector_id===user.id&&m.status==="pending_inspection");

  const decide = async (mid, action) => {
    if (action==="inspector_reject"&&!notes.trim()) { alert("Please provide rejection notes."); return; }
    setLoading(l=>({...l,[mid]:true}));
    try {
      await call("blockchain-actions", { action, userId:user.id, milestoneId:mid, notes });
      setSelected(null); setNotes(""); refresh();
    } catch(e) { alert("Error: "+e.message); }
    setLoading(l=>({...l,[mid]:false}));
  };

  return (
    <div>
      <h3 style={{ margin:"0 0 16px",fontWeight:800,fontSize:15 }}>Pending Inspections</h3>
      {pending.length===0?(
        <div style={{ background:"#fff",borderRadius:12,padding:36,textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:36,marginBottom:10 }}>🔍</div>
          <div style={{ color:"#6b7280" }}>No milestones pending inspection</div>
        </div>
      ):pending.map(m=>{
        const proj=data.projects.find(p=>p.id===m.project_id);
        const procs=data.procurements.filter(pr=>pr.milestone_id===m.id);
        const isOpen=selected===m.id;
        return (
          <div key={m.id} style={{ background:"#fff",borderRadius:13,padding:18,marginBottom:13,boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:800,fontSize:14,marginBottom:3 }}>{m.title}</div>
                <div style={{ fontSize:10,color:"#6b7280" }}>{proj?.title} · Seq #{m.seq} · {fmt(m.amount)}</div>
                <div style={{ fontSize:10,color:"#6b7280" }}>Submitted: {fmtDate(m.submitted_at)}</div>
                {m.submission_tx_hash&&<div style={{marginTop:2}}>Submit tx: <TxBadge tx={m.submission_tx_hash}/></div>}
              </div>
              <Btn sm onClick={()=>{setSelected(isOpen?null:m.id);setNotes("")}} v={isOpen?"ghost":"outline"}>{isOpen?"Collapse":"Review & Decide"}</Btn>
            </div>
            {isOpen&&(
              <div>
                <HR/>
                <h5 style={{ margin:"0 0 9px",color:"#374151",fontSize:12 }}>📦 Procurement Records ({procs.length})</h5>
                {procs.length===0?<InfoBox type="warn">No procurement records found.</InfoBox>:(
                  <div style={{ overflow:"auto",marginBottom:13 }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:10 }}>
                      <thead><tr style={{background:"#f8fafc"}}>{["Item","Supplier","Cost","Invoice Ref","Hash","Chain Tx","Date"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",fontWeight:700,color:"#6b7280",borderBottom:"1px solid #e5e7eb"}}>{h}</th>)}</tr></thead>
                      <tbody>{procs.map(pr=>(
                        <tr key={pr.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                          <td style={{padding:"7px 10px",fontWeight:600}}>{pr.item_name}</td>
                          <td style={{padding:"7px 10px"}}>{pr.supplier_name}</td>
                          <td style={{padding:"7px 10px",fontWeight:700,color:"#0f2d5e"}}>{fmt(pr.cost)}</td>
                          <td style={{padding:"7px 10px"}}><code style={{fontSize:9}}>{pr.invoice_ref}</code></td>
                          <td style={{padding:"7px 10px"}}><code style={{fontSize:9,color:"#3730a3"}}>{pr.document_hash?.slice(0,14)}...</code></td>
                          <td style={{padding:"7px 10px"}}><TxBadge tx={pr.record_tx_hash}/></td>
                          <td style={{padding:"7px 10px",color:"#6b7280"}}>{fmtDate(pr.created_at)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <FG label="Inspection Notes (required for rejection)">
                  <Txta value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Quality check findings, material verification, issues found..."/>
                </FG>
                <InfoBox type="warn">⚠️ Your decision is recorded permanently on Polygon blockchain. Rejection places the project On Hold and penalizes contractor reputation.</InfoBox>
                <div style={{ display:"flex",gap:8 }}>
                  <Btn onClick={()=>decide(m.id,"inspector_approve")} v="success" loading={loading[m.id]}>✓ Approve — Forward to Gov Authority</Btn>
                  <Btn onClick={()=>decide(m.id,"inspector_reject")} v="danger" disabled={!notes.trim()||loading[m.id]}>✗ Reject</Btn>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InspectorHistory({ data, user }) {
  const done = data.milestones.filter(m=>m.inspector_id===user.id&&m.insp_approval!=null);
  return (
    <div>
      <h3 style={{ margin:"0 0 16px",fontWeight:800,fontSize:15 }}>Inspection History</h3>
      <div style={{ background:"#fff",borderRadius:13,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11 }}>
          <thead><tr style={{background:"#f8fafc"}}>{["Milestone","Project","Amount","Decision","Chain Tx","Date"].map(h=><th key={h} style={{padding:"10px 13px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:10,borderBottom:"1px solid #e5e7eb"}}>{h}</th>)}</tr></thead>
          <tbody>{done.map(m=>{const p=data.projects.find(x=>x.id===m.project_id);return (
            <tr key={m.id} style={{borderBottom:"1px solid #f3f4f6"}}>
              <td style={{padding:"10px 13px",fontWeight:700}}>{m.title}</td>
              <td style={{padding:"10px 13px",color:"#374151"}}>{p?.title?.split(" ").slice(0,3).join(" ")}</td>
              <td style={{padding:"10px 13px",fontWeight:700,color:"#0f2d5e"}}>{fmt(m.amount)}</td>
              <td style={{padding:"10px 13px"}}><Badge s={m.insp_approval}/></td>
              <td style={{padding:"10px 13px"}}><TxBadge tx={m.insp_approval_tx_hash}/></td>
              <td style={{padding:"10px 13px",color:"#6b7280"}}>{fmtDate(m.submitted_at)}</td>
            </tr>
          );})}
          </tbody>
        </table>
        {done.length===0&&<div style={{padding:36,textAlign:"center",color:"#6b7280"}}>No inspection history yet</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AUDITOR VIEWS
// ══════════════════════════════════════════════════════════
function AuditTrail({ data }) {
  const [filter, setFilter] = useState("all");
  const types = [...new Set(data.audit_logs.map(l=>l.action))];
  const filtered = filter==="all" ? data.audit_logs : data.audit_logs.filter(l=>l.action===filter);
  const colors = { PROJECT_CREATED:"#2563eb",CONTRACTOR_ASSIGNED:"#7c3aed",MILESTONE_DEFINED:"#0891b2",PROCUREMENT_RECORDED:"#065f46",MILESTONE_SUBMITTED:"#d97706",MILESTONE_APPROVED_INSP:"#16a34a",MILESTONE_APPROVED_GOV:"#059669",MILESTONE_REJECTED_INSP:"#dc2626",MILESTONE_REJECTED_GOV:"#b91c1c",PAYMENT_RELEASED:"#0369a1",PROJECT_ON_HOLD:"#d97706",FUND_REQUEST_SUBMITTED:"#7c3aed",CONTRACTOR_REASSIGNED:"#92400e" };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <div>
          <h3 style={{ margin:"0 0 2px",fontWeight:800,fontSize:15 }}>Blockchain Audit Trail</h3>
          <p style={{ margin:0,fontSize:10,color:"#6b7280" }}>Every entry below has a corresponding immutable transaction on Polygon Amoy. Click any 🔗 tx to verify on PolygonScan.</p>
        </div>
        <Sel value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:"auto",padding:"5px 9px",fontSize:11 }}>
          <option value="all">All ({data.audit_logs.length})</option>
          {types.map(a=><option key={a} value={a}>{a}</option>)}
        </Sel>
      </div>
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute",left:17,top:0,bottom:0,width:2,background:"linear-gradient(#1e3a5f,#e8a020)",borderRadius:2 }}/>
        {[...filtered].slice(0,100).map(log => {
          const actor = data.users.find(u=>u.id===log.performed_by)||{name:log.performed_by_label||log.performed_by||"System"};
          const color = colors[log.action]||"#6b7280";
          return (
            <div key={log.id} style={{ display:"flex",gap:14,marginBottom:13,paddingLeft:44,position:"relative" }}>
              <div style={{ position:"absolute",left:9,top:7,width:16,height:16,borderRadius:8,background:color,border:"2px solid #fff",zIndex:1 }}/>
              <div style={{ flex:1,background:"#fff",borderRadius:11,padding:"12px 15px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5 }}>
                  <div>
                    <span style={{ background:color+"18",color,padding:"2px 8px",borderRadius:11,fontSize:9,fontWeight:700,marginRight:7 }}>{log.action}</span>
                    <span style={{ fontSize:11,color:"#111827",fontWeight:600 }}>{log.description}</span>
                  </div>
                  <span style={{ fontSize:9,color:"#9ca3af",whiteSpace:"nowrap",marginLeft:10 }}>{fmtTime(log.created_at)}</span>
                </div>
                <div style={{ display:"flex",gap:13,flexWrap:"wrap",alignItems:"center" }}>
                  <span style={{ fontSize:9,color:"#6b7280" }}>By: <strong>{actor.name}</strong></span>
                  {log.tx_hash&&<span style={{ fontSize:9,color:"#6b7280" }}>Tx: <TxBadge tx={log.tx_hash}/></span>}
                  {log.data_hash&&<span style={{ fontSize:9,color:"#6b7280" }}>Hash: <code style={{fontSize:9,color:"#3730a3"}}>{log.data_hash?.slice(0,16)}...</code></span>}
                  {log.block_number&&<span style={{ fontSize:9,color:"#6b7280" }}>Block: #{log.block_number}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<p style={{color:"#6b7280",paddingLeft:44}}>No audit entries found.</p>}
      </div>
    </div>
  );
}

function ProcurementAudit({ data }) {
  return (
    <div>
      <h3 style={{ margin:"0 0 14px",fontWeight:800,fontSize:15 }}>Procurement Integrity Records</h3>
      <InfoBox type="success">All procurement document hashes are recorded immutably on Polygon blockchain. Click any tx link to independently verify on PolygonScan.</InfoBox>
      <div style={{ background:"#fff",borderRadius:13,overflow:"auto",boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:10 }}>
          <thead><tr style={{background:"#f8fafc"}}>{["Item","Supplier","Contractor","Milestone","Cost","Invoice","Document Hash","Chain Tx","Date"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:9,borderBottom:"1px solid #e5e7eb",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{data.procurements.map(pr=>{
            const m=data.milestones.find(x=>x.id===pr.milestone_id);
            const c=data.users.find(u=>u.id===pr.contractor_id);
            return (
              <tr key={pr.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"9px 12px",fontWeight:600}}>{pr.item_name}</td>
                <td style={{padding:"9px 12px"}}>{pr.supplier_name}</td>
                <td style={{padding:"9px 12px"}}>{c?.name}</td>
                <td style={{padding:"9px 12px",color:"#374151"}}>{m?.title?.split(" ").slice(0,3).join(" ")}</td>
                <td style={{padding:"9px 12px",fontWeight:700,color:"#0f2d5e"}}>{fmt(pr.cost)}</td>
                <td style={{padding:"9px 12px"}}><code style={{fontSize:9}}>{pr.invoice_ref}</code></td>
                <td style={{padding:"9px 12px"}}><code style={{color:"#3730a3",fontSize:9}}>{pr.document_hash?.slice(0,16)}...</code></td>
                <td style={{padding:"9px 12px"}}><TxBadge tx={pr.record_tx_hash}/></td>
                <td style={{padding:"9px 12px",color:"#6b7280"}}>{fmtDate(pr.created_at)}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {data.procurements.length===0&&<div style={{padding:36,textAlign:"center",color:"#6b7280"}}>No procurement records yet</div>}
      </div>
    </div>
  );
}

function ReputationRegistry({ data }) {
  return (
    <div>
      <h3 style={{ margin:"0 0 16px",fontWeight:800,fontSize:15 }}>Stakeholder Reputation Registry</h3>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14 }}>
        {data.users.filter(u=>["contractor","inspector"].includes(u.role)).map(u=>{
          const events=data.reputation_history.filter(r=>r.user_id===u.id);
          const gained=events.filter(e=>e.delta>0).reduce((a,b)=>a+b.delta,0);
          const lost=Math.abs(events.filter(e=>e.delta<0).reduce((a,b)=>a+b.delta,0));
          const bar=Math.min(100,Math.max(0,u.reputation));
          const barColor=u.reputation>=80?"#16a34a":u.reputation>=60?"#d97706":"#dc2626";
          return (
            <div key={u.id} style={{ background:"#fff",borderRadius:13,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:12 }}>
                <div style={{ width:40,height:40,borderRadius:11,background:ROLES[u.role].bg,color:ROLES[u.role].color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12 }}>{u.initials}</div>
                <div>
                  <div style={{ fontWeight:800,fontSize:13 }}>{u.name}</div>
                  <div style={{ fontSize:10,color:ROLES[u.role].color }}>{ROLES[u.role].icon} {ROLES[u.role].label}</div>
                  {u.wallet_address&&<div style={{fontSize:9,color:"#6b7280",fontFamily:"monospace"}}>{u.wallet_address.slice(0,10)}...{u.wallet_address.slice(-6)}</div>}
                </div>
              </div>
              <div style={{ marginBottom:9 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                  <span style={{ fontSize:10,color:"#6b7280",fontWeight:600 }}>Reputation</span>
                  <span style={{ fontWeight:800,color:barColor,fontSize:15 }}>{u.reputation}/100</span>
                </div>
                <div style={{ height:7,background:"#f3f4f6",borderRadius:4,overflow:"hidden" }}>
                  <div style={{ width:bar+"%",height:"100%",background:barColor,borderRadius:4,transition:"width 0.5s" }}/>
                </div>
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <div style={{ flex:1,textAlign:"center",padding:"7px",background:"#f0fdf4",borderRadius:7 }}>
                  <div style={{ color:"#16a34a",fontWeight:800,fontSize:15 }}>+{gained}</div>
                  <div style={{ fontSize:9,color:"#6b7280" }}>Points gained</div>
                </div>
                <div style={{ flex:1,textAlign:"center",padding:"7px",background:"#fef2f2",borderRadius:7 }}>
                  <div style={{ color:"#dc2626",fontWeight:800,fontSize:15 }}>-{lost}</div>
                  <div style={{ fontSize:9,color:"#6b7280" }}>Points lost</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
function MainApp({ user: initialUser, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState("dashboard");
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(initialUser);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await call("fetch-data", { userId: initialUser.id, role: initialUser.role });
      setData(res);
      const freshUser = res.users?.find(u => u.id === initialUser.id);
      if (freshUser) setCurrentUser(freshUser);
    } catch(e) { console.error("Fetch error:", e); }
    setRefreshing(false);
  }, [initialUser.id, initialUser.role]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const interval = setInterval(refresh, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, [refresh]);

  if (!data) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Sans',system-ui,sans-serif",background:"#f4f6fb" }}>
      <div style={{ textAlign:"center" }}>
        <Spinner/>
        <div style={{ color:"#6b7280",marginTop:12,fontSize:14 }}>Loading data from Supabase + Polygon...</div>
      </div>
    </div>
  );

  const renderView = () => {
    const props = { data, user: currentUser, refresh };
    if (currentUser.role === "gov_authority") {
      if (view==="dashboard") return <GovDashboard {...props}/>;
      if (view==="projects")  return <GovProjects {...props}/>;
      if (view==="approvals") return <GovApprovals {...props}/>;
      if (view==="payments")  return <GovPayments {...props}/>;
      if (view==="contractors") return <ReputationRegistry {...props}/>;
    }
    if (currentUser.role === "contractor") {
      if (view==="dashboard")     return <div><div style={{display:"flex",gap:13,marginBottom:18,flexWrap:"wrap"}}><StatCard label="Active Milestones" value={data.milestones.filter(m=>m.contractor_id===currentUser.id&&m.status==="active").length} icon="🎯" color="#5b21b6"/><StatCard label="Completed" value={data.milestones.filter(m=>m.contractor_id===currentUser.id&&m.status==="payment_released").length} icon="✅" color="#16a34a"/><StatCard label="Total Earned" value={fmt(data.payments.filter(p=>p.contractor_id===currentUser.id).reduce((a,b)=>a+b.amount,0))} icon="💰" color="#0891b2"/><StatCard label="Reputation" value={currentUser.reputation+"/100"} icon="⭐" color="#d97706"/></div><InfoBox type="info">Your blockchain wallet: <code style={{fontSize:11}}>{currentUser.wallet_address||"Setting up..."}</code></InfoBox></div>;
      if (view==="milestones")    return <ContractorMilestones {...props}/>;
      if (view==="procurement")   return <ContractorProcurement {...props}/>;
      if (view==="fund_requests") return <ContractorFundRequests {...props}/>;
    }
    if (currentUser.role === "inspector") {
      if (view==="dashboard") return <div><div style={{display:"flex",gap:13,marginBottom:18,flexWrap:"wrap"}}><StatCard label="Pending" value={data.milestones.filter(m=>m.inspector_id===currentUser.id&&m.status==="pending_inspection").length} icon="🔍" color="#7c3aed"/><StatCard label="Approved" value={data.milestones.filter(m=>m.inspector_id===currentUser.id&&m.insp_approval==="approved").length} icon="✅" color="#16a34a"/><StatCard label="Rejected" value={data.milestones.filter(m=>m.inspector_id===currentUser.id&&m.insp_approval==="rejected").length} icon="❌" color="#dc2626"/><StatCard label="Reputation" value={currentUser.reputation+"/100"} icon="⭐" color="#d97706"/></div></div>;
      if (view==="pending")   return <InspectorPending {...props}/>;
      if (view==="history")   return <InspectorHistory {...props}/>;
    }
    if (currentUser.role === "auditor") {
      if (view==="dashboard")          return <div><div style={{display:"flex",gap:13,marginBottom:18,flexWrap:"wrap"}}><StatCard label="Total Transactions" value={data.audit_logs.length} icon="⛓️" color="#1e3a5f"/><StatCard label="Procurement Records" value={data.procurements.length} icon="📦" color="#7c3aed"/><StatCard label="Total Disbursed" value={fmt(data.payments.reduce((a,b)=>a+b.amount,0))} icon="💰" color="#059669"/><StatCard label="Projects" value={data.projects.length} icon="📁" color="#0891b2"/></div><InfoBox type="success">🔒 All records below are secured on Polygon Amoy blockchain. Click any 🔗 tx link to independently verify on PolygonScan.</InfoBox></div>;
      if (view==="audit_trail")        return <AuditTrail {...props}/>;
      if (view==="procurement_audit")  return <ProcurementAudit {...props}/>;
      if (view==="reputation")         return <ReputationRegistry {...props}/>;
      if (view==="payments")           return <GovPayments {...props}/>;
    }
    return null;
  };

  return (
    <div style={{ display:"flex",minHeight:"100vh",background:"#f4f6fb",fontFamily:"'IBM Plex Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar user={currentUser} view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
        <TopBar user={currentUser} view={view} onLogout={onLogout} refreshing={refreshing}/>
        <main style={{ flex:1,overflow:"auto",padding:20 }}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════
export default function ContractPro() {
  const [user, setUser] = useState(null);
  return user
    ? <MainApp user={user} onLogout={() => setUser(null)}/>
    : <LoginScreen onLogin={setUser}/>;
}
