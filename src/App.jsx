import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AudioLines, Video, Boxes, LayoutDashboard, Plus, Search,
  Settings, LogOut, Menu, X, Cable, Monitor, Mic2, Speaker, RadioTower,
  Save, Trash2, ChevronRight, CircleHelp, Zap, Cloud, CloudOff, Check,
  SlidersHorizontal, Play, Headphones, Projector, Laptop, Camera, ArrowUpRight
} from "lucide-react";
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  addEdge, useEdgesState, useNodesState, MarkerType
} from "@xyflow/react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

const starterNodes = [
  { id: "mic-1", type: "device", position: { x: 60, y: 130 }, data: { label: "Wireless Mic 01", category: "audio", kind: "Microphone", detail: "Stage · CH 01" } },
  { id: "mixer-1", type: "device", position: { x: 340, y: 130 }, data: { label: "Digital Mixer", category: "audio", kind: "Mixer", detail: "FOH · Input 01" } },
  { id: "amp-1", type: "device", position: { x: 620, y: 55 }, data: { label: "Power Amplifier", category: "audio", kind: "Amplifier", detail: "Rack · Output L/R" } },
  { id: "spk-1", type: "device", position: { x: 900, y: 55 }, data: { label: "Main Speakers", category: "audio", kind: "Speakers", detail: "Sanctuary · L/R" } },
  { id: "cam-1", type: "device", position: { x: 60, y: 390 }, data: { label: "Camera 01", category: "video", kind: "Camera", detail: "Front · SDI" } },
  { id: "switch-1", type: "device", position: { x: 340, y: 390 }, data: { label: "Video Switcher", category: "video", kind: "Switcher", detail: "Media desk · Input 1" } },
  { id: "vmix-1", type: "device", position: { x: 620, y: 390 }, data: { label: "Streaming PC", category: "video", kind: "Computer", detail: "Media desk · vMix" } },
  { id: "screen-1", type: "device", position: { x: 900, y: 390 }, data: { label: "Projector / Stream", category: "video", kind: "Display", detail: "Output · HDMI / RTMP" } },
];
const starterEdges = [
  { id: "e1", source: "mic-1", target: "mixer-1", type: "smoothstep", animated: true, style: { stroke: "#d69b42", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#d69b42" }, label: "XLR" },
  { id: "e2", source: "mixer-1", target: "amp-1", type: "smoothstep", style: { stroke: "#d69b42", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#d69b42" }, label: "XLR" },
  { id: "e3", source: "amp-1", target: "spk-1", type: "smoothstep", style: { stroke: "#d69b42", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#d69b42" }, label: "Speaker cable" },
  { id: "e4", source: "cam-1", target: "switch-1", type: "smoothstep", animated: true, style: { stroke: "#6c9ef0", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6c9ef0" }, label: "SDI" },
  { id: "e5", source: "switch-1", target: "vmix-1", type: "smoothstep", style: { stroke: "#6c9ef0", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6c9ef0" }, label: "HDMI capture" },
  { id: "e6", source: "vmix-1", target: "screen-1", type: "smoothstep", style: { stroke: "#6c9ef0", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6c9ef0" }, label: "HDMI / Stream" },
];
const iconFor = (kind) => ({ Microphone: Mic2, Mixer: SlidersHorizontal, Amplifier: RadioTower, Speakers: Speaker, Camera, Switcher: Video, Computer: Laptop, Display: Projector, Monitor, "Stage Box": Boxes, Converter: Cable, "Capture Card": Monitor })[kind] || Boxes;
const templates = [
  ["Microphone", "audio"], ["Mixer", "audio"], ["Stage Box", "audio"], ["Amplifier", "audio"], ["Speakers", "audio"],
  ["Camera", "video"], ["Switcher", "video"], ["Computer", "video"], ["Converter", "video"], ["Capture Card", "video"], ["Display", "video"]
];

function DeviceNode({ data, selected }) {
  const Icon = iconFor(data.kind);
  return <div className={`device-node ${data.category} ${selected ? "selected" : ""}`}>
    <Handle type="target" position={Position.Left} />
    <div className="node-icon"><Icon size={17}/></div>
    <div className="node-copy"><strong>{data.label}</strong><span>{data.detail || data.kind}</span></div>
    <span className="node-type">{data.category === "audio" ? "AUDIO" : "VIDEO"}</span>
    <Handle type="source" position={Position.Right} />
  </div>;
}
const nodeTypes = { device: DeviceNode };

function App() {
  const [page, setPage] = useState("Dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [setups, setSetups] = useState([]);
  const [activeSetup, setActiveSetup] = useState(null);
  const [setupName, setSetupName] = useState("Sunday Main Service");
  const [serviceType, setServiceType] = useState("Sunday Service");
  const [nodes, setNodes, onNodesChange] = useNodesState(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [search, setSearch] = useState("");
  const [equipmentModal, setEquipmentModal] = useState(false);
  const [newEquipment, setNewEquipment] = useState({ name: "", category: "Audio", model: "", connection_type: "XLR", location: "" });
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadCloud = useCallback(async () => {
    if (!supabase || !user) return;
    const [{ data: eq }, { data: ss }] = await Promise.all([
      supabase.from("equipment").select("*").order("created_at", { ascending: false }),
      supabase.from("service_setups").select("*").order("updated_at", { ascending: false })
    ]);
    if (eq) setEquipment(eq);
    if (ss) setSetups(ss);
  }, [user]);

  useEffect(() => { loadCloud(); }, [loadCloud]);

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const color = sourceNode?.data.category === "video" ? "#6c9ef0" : "#d69b42";
    setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: true, style: { stroke: color, strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color } }, eds));
  }, [nodes, setEdges]);

  const addNode = (kind, category) => {
    const id = `${kind.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`;
    setNodes(ns => [...ns, { id, type: "device", position: { x: 120 + (ns.length % 4) * 80, y: 100 + (ns.length % 5) * 75 }, data: { label: kind, category, kind, detail: "Click to edit equipment details" } }]);
  };

  const saveSetup = async () => {
    const payload = { name: setupName.trim() || "Untitled setup", service_type: serviceType, description: "Signal flow configuration", flow_data: { nodes, edges } };
    if (supabase && user) {
      let result;
      if (activeSetup?.id) result = await supabase.from("service_setups").update(payload).eq("id", activeSetup.id).select().single();
      else result = await supabase.from("service_setups").insert({ ...payload, user_id: user.id }).select().single();
      if (result.error) return setNotice(result.error.message);
      setActiveSetup(result.data);
      await loadCloud();
      setNotice("Setup saved to your cloud database.");
    } else {
      const item = { id: activeSetup?.id || `local-${Date.now()}`, ...payload, local: true };
      const updated = activeSetup ? setups.map(s => s.id === item.id ? item : s) : [item, ...setups];
      setSetups(updated);
      localStorage.setItem("signal-flow-setups", JSON.stringify(updated));
      setActiveSetup(item);
      setNotice("Setup saved in this browser. Sign in to sync with the cloud.");
    }
  };

  useEffect(() => {
    if (!user && !supabase) {
      try { setSetups(JSON.parse(localStorage.getItem("signal-flow-setups") || "[]")); } catch {}
    }
  }, [user]);

  const openSetup = (setup) => {
    setActiveSetup(setup); setSetupName(setup.name); setServiceType(setup.service_type || "Sunday Service");
    setNodes(setup.flow_data?.nodes || []); setEdges(setup.flow_data?.edges || []); setPage("Builder");
  };
  const newSetup = () => { setActiveSetup(null); setSetupName("New service setup"); setServiceType("Sunday Service"); setNodes(starterNodes); setEdges(starterEdges); setPage("Builder"); };
  const addEquipment = async (e) => {
    e.preventDefault();
    const item = { ...newEquipment, category: newEquipment.category };
    if (supabase && user) {
      const { data, error } = await supabase.from("equipment").insert({ ...item, user_id: user.id }).select().single();
      if (error) return setNotice(error.message);
      setEquipment(old => [data, ...old]);
    } else setEquipment(old => [{ ...item, id: `local-${Date.now()}` }, ...old]);
    setEquipmentModal(false); setNewEquipment({ name: "", category: "Audio", model: "", connection_type: "XLR", location: "" }); setNotice("Equipment added.");
  };
  const deleteEquipment = async (id) => {
    if (supabase && user && !id.startsWith("local-")) await supabase.from("equipment").delete().eq("id", id);
    setEquipment(old => old.filter(x => x.id !== id));
  };
  const signIn = async (e) => {
    e.preventDefault();
    if (!supabase) return setNotice("Add your Supabase credentials to enable cloud accounts.");
    const { data, error } = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) return setNotice(error.message);
    if (authMode === "signup" && !data.session) setNotice("Check your email to confirm your account, then sign in.");
    else { setUser(data.user); setAuthOpen(false); setNotice("You're signed in."); }
  };
  const signOut = async () => { await supabase?.auth.signOut(); setUser(null); setNotice("Signed out."); };
  const filteredEquipment = equipment.filter(x => `${x.name} ${x.model} ${x.category}`.toLowerCase().includes(search.toLowerCase()) && (filter === "All" || x.category === filter));
  const audioCount = nodes.filter(n => n.data.category === "audio").length;
  const videoCount = nodes.filter(n => n.data.category === "video").length;

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Signal Builder", icon: Activity },
    { name: "Equipment", icon: Boxes },
    { name: "Service Setups", icon: SlidersHorizontal }
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><b>signal<span>flow</span></b><small>CHURCH MEDIA SYSTEMS</small></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="church-switch"><div className="church-avatar">SF</div><div><b>Media Department</b><small>Main workspace</small></div><ChevronRight size={15}/></div>
      <nav>{navItems.map(item => <button key={item.name} className={`nav-link ${page === item.name ? "active" : ""}`} onClick={() => { setPage(item.name); setMobileNav(false); }}><item.icon size={18}/>{item.name}{item.name === "Signal Builder" && <span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="connection-card"><div className="connection-icon"><Cloud size={16}/></div><div><b>{isSupabaseConfigured ? (user ? "Cloud connected" : "Cloud ready") : "Preview mode"}</b><small>{isSupabaseConfigured ? (user ? "Your workspace is online" : "Sign in to sync data") : "Local browser storage"}</small></div><span className={`status-dot ${isSupabaseConfigured ? "online" : ""}`}/></div>
        <button className="nav-link" onClick={() => setNotice("Signal Flow · Version 1.0. Set up Supabase using the included README.")}><CircleHelp size={18}/>Help & support</button>
        {user ? <button className="nav-link" onClick={signOut}><LogOut size={18}/>Sign out</button> : <button className="nav-link" onClick={() => setAuthOpen(true)}><Cloud size={18}/>Connect account</button>}
        <div className="profile"><div className="profile-avatar">{user?.email?.[0]?.toUpperCase() || "M"}</div><div><b>{user?.email || "Media Operator"}</b><small>{user ? "Signed in" : "Local workspace"}</small></div><Settings size={16}/></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="hamburger" onClick={() => setMobileNav(true)}><Menu/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>{page}</b></div><div className="top-actions"><span className="live-indicator"><i/> SYSTEM READY</span><button className="icon-button" title="Search" onClick={() => setPage("Equipment")}><Search size={18}/></button><button className="user-button" onClick={() => user ? signOut() : setAuthOpen(true)}>{user?.email?.[0]?.toUpperCase() || "M"}</button></div></header>

      {page === "Dashboard" && <section className="page-content">
        <div className="welcome-row"><div><div className="eyebrow">THURSDAY, NOVEMBER 05, 2026</div><h1>Good evening, media team<span>.</span></h1><p>Here's what's happening across your technical setup.</p></div><button className="primary-button" onClick={newSetup}><Plus size={17}/> New signal flow</button></div>
        <div className="hero-card"><div className="hero-copy"><div className="hero-kicker"><span className="hero-pulse"/> YOUR MEDIA CONTROL CENTRE</div><h2>Every connection.<br/><em>Under control.</em></h2><p>Plan your signal paths, keep equipment organized, and make every service run smoothly.</p><button className="hero-button" onClick={() => setPage("Signal Builder")}>Open signal builder <ArrowUpRight size={16}/></button></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-core"><Activity size={34}/></div><div className="float-node fn1"><Mic2 size={17}/></div><div className="float-node fn2"><Video size={17}/></div><div className="float-node fn3"><Speaker size={17}/></div><div className="float-node fn4"><Monitor size={17}/></div><div className="signal-line sl1"/><div className="signal-line sl2"/></div></div>
        <div className="section-heading"><div><h3>Workspace overview</h3><p>A snapshot of your media infrastructure</p></div><span className="muted-tag">ALL SYSTEMS</span></div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Total equipment</span><div className="stat-icon purple"><Boxes size={18}/></div></div><strong>{equipment.length.toString().padStart(2,"0")}</strong><small>Registered devices</small></div>
          <div className="stat-card"><div className="stat-top"><span>Audio channels</span><div className="stat-icon amber"><AudioLines size={18}/></div></div><strong>{audioCount.toString().padStart(2,"0")}</strong><small>In current diagram</small></div>
          <div className="stat-card"><div className="stat-top"><span>Video sources</span><div className="stat-icon blue"><Video size={18}/></div></div><strong>{videoCount.toString().padStart(2,"0")}</strong><small>In current diagram</small></div>
          <div className="stat-card"><div className="stat-top"><span>Saved setups</span><div className="stat-icon green"><Save size={18}/></div></div><strong>{setups.length.toString().padStart(2,"0")}</strong><small>Service configurations</small></div>
        </div>
        <div className="dashboard-bottom"><div className="panel recent-panel"><div className="panel-heading"><div><h3>Recent service setups</h3><p>Your saved signal configurations</p></div><button className="text-button" onClick={() => setPage("Service Setups")}>View all <ChevronRight size={15}/></button></div>
          {setups.length ? setups.slice(0,3).map(s => <button className="setup-row" key={s.id} onClick={() => openSetup(s)}><div className="setup-icon"><Activity size={18}/></div><div><b>{s.name}</b><small>{s.service_type}</small></div><span className="row-date">OPEN <ChevronRight size={14}/></span></button>) : <div className="empty-state"><div className="empty-icon"><Save size={21}/></div><b>No saved setups yet</b><span>Create your first service configuration to see it here.</span><button className="text-button" onClick={newSetup}>Create a setup <ArrowUpRight size={14}/></button></div>}
        </div><div className="panel quick-panel"><div className="panel-heading"><div><h3>Quick actions</h3><p>Jump back into your workflow</p></div></div><button className="quick-action" onClick={newSetup}><div className="quick-icon violet"><Activity size={18}/></div><div><b>Build signal flow</b><small>Map audio & video connections</small></div><ChevronRight size={16}/></button><button className="quick-action" onClick={() => { setPage("Equipment"); setEquipmentModal(true); }}><div className="quick-icon orange"><Plus size={18}/></div><div><b>Add equipment</b><small>Register a new device</small></div><ChevronRight size={16}/></button><button className="quick-action" onClick={() => setPage("Service Setups")}><div className="quick-icon blue"><SlidersHorizontal size={18}/></div><div><b>Manage setups</b><small>Reuse saved configurations</small></div><ChevronRight size={16}/></button></div></div>
      </section>}

      {page === "Signal Builder" && <section className="builder-page">
        <div className="builder-heading"><div><div className="eyebrow">VISUAL ROUTING WORKSPACE</div><h1>Signal builder<span>.</span></h1><p>Connect your equipment and map the journey of every signal.</p></div><div className="builder-actions"><button className="secondary-button" onClick={() => {setNodes(starterNodes);setEdges(starterEdges);setActiveSetup(null);setNotice("Starter diagram restored.");}}>Reset diagram</button><button className="primary-button" onClick={saveSetup}><Save size={16}/> Save setup</button></div></div>
        <div className="builder-meta"><input value={setupName} onChange={e => setSetupName(e.target.value)} aria-label="Setup name"/><select value={serviceType} onChange={e => setServiceType(e.target.value)}><option>Sunday Service</option><option>Tuesday Charismatic Hour</option><option>Thursday Bible Study</option><option>Conference</option><option>Special Programme</option></select><span className="canvas-hint"><span className="legend-dot audio-dot"/> Audio <span className="legend-dot video-dot"/> Video</span></div>
        <div className="builder-layout"><aside className="toolbox"><div className="toolbox-title">EQUIPMENT BLOCKS</div><p>Click to add a device to your canvas.</p><div className="tool-group"><label>AUDIO EQUIPMENT</label>{templates.filter(t=>t[1]==="audio").map(([kind,cat])=>{const Icon=iconFor(kind);return <button className="tool-item" key={kind} onClick={()=>addNode(kind,cat)}><Icon size={16}/>{kind}<Plus size={14}/></button>})}</div><div className="tool-group"><label>VIDEO EQUIPMENT</label>{templates.filter(t=>t[1]==="video").map(([kind,cat])=>{const Icon=iconFor(kind);return <button className="tool-item" key={kind} onClick={()=>addNode(kind,cat)}><Icon size={16}/>{kind}<Plus size={14}/></button>})}</div><div className="tool-tip"><Zap size={15}/><span><b>Quick tip</b>Drag from a node's handle to another node to create a connection.</span></div></aside>
          <div className="canvas-wrap"><div className="canvas-topline"><span><i/> LIVE CANVAS</span><span>{nodes.length} DEVICES <b>·</b> {edges.length} CONNECTIONS</span></div><div className="flow-canvas"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView deleteKeyCode={["Backspace","Delete"]} connectionLineStyle={{stroke:"#a3aab8",strokeWidth:2}} defaultEdgeOptions={{type:"smoothstep"}}><Background color="#dfe4eb" gap={22} size={1}/><MiniMap nodeColor={n=>n.data.category==="audio"?"#d69b42":"#6c9ef0"} maskColor="rgba(245,247,250,.7)"/><Controls/></ReactFlow></div><div className="canvas-footer"><span><span className="legend-dot audio-dot"/> Audio path</span><span><span className="legend-dot video-dot"/> Video path</span><span className="canvas-footer-note">Select a block and press Delete to remove it.</span></div></div></div>
      </section>}

      {page === "Equipment" && <section className="page-content"><div className="welcome-row"><div><div className="eyebrow">ASSET DIRECTORY</div><h1>Equipment library<span>.</span></h1><p>Keep every device, cable type, and location documented.</p></div><button className="primary-button" onClick={() => setEquipmentModal(true)}><Plus size={17}/> Add equipment</button></div>
        <div className="equipment-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search equipment, model or category..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Audio</option><option>Video</option><option>Other</option></select></div>
        <div className="equipment-grid">{filteredEquipment.map(item=>{const Icon=item.category==="Video"?Video:item.category==="Audio"?AudioLines:Boxes;return <div className="equipment-card" key={item.id}><div className={`equipment-card-icon ${item.category.toLowerCase()}`}><Icon size={20}/></div><div className="equipment-card-top"><span className="category-label">{item.category}</span><button className="icon-button small" onClick={()=>deleteEquipment(item.id)} title="Delete equipment"><Trash2 size={15}/></button></div><h3>{item.name}</h3><p>{item.model || "Model not specified"}</p><div className="equipment-details"><span><Cable size={14}/>{item.connection_type || "Connection not set"}</span><span><Monitor size={14}/>{item.location || "Location not set"}</span></div></div>})}
          {!filteredEquipment.length && <div className="empty-state equipment-empty"><div className="empty-icon"><Boxes size={22}/></div><b>Your equipment library is empty</b><span>Add cameras, microphones, mixers, cables and other devices.</span><button className="primary-button" onClick={()=>setEquipmentModal(true)}><Plus size={16}/> Add first equipment</button></div>}</div>
      </section>}

      {page === "Service Setups" && <section className="page-content"><div className="welcome-row"><div><div className="eyebrow">CONFIGURATION MANAGER</div><h1>Service setups<span>.</span></h1><p>Save and reuse a reliable technical plan for every programme.</p></div><button className="primary-button" onClick={newSetup}><Plus size={17}/> New setup</button></div>
        <div className="setup-grid">{setups.map(s=><div className="saved-setup-card" key={s.id}><div className="saved-card-top"><div className="setup-icon"><Activity size={19}/></div><span className="saved-label">SAVED</span></div><h3>{s.name}</h3><p>{s.service_type}</p><div className="saved-card-stats"><span><Boxes size={14}/>{s.flow_data?.nodes?.length || 0} devices</span><span><Cable size={14}/>{s.flow_data?.edges?.length || 0} links</span></div><button className="open-setup-button" onClick={()=>openSetup(s)}>Open configuration <ArrowUpRight size={15}/></button></div>)}{!setups.length&&<div className="empty-state setup-empty"><div className="empty-icon"><Save size={22}/></div><b>No service configurations saved</b><span>Build a signal flow and save it to reuse it for future services.</span><button className="primary-button" onClick={newSetup}><Plus size={16}/> Create first setup</button></div>}</div>
      </section>}
      <footer className="app-footer"><span>© 2026 Signal Flow</span><span>BUILT FOR THE PEOPLE BEHIND THE PRODUCTION.</span></footer>
    </main>

    {notice && <div className="toast"><Check size={16}/>{notice}<button onClick={()=>setNotice("")}><X size={14}/></button></div>}
    {equipmentModal && <div className="modal-backdrop" onClick={()=>setEquipmentModal(false)}><form className="modal" onSubmit={addEquipment} onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><div className="eyebrow">ASSET DIRECTORY</div><h2>Add equipment</h2></div><button type="button" className="icon-button" onClick={()=>setEquipmentModal(false)}><X/></button></div><label>Equipment name<input required value={newEquipment.name} onChange={e=>setNewEquipment({...newEquipment,name:e.target.value})} placeholder="e.g. Sony PTZ Camera 01"/></label><div className="form-row"><label>Category<select value={newEquipment.category} onChange={e=>setNewEquipment({...newEquipment,category:e.target.value})}><option>Audio</option><option>Video</option><option>Other</option></select></label><label>Model<input value={newEquipment.model} onChange={e=>setNewEquipment({...newEquipment,model:e.target.value})} placeholder="e.g. PT20X-SDI"/></label></div><div className="form-row"><label>Connection type<input value={newEquipment.connection_type} onChange={e=>setNewEquipment({...newEquipment,connection_type:e.target.value})} placeholder="e.g. SDI, XLR, HDMI"/></label><label>Location<input value={newEquipment.location} onChange={e=>setNewEquipment({...newEquipment,location:e.target.value})} placeholder="e.g. Media booth"/></label></div><button className="primary-button modal-submit" type="submit"><Plus size={16}/> Save equipment</button></form></div>}
    {authOpen && <div className="modal-backdrop" onClick={()=>setAuthOpen(false)}><form className="modal auth-modal" onSubmit={signIn} onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><div className="eyebrow">CLOUD WORKSPACE</div><h2>{authMode==="signin"?"Welcome back":"Create your account"}</h2><p>Sign in to save your signal flows across devices.</p></div><button type="button" className="icon-button" onClick={()=>setAuthOpen(false)}><X/></button></div><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@church.org"/></label><label>Password<input type="password" minLength="6" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary-button modal-submit" type="submit">{authMode==="signin"?"Sign in":"Create account"}</button><p className="auth-switch">{authMode==="signin"?"New to Signal Flow?":"Already have an account?"} <button type="button" onClick={()=>setAuthMode(authMode==="signin"?"signup":"signin")}>{authMode==="signin"?"Create account":"Sign in"}</button></p>{!isSupabaseConfigured&&<small className="warning-text">Supabase credentials are not configured yet. Follow the README setup steps.</small>}</form></div>}
  </div>;
}

export default App;
