const KEY = "meu_acervo_itens_v1";
const defaultCategories = ["Documentos pessoais","Saúde","Família","Trabalho","Estudos","Financeiro","Imóveis","Veículos","Fotografias","Outros"];
let items = JSON.parse(localStorage.getItem(KEY) || "[]");
let currentView = "inicio";
let currentGroup = ""; 

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function save() { 
  try {
    localStorage.setItem(KEY, JSON.stringify(items)); 
    updateCount(); 
  } catch (e) {
    alert("Erro ao salvar: O limite de armazenamento do navegador (aprox. 5MB) pode ter sido atingido por causa dos arquivos salvos.");
  }
}
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
  const counts = { doc: items.filter(i => i.type === "Documento").length, photo: items.filter(i => i.type === "Fotografia").length, people: new Set(items.map(i => i.person).filter(Boolean)).size };
  $("appContent").innerHTML = `
    <div class="hero"><div><h1>Painel de Controle</h1><p>Visão geral e estatísticas do acervo.</p></div></div>
    <div class="stats">
      <div class="stat"><b>${items.length}</b><span>Itens Cadastrados</span></div>
      <div class="stat"><b>${counts.doc}</b><span>Documentos</span></div>
      <div class="stat"><b>${counts.photo}</b><span>Fotografias</span></div>
      <div class="stat"><b>${counts.people}</b><span>Pessoas (Interessados)</span></div>
    </div>
    <div class="section-head"><h2>Registros Recentes</h2></div>
    ${itemTable(items.slice().reverse().slice(0, 6))}
  `;
}

function getRowsHtml(list) {
  return list.map(i => `
  <div class="row">
    <div>
      <b onclick="viewItem('${i.id}')" title="Visualizar Documento / Imprimir Ficha">📄 ${esc(i.title)}</b><br>
      <span style="color:#555; font-size:10px">Cat: ${esc(i.category || "Sem categoria")} | Loc: ${esc(i.physical || "Não informado")}</span>
    </div>
    <div>${esc(i.type)}</div>
    <div>${esc(i.person || "—")}</div>
    <div>${formatDate(i.date)}</div>
    <div class="actions">
      <button title="Editar todos os dados" onclick="editItem('${i.id}')" style="cursor:pointer; background:none; border:none; font-size:14px;">✎</button>
      <button title="Excluir" onclick="deleteItem('${i.id}')" style="cursor:pointer; background:none; border:none; color:darkred; font-size:14px;">❌</button>
    </div>
  </div>`).join("");
}

function itemTable(list) {
  if(!list.length) return `<div class="table"><div class="empty">Nenhum registro encontrado.</div></div>`;
  
  let html = `<div class="table"><div class="row header"><div>Título do Documento / Item</div><div>Tipo</div><div>Pessoa Relacionada</div><div>Data</div><div>Ações</div></div>`;
    
  if (currentGroup && currentView === "itens") {
    const groups = {};
    list.forEach(i => {
      let key = i[currentGroup] || "Não classificado/Informado";
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    });
    Object.keys(groups).sort().forEach(groupName => {
      html += `<div class="row group-header">🗂️ ${esc(groupName)} (${groups[groupName].length} registro(s))</div>`;
      html += getRowsHtml(groups[groupName]);
    });
  } else {
    html += getRowsHtml(list);
  }
  
  html += `</div>`;
  return html;
}

function renderItems(list = items, q = "") {
  $("appContent").innerHTML = `
    <div class="hero" style="border:none; padding:0; margin:0;">
      <div><h1>Consulta ao Acervo</h1><p>${q ? `Pesquisando por: "${esc(q)}"` : "Listagem de documentos, fotos e registros."}</p></div>
    </div>
    <div class="filter-bar">
      <b>Agrupar acervo por:</b>
      <select id="groupSelect" style="width:200px;">
        <option value="">Lista Geral (Sem Agrupamento)</option>
        <option value="person" ${currentGroup === "person" ? "selected" : ""}>Pessoa</option>
        <option value="category" ${currentGroup === "category" ? "selected" : ""}>Categoria (Assunto)</option>
        <option value="type" ${currentGroup === "type" ? "selected" : ""}>Tipo de Documento</option>
      </select>
    </div>
    ${itemTable(list)}
  `;
  $("groupSelect").addEventListener("change", e => {
    currentGroup = e.target.value;
    renderItems(list, q);
  });
}

function renderPeople() {
  const people = [...new Set(items.map(i => i.person).filter(Boolean))];
  $("appContent").innerHTML = `<div class="hero"><div><h1>Pessoas Relacionadas</h1><p>Índice de pessoas vinculadas aos registros.</p></div></div><div class="cards">${people.length ? people.map(p => `<div class="person-card" onclick="currentGroup='person'; $('globalSearch').value='${esc(p)}'; render('itens', '${esc(p)}');"><b>${esc(p)}</b><div class="muted">${items.filter(i => i.person === p).length} registro(s)</div></div>`).join("") : `<div class="empty" style="grid-column: 1 / -1; border: 1px solid #ccc;">Nenhuma pessoa cadastrada.</div>`}</div>`;
}

function renderCategories() {
  $("appContent").innerHTML = `<div class="hero"><div><h1>Categorias de Classificação</h1><p>Estrutura de tipologia documental.</p></div></div><div class="cards">${defaultCategories.map(c => `<div class="category-card" onclick="currentGroup='category'; $('globalSearch').value='${esc(c)}'; render('itens', '${esc(c)}');"><b>${esc(c)}</b><div class="muted">${items.filter(i => i.category === c).length} registro(s)</div></div>`).join("")}</div>`;
}

function renderLocations() {
  const locs = [...new Set(items.map(i => i.physical).filter(Boolean))];
  $("appContent").innerHTML = `<div class="hero"><div><h1>Localização Física</h1><p>Controle de armazenamento físico.</p></div></div><div class="table">${locs.length ? `<div class="row header" style="grid-template-columns: 3fr 1fr;"><div>Unidade de Arquivamento</div><div>Quantidade</div></div>${locs.map(l => `<div class="row" style="grid-template-columns: 3fr 1fr;"><div><b>${esc(l)}</b></div><div>${items.filter(i => i.physical === l).length}</div></div>`).join("")}` : `<div class="empty">Nenhuma localização física foi mapeada.</div>`}</div>`;
}

function renderConfig() {
  $("appContent").innerHTML = `<div class="hero"><div><h1>Configurações do Sistema</h1><p>Parâmetros de execução e backup.</p></div></div><div class="table" style="padding: 20px;"><p style="font-weight:bold;">Gerenciamento de Dados Locais</p><button class="primary" onclick="exportData()">Exportar Banco de Dados (JSON)</button> <button class="secondary" style="color:darkred;" onclick="clearData()">Apagar Tudo</button></div>`;
}

function openModal(item = null) {
  $("itemModal").classList.remove("hidden"); 
  $("modalTitle").textContent = item ? "Editar Registro" : "Adicionar ao Acervo";
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
  $("fileLabel").textContent = item?.fileName ? `(Arquivo vinculado: ${item.fileName})` : "(Opcional — armazenado no navegador)";
}

function closeModal() { $("itemModal").classList.add("hidden"); }
$("openAdd").onclick = () => openModal(); 
$("closeModal").onclick = closeModal; 
$("cancelModal").onclick = closeModal;

/* NOVA LÓGICA DE SALVAMENTO COM CONVERSÃO DE ARQUIVO (BASE64) */
$("itemForm").onsubmit = e => {
  e.preventDefault(); 
  const id = $("itemId").value || crypto.randomUUID(); 
  const old = items.find(i => i.id === id); 
  const f = $("file").files[0]; 

  const finalizarSalvamento = (fileData, fileName) => {
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
      fileName: fileName,
      fileData: fileData 
    }; 
    
    if(old) items = items.map(i => i.id === id ? item : i);
    else items.push(item); 
    
    save(); 
    closeModal(); 
    render(currentView, $("globalSearch").value);
  };

  if (f) {
    const reader = new FileReader();
    reader.onload = event => finalizarSalvamento(event.target.result, f.name);
    reader.readAsDataURL(f);
  } else {
    finalizarSalvamento(old?.fileData || "", old?.fileName || "");
  }
};

window.editItem = id => openModal(items.find(i => i.id === id));
window.deleteItem = id => {
  if (confirm("Confirma a exclusão permanente deste registro do acervo?")) {
    items = items.filter(i => i.id !== id);
    save(); render(currentView, $("globalSearch").value);
  }
};

/* NOVA LÓGICA DE VISUALIZAÇÃO COM PDF E IMAGENS */
window.viewItem = id => {
  const item = items.find(i => i.id === id);
  if(!item) return;

  let visualizadorArquivoHTML = "";

  if (item.fileData) {
    const ehPDF = item.fileName.toLowerCase().endsWith('.pdf') || item.fileData.startsWith('data:application/pdf');
    
    if (ehPDF) {
      visualizadorArquivoHTML = `
        <div style="margin-top:20px; border-top:2px solid #000; padding-top:15px;">
          <span style="font-weight:bold; font-size:12px; text-transform:uppercase; display:block; margin-bottom:10px;">Visualização do Documento (PDF)</span>
          <iframe src="${item.fileData}" width="100%" height="600px" style="border:1px solid #ccc; background:#ebebeb;"></iframe>
        </div>
      `;
    } else if (item.fileData.startsWith('data:image')) {
      visualizadorArquivoHTML = `
        <div style="margin-top:20px; text-align:center; border-top:2px solid #000; padding-top:15px;">
          <span style="font-weight:bold; font-size:12px; text-transform:uppercase; display:block; margin-bottom:10px;">Visualização da Imagem</span>
          <img src="${item.fileData}" style="max-width:100%; max-height:600px; border:1px solid #ccc; padding:5px; background:#fff;">
        </div>
      `;
    }
  }

  const fichaHTML = `
    <div class="a4-header">
      <div class="a4-title">Ficha de Registro Documental</div>
      <div style="font-size:12px; margin-top:5px; color:#555;">Acervo Pessoal e Familiar</div>
    </div>
    
    <div class="a4-grid">
      <div class="a4-field a4-full"><span>Título do Registro / Assunto</span>${esc(item.title)}</div>
      <div class="a4-field"><span>Tipo Documental</span>${esc(item.type)}</div>
      <div class="a4-field"><span>Pessoa Relacionada / Interessado</span>${esc(item.person || "Não informado")}</div>
      <div class="a4-field"><span>Categoria de Arquivamento</span>${esc(item.category)}</div>
      <div class="a4-field"><span>Data do Fato / Documento</span>${formatDate(item.date)}</div>
      <div class="a4-field"><span>Local de Origem</span>${esc(item.place || "Não informado")}</div>
      <div class="a4-field"><span>Localização Física Atual</span><b>${esc(item.physical || "Acervo Digital / Não informado")}</b></div>
      <div class="a4-field a4-full"><span>Palavras-Chave (Tags)</span>${esc(item.keywords || "—")}</div>
      <div class="a4-field a4-full"><span>Nome do Arquivo Digital Vinculado</span>${esc(item.fileName || "Nenhum arquivo digital cadastrado.")}</div>
    </div>
    
    ${visualizadorArquivoHTML}
    
    ${item.description ? `
    <div style="margin-top:20px; border-top:2px solid #000; padding-top:15px;">
      <span style="font-weight:bold; font-size:12px; text-transform:uppercase;">Descrição / Teor do Documento</span>
      <div class="a4-content-box">${esc(item.description)}</div>
    </div>` : ''}

    ${item.notes ? `
    <div style="margin-top:20px;">
      <span style="font-weight:bold; font-size:12px; text-transform:uppercase;">Observações Administrativas</span>
      <div style="padding-top:10px; font-size:14px; font-style:italic;">${esc(item.notes)}</div>
    </div>` : ''}
    
    <div style="margin-top: 50px; text-align: center; font-size:10px; color:#666;">
      Documento gerado pelo sistema "Meu Acervo" • ID: ${item.id}
    </div>
  `;

  $("viewContent").innerHTML = fichaHTML;
  $("printArea").innerHTML = `<div class="a4-sheet" style="border:none; box-shadow:none;">${fichaHTML}</div>`;
  $("viewModal").classList.remove("hidden");
};

$("closeViewModal").onclick = () => { $("viewModal").classList.add("hidden"); };
$("viewModal").addEventListener("click", e => { if (e.target.id === "viewModal") $("viewModal").classList.add("hidden"); });
$("printBtn").onclick = () => { window.print(); };

function exportData() { const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "backup_meu_acervo.json"; a.click(); URL.revokeObjectURL(a.href); }
function clearData() { if (confirm("ATENÇÃO: Apagar todos os registros do navegador?")) { items = []; save(); render("inicio"); } }

document.querySelectorAll(".nav-item").forEach(b => b.onclick = () => render(b.dataset.view, $("globalSearch").value = ""));
$("globalSearch").addEventListener("input", e => { if (e.target.value) render("itens", e.target.value); else render(currentView); });

updateCount();
render("inicio");
