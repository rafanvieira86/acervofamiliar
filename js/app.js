const KEY = "meu_acervo_itens_v1";
const defaultCategories = ["Documentos pessoais","Saúde","Família","Trabalho","Estudos","Financeiro","Imóveis","Veículos","Fotografias","Outros"];
let items = JSON.parse(localStorage.getItem(KEY) || "[]");
let currentView = "inicio";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function save() { localStorage.setItem(KEY, JSON.stringify(items)); updateCount(); }
function updateCount() { $("storageCount").textContent = `${items.length} ${items.length === 1 ? "item" : "itens"}`; }
function formatDate(v) { if(!v) return "—"; return new Date(v + "T00:00:00").toLocaleDateString("pt-BR"); }
function categoryOptions(selected = "") { return defaultCategories.map(c => `<option ${c === selected ? "selected" : ""}>${c}</option>`).join(""); }

function render(view = currentView, query = "") {
  currentView = view;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const q = query.trim().toLowerCase();
  let filtered = items.filter(i => !q || [i.title, i.type, i.person, i.category, i.place, i.physical, i.keywords, i.description].join(" ").toLowerCase().includes(q));
  
  if(view === "inicio") renderHome();
  else if(view === "itens") renderItems(filtered, q);
  else if(view === "pessoas") renderPeople(filtered);
  else if(view === "categorias") renderCategories();
  else if(view === "locais") renderLocations(filtered);
  else renderConfig();
  
  updateCount();
}

function renderHome() {
  const counts = { doc: items.filter(i => i.type === "Documento").length, photo: items.filter(i => i.type === "Fotografia").length, people: new Set(items.map(i => i.person).filter(Boolean)).size, cats: new Set(items.map(i => i.category).filter(Boolean)).size };
  
  $("appContent").innerHTML = `
    <div class="hero">
      <h1>Painel de Controle</h1>
      <p>Visão geral e estatísticas do acervo.</p>
    </div>
    <div class="stats">
      <div class="stat"><b>${items.length}</b><span>Itens Cadastrados</span></div>
      <div class="stat"><b>${counts.doc}</b><span>Documentos</span></div>
      <div class="stat"><b>${counts.photo}</b><span>Fotografias</span></div>
      <div class="stat"><b>${counts.people}</b><span>Interessados</span></div>
    </div>
    <div class="section-head"><h2>Acesso Rápido - Categorias</h2></div>
    <div class="cards">
      ${defaultCategories.slice(0,8).map(c => `<div class="category-card" data-cat="${esc(c)}"><b>${esc(c)}</b><div class="muted">${items.filter(i => i.category === c).length} registro(s)</div></div>`).join("")}
    </div>
    <div class="section-head">
      <h2>Registros Recentes</h2>
      <button class="secondary" id="seeAll" style="float:right; margin-top:-35px;">Ver todo o acervo</button>
    </div>
    ${itemTable(items.slice().reverse().slice(0, 6))}
  `;
  
  document.querySelectorAll(".category-card").forEach(c => c.onclick = () => { render("itens"); setTimeout(() => { $("globalSearch").value = c.dataset.cat; render("itens", c.dataset.cat); }, 0); });
  $("seeAll")?.addEventListener("click", () => render("itens"));
}

/* Nova Tabela Padrão (Alta Densidade) */
function itemTable(list) {
  if(!list.length) return `<div class="table"><div class="empty">Nenhum registro encontrado no acervo.</div></div>`;
  
  return `<div class="table">
    <div class="row header">
      <div>Título do Documento / Item</div>
      <div>Tipo</div>
      <div>Pessoa Relacionada</div>
      <div>Data</div>
      <div>Ações</div>
    </div>
    ${list.map(i => `
    <div class="row">
      <div>
        <b onclick="editItem('${i.id}')" title="Consultar detalhes">${esc(i.title)}</b><br>
        <span style="color:#555; font-size:10px">Cat: ${esc(i.category || "Sem categoria")} | Loc: ${esc(i.physical || "Não informado")}</span>
      </div>
      <div>${esc(i.type)}</div>
      <div>${esc(i.person || "—")}</div>
      <div>${formatDate(i.date)}</div>
      <div class="actions">
        <button title="Consultar/Editar" onclick="editItem('${i.id}')" style="cursor:pointer; background:none; border:none; font-size:14px;">📄</button>
        <button title="Excluir" onclick="deleteItem('${i.id}')" style="cursor:pointer; background:none; border:none; color:darkred; font-size:14px;">❌</button>
      </div>
    </div>`).join("")}
  </div>`;
}

function renderItems(list = items, q = "") {
  $("appContent").innerHTML = `<div class="hero"><h1>Consulta ao Acervo</h1><p>${q ? `Resultados da pesquisa para: "${esc(q)}"` : "Listagem completa de itens registrados no sistema."}</p></div>${itemTable(list)}`;
}

function renderPeople() {
  const people = [...new Set(items.map(i => i.person).filter(Boolean))];
  $("appContent").innerHTML = `<div class="hero"><h1>Pessoas Relacionadas</h1><p>Índice de pessoas vinculadas aos registros do acervo.</p></div>
  <div class="cards">
    ${people.length ? people.map(p => `<div class="person-card"><b>${esc(p)}</b><div class="muted">${items.filter(i => i.person === p).length} registro(s)</div></div>`).join("") : `<div class="empty" style="grid-column: 1 / -1; border: 1px solid #ccc;">Nenhuma pessoa cadastrada no sistema.</div>`}
  </div>`;
}

function renderCategories() {
  $("appContent").innerHTML = `<div class="hero"><h1>Categorias de Classificação</h1><p>Estrutura de tipologia documental e assuntos do acervo.</p></div>
  <div class="cards">
    ${defaultCategories.map(c => `<div class="category-card"><b>${esc(c)}</b><div class="muted">${items.filter(i => i.category === c).length} registro(s)</div></div>`).join("")}
  </div>`;
}

function renderLocations() {
  const locs = [...new Set(items.map(i => i.physical).filter(Boolean))];
  $("appContent").innerHTML = `<div class="hero"><h1>Localização Física</h1><p>Controle de armazenamento físico (caixas, pastas, estantes).</p></div>
  <div class="table">
    ${locs.length ? `<div class="row header" style="grid-template-columns: 3fr 1fr;"><div>Unidade de Arquivamento</div><div>Quantidade de Itens</div></div>
    ${locs.map(l => `<div class="row" style="grid-template-columns: 3fr 1fr;"><div><b>${esc(l)}</b></div><div>${items.filter(i => i.physical === l).length}</div></div>`).join("")}` : `<div class="empty">Nenhuma localização física foi mapeada até o momento.</div>`}
  </div>`;
}

function renderConfig() {
  $("appContent").innerHTML = `<div class="hero"><h1>Configurações do Sistema</h1><p>Parâmetros de execução local do navegador.</p></div>
  <div class="table" style="padding: 20px;">
    <p style="margin-top:0; font-weight:bold;">Gerenciamento de Dados</p>
    <p class="muted" style="margin-bottom: 20px;">Os dados estão armazenados localmente (` + items.length + ` registros processados). Utilize as opções abaixo para fazer backup de segurança.</p>
    <button class="primary" onclick="exportData()">Exportar JSON</button> 
    <button class="secondary" style="color:darkred; border-color:darkred;" onclick="clearData()">Limpar Banco de Dados</button>
  </div>`;
}

function openModal(item = null) {
  $("itemModal").classList.remove("hidden"); 
  $("itemId").value = item?.id || ""; 
  $("title").value = item?.title || ""; 
  $("type").value = item?.type || "Documento"; 
  $("person").value = item?.person || ""; 
  $("category").innerHTML = categoryOptions(item?.category || defaultCategories[0]); 
  $("date").value = item?.date || ""; 
  $("place").value = item?.place || ""; 
  $("physical").value = item?.physical || ""; 
  $("keywords").value = item?.keywords || ""; 
  $("description").value = item?.description || ""; 
  $("notes").value = item?.notes || ""; 
  $("file").value = ""; 
  $("fileLabel").textContent = item?.fileName ? `(Arquivo registrado: ${item.fileName})` : "(Opcional — armazenado nesta versão no navegador)";
}

function closeModal() { $("itemModal").classList.add("hidden"); }

$("openAdd").onclick = () => openModal(); 
$("closeModal").onclick = closeModal; 
$("cancelModal").onclick = closeModal;
$("itemModal").addEventListener("click", e => { if (e.target.id === "itemModal") closeModal(); });

$("itemForm").onsubmit = e => {
  e.preventDefault(); 
  const id = $("itemId").value || crypto.randomUUID(); 
  const old = items.find(i => i.id === id); 
  const f = $("file").files[0]; 
  const item = {
    id,
    title: $("title").value.trim(),
    type: $("type").value,
    person: $("person").value.trim(),
    category: $("category").value,
    date: $("date").value,
    place: $("place").value.trim(),
    physical: $("physical").value.trim(),
    keywords: $("keywords").value.trim(),
    description: $("description").value.trim(),
    notes: $("notes").value.trim(),
    fileName: f?.name || old?.fileName || ""
  }; 
  
  if(old) items = items.map(i => i.id === id ? item : i);
  else items.push(item); 
  
  save(); 
  closeModal(); 
  render(currentView, $("globalSearch").value);
};

window.editItem = id => openModal(items.find(i => i.id === id));
window.deleteItem = id => {
  if (confirm("Confirma a exclusão permanente deste registro do acervo?")) {
    items = items.filter(i => i.id !== id);
    save();
    render(currentView, $("globalSearch").value);
  }
};

function exportData() {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_meu_acervo.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function clearData() {
  if (confirm("ATENÇÃO: Esta ação apagará todos os registros armazenados no navegador. Deseja prosseguir?")) {
    items = [];
    save();
    render("inicio");
  }
}

document.querySelectorAll(".nav-item").forEach(b => b.onclick = () => render(b.dataset.view, $("globalSearch").value = ""));
$("globalSearch").addEventListener("input", e => { if (e.target.value) render("itens", e.target.value); else render(currentView); });

updateCount();
render("inicio");
