import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = "/api";
const navItems = [["Overview", "⌂"], ["People", "♙"], ["Attendance", "◷"], ["Time off", "▣"], ["Payroll", "▤"], ["Reports", "▥"]];
const team = [
  { name: "Olivia Rhye", initials: "OR", color: "purple", role: "Product Designer", status: "Active" },
  { name: "Phoenix Baker", initials: "PB", color: "orange", role: "Engineering Lead", status: "Active" },
  { name: "Lana Steiner", initials: "LS", color: "blue", role: "Product Manager", status: "On leave" },
  { name: "Demi Wilkinson", initials: "DW", color: "pink", role: "UX Researcher", status: "Active" },
];

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem("staffsync-session") || "null"));
  const [active, setActive] = useState("Overview");
  const [range, setRange] = useState("This month");
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!session?.token) return;
    fetch(`${API_URL}/leave-requests`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load leave requests.");
        return response.json();
      })
      .then((data) => setRequests(data.map((request) => ({
        ...request,
        name: request.employee,
        initials: request.employee.split(" ").map((part) => part[0]).join(""),
        color: request.employee.includes("Lana") ? "blue" : request.employee.includes("Demi") ? "pink" : "green",
        days: `${request.days} ${request.days === 1 ? "day" : "days"}`,
      }))))
      .catch((reason) => setError(reason.message));
  }, [session]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };
  const logout = () => {
    localStorage.removeItem("staffsync-session");
    setSession(null);
    setShowProfile(false);
  };
  const updateRequest = async (request, status) => {
    try {
      const response = await fetch(`${API_URL}/leave-requests/${request.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Unable to update this request.");
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
      notify(`${request.name}'s request was ${status.toLowerCase()}.`);
    } catch (reason) { setError(reason.message); }
  };
  const exportReport = () => {
    const content = ["StaffSync attendance report", "Generated: " + new Date().toLocaleString(), "", "Employee,Role,Status", ...team.map((person) => `${person.name},${person.role},${person.status}`)].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    link.download = "staffsync-attendance-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    notify("Report downloaded.");
  };

  if (!session?.token) return <Login onLogin={(nextSession) => { localStorage.setItem("staffsync-session", JSON.stringify(nextSession)); setSession(nextSession); }} />;

  const stats = [
    { label: "Total employees", value: "248", change: "+12%", note: "vs. last month", icon: "♙", tone: "violet" },
    { label: "Present today", value: "218", change: "87.9%", note: "of total employees", icon: "✓", tone: "mint" },
    { label: "On leave", value: "18", change: "7.3%", note: "of total employees", icon: "☼", tone: "peach" },
    { label: "Open positions", value: "12", change: "+3", note: "new this month", icon: "⌁", tone: "sky" },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>staff<span>sync</span></span></div>
        <div className="workspace-switcher"><span className="workspace-logo">AC</span><span><b>Acme Corporation</b><small>Workspace</small></span><span className="chevron">⌄</span></div>
        <nav className="main-nav"><p className="nav-label">Workspace</p>
          {navItems.map(([label, icon]) => <button key={label} className={`nav-item ${active === label ? "selected" : ""}`} onClick={() => setActive(label)}><i>{icon}</i>{label}{label === "Time off" && <em>{requests.filter((request) => request.status === "Pending").length}</em>}</button>)}
          <p className="nav-label nav-label-spaced">Manage</p>
          <button className="nav-item" onClick={() => notify("Settings are ready for configuration.")}><i>⚙</i>Settings</button>
          <button className="nav-item" onClick={() => notify("Help center opened.")}><i>?</i>Help center</button>
        </nav>
        <div className="sidebar-bottom"><div className="upgrade-card"><div className="sparkle">✦</div><b>Unlock more with Pro</b><p>Automate your people operations.</p><button onClick={() => notify("Pro request received.")}>Explore Pro <span>→</span></button></div>
          <div className="profile-mini"><div className="avatar avatar-purple">OR</div><div><b>{session.user.name}</b><small>{session.user.email}</small></div><button onClick={() => setShowProfile((open) => !open)}>•••</button></div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{active}</strong></div><div className="top-actions"><button className="icon-button" onClick={() => notify("You have no new notifications.")}>♧<span className="notification-dot" /></button><button className="help-button" onClick={() => notify("Help center opened.")}>?</button><button className="top-avatar" onClick={() => setShowProfile((open) => !open)}>OR</button>{showProfile && <div className="profile-menu"><b>{session.user.name}</b><small>{session.user.role}</small><button onClick={logout}>Log out</button></div>}</div></header>
        <section className="page-heading"><div><p className="eyebrow">Tuesday, September 24, 2024</p><h1>Good morning, Olivia <span>✦</span></h1><p className="subheading">Here’s what’s happening with your team today.</p></div><div className="heading-actions"><button className="secondary-button" onClick={exportReport}>↧ <span>Export report</span></button><button className="primary-button" onClick={() => setShowModal(true)}>＋ <span>Add employee</span></button></div></section>
        {error && <div className="inline-error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        <section className="stat-grid">{stats.map((stat) => <div className="stat-card" key={stat.label}><div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.tone}`}>{stat.icon}</span></div><div className="stat-value">{stat.value}</div><div className="stat-change"><strong>{stat.change}</strong><span>{stat.note}</span></div></div>)}</section>
        <section className="content-grid"><div className="panel attendance-panel"><div className="panel-header"><div><h2>Attendance overview</h2><p>Team attendance over the last 7 days</p></div><select value={range} onChange={(event) => setRange(event.target.value)}><option>This month</option><option>This week</option><option>Last month</option></select></div><div className="chart"><div className="y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><div className="grid-lines">{[1, 2, 3, 4].map((line) => <i key={line} />)}</div><div className="bars">{[72, 84, 78, 91, 86, 96, 88].map((height, index) => <div className="bar-group" key={index}><div className="bar" style={{ height: `${height}%` }}><span>{height}%</span></div><small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small></div>)}</div></div></div><div className="chart-legend"><span><i className="legend-dot present" />Present</span><span><i className="legend-dot absent" />Absent</span><span><i className="legend-dot late" />Late</span></div></div>
          <div className="panel quick-panel"><div className="panel-header"><div><h2>Quick actions</h2><p>Common tasks</p></div></div><button className="quick-action" onClick={() => setShowModal(true)}><span className="action-icon purple-bg">＋</span><span><b>Add new employee</b><small>Create a new team member profile</small></span><b>→</b></button><button className="quick-action" onClick={() => setActive("Time off")}><span className="action-icon peach-bg">▣</span><span><b>Review leave requests</b><small>Requests need your attention</small></span><b>→</b></button><button className="quick-action" onClick={() => setShowAnnouncement(true)}><span className="action-icon mint-bg">✦</span><span><b>Post an announcement</b><small>Share news with your team</small></span><b>→</b></button></div></section>
        <section className="content-grid lower-grid"><div className="panel"><div className="panel-header"><div><h2>Leave requests</h2><p>Review and respond to pending requests</p></div><button className="text-button" onClick={() => setActive("Time off")}>View all <span>→</span></button></div><div className="request-list">{requests.map((request) => <div className="request-row" key={request.id}><div className={`avatar avatar-${request.color}`}>{request.initials}</div><div className="request-person"><b>{request.name}</b><small>{request.type} <span>•</span> {request.dates}</small></div><div className="request-days">{request.days}</div><span className={`status ${request.status.toLowerCase()}`}>{request.status}</span>{request.status === "Pending" ? <div className="row-actions"><button className="approve" onClick={() => updateRequest(request, "Approved")}>✓</button><button className="decline" onClick={() => updateRequest(request, "Declined")}>×</button></div> : <div className="row-actions empty" />}</div>)}</div></div>
          <div className="panel"><div className="panel-header"><div><h2>Today’s team</h2><p>People working today</p></div><button className="text-button" onClick={() => setActive("People")}>View all <span>→</span></button></div><div className="team-list">{team.map((person) => <div className="team-row" key={person.name}><div className={`avatar avatar-${person.color}`}>{person.initials}</div><div className="request-person"><b>{person.name}</b><small>{person.role}</small></div><div className={`status-dot ${person.status === "Active" ? "active-dot" : "leave-dot"}`} /><span className="team-status">{person.status}</span></div>)}</div></div></section>
        <footer>StaffSync © 2024 <span>•</span> Built for better people operations</footer>
      </main>
      {showModal && <EmployeeModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); notify("Employee profile created."); }} />}
      {showAnnouncement && <AnnouncementModal onClose={() => setShowAnnouncement(false)} onPosted={() => { setShowAnnouncement(false); notify("Announcement posted."); }} />}
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("olivia@acme.co");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState("HR manager");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed.");
      onLogin(data);
    } catch (reason) { setError(reason.message); } finally { setLoading(false); }
  };
  return <div className="login-shell"><div className="login-brand"><span className="brand-mark">S</span><span>staff<span>sync</span></span></div><div className="login-card"><div className="login-icon">✦</div><h1>Welcome back</h1><p>Sign in to manage your people operations.</p><form onSubmit={submit}><label>Work email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option>HR manager</option><option>Manager</option><option>Employee</option></select></label>{error && <div className="form-error">{error}</div>}<button className="primary-button login-button" disabled={loading}>{loading ? "Signing in..." : "Sign in"} <span>→</span></button></form><small className="login-hint">Demo access: use any valid email and password.</small></div></div>;
}

function EmployeeModal({ onClose, onCreated }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><div className="modal-icon">＋</div><h2>Add a new employee</h2><p>Create a profile and invite them to StaffSync.</p><label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" required /></label><label>Work email<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@acme.co" type="email" required /></label><label>Department<select><option>Engineering</option><option>Design</option><option>People & Culture</option></select></label><button className="primary-button full-width" disabled={!name || !email} onClick={onCreated}>Create employee</button></div></div>;
}

function AnnouncementModal({ onClose, onPosted }) {
  const [message, setMessage] = useState("");
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><div className="modal-icon">✦</div><h2>Post an announcement</h2><p>Share an update with everyone in your workspace.</p><label>Announcement<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your announcement..." rows="4" /></label><button className="primary-button full-width" disabled={!message.trim()} onClick={onPosted}>Publish announcement</button></div></div>;
}

createRoot(document.getElementById("root")).render(<App />);
