const KEY="meu_acervo_itens_v1";
const defaultCategories=["Documentos pessoais","Saúde","Família","Trabalho","Estudos","Financeiro","Imóveis","Veículos","Fotografias","Outros"];
let items=JSON.parse(localStorage.getItem(KEY)||"[]");
let currentView="inicio";

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function save(){localStorage.setItem(KEY,JSON.stringify(items)); updateCount();}
function updateCount(){$("storageCount").textContent=`${items.length} ${items.length===1?"item":"itens"}`}
function formatDate(v){if(!v)return "—"; return new Date(v+"T00:00:00").toLocaleDateString("pt-BR")}
function categoryOptions(selected=""){return defaultCategories.map(c=>`<option ${c===selected?"selected":""}>${c}</option>`).join("")}

function render(view=currentView, query=""){
 currentView=view;
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 const q=query.trim().toLowerCase();
 let filtered=items.filter(i=>!q || [i.title,i.type,i.person,i.category,i.place,i.physical,i.keywords,i.description].join(" ").toLowerCase().includes(q));
 if(view==="inicio") renderHome();
 else if(view==="itens") renderItems(filtered,q);
 else if(view==="pessoas") renderPeople(filtered);
 else if(view==="categorias") renderCategories();
 else if(view==="locais") renderLocations(filtered);
 else renderConfig();
 updateCount();
}

function renderHome(){
 const counts={doc:items.filter(i=>i.type==="Documento").length,photo:items.filter(i=>i.type==="Fotografia").length,people:new Set(items.map(i=>i.person).filter(Boolean)).size,cats:new Set(items.map(i=>i.category).filter(Boolean)).size};
 $("appContent").innerHTML=`<div class="hero"><h1>Bem-vindo ao seu acervo</h1><p>Organize, descreva e preserve seus documentos, fotografias e memórias.</p></div>
 <div class="stats">
  <div class="stat"><div class="icon">▣</div><b>${items.length}</b><span>Itens no acervo</span></div>
  <div class="stat"><div class="icon">📄</div><b>${counts.doc}</b><span>Documentos</span></div>
  <div class="stat"><div class="icon">📷</div><b>${counts.photo}</b><span>Fotografias</span></div>
  <div class="stat"><div class="icon">♙</div><b>${counts.people}</b><span>Pessoas relacionadas</span></div>
 </div>
 <div class="section-head"><h2>Acesso rápido</h2></div><div class="cards">
 ${defaultCategories.slice(0,8).map(c=>`<div class="category-card" data-cat="${esc(c)}"><div class="emoji">${categoryEmoji(c)}</div><b>${esc(c)}</b><span>${items.filter(i=>i.category===c).length} item(ns)</span></div>`).join("")}</div>
 <div class="section-head"><h2>Adicionados recentemente</h2><button class="secondary" id="seeAll">Ver acervo</button></div>${itemTable(items.slice().reverse().slice(0,6))}`;
 document.querySelectorAll(".category-card").forEach(c=>c.onclick=()=>{render("itens"); setTimeout(()=>{$("globalSearch").value=c.dataset.cat; render("itens",c.dataset.cat)},0)});
 $("seeAll")?.addEventListener("click",()=>render("itens"));
}

function categoryEmoji(c){return ({ "Documentos pessoais":"🪪","Saúde":"✚","Família":"👨‍👩‍👧","Trabalho":"💼","Estudos":"🎓","Financeiro":"💰","Imóveis":"🏠","Veículos":"🚗","Fotografias":"📷","Outros":"📦"})[c]||"📁"}

function itemTable(list){
 if(!list.length)return `<div class="table"><div class="empty"><b>Nenhum item cadastrado</b>Clique em “Adicionar ao acervo” para começar.</div></div>`;
 return `<div class="table"><div class="row header"><div>Título</div><div>Tipo</div><div>Pessoa</div><div>Data</div><div></div></div>${list.map(i=>`<div class="row"><div><b>${esc(i.title)}</b><div class="muted">${esc(i.category||"Sem categoria")}</div></div><div><span class="tag">${esc(i.type)}</span></div><div>${esc(i.person||"—")}</div><div>${formatDate(i.date)}</div><div class="actions"><button onclick="editItem('${i.id}')">✎</button><button onclick="deleteItem('${i.id}')">×</button></div></div>`).join("")}</div>`
}

function renderItems(list=items,q=""){
 $("appContent").innerHTML=`<div class="hero"><h1>Acervo</h1><p>${q?`Resultados para “${esc(q)}”`:"Todos os itens cadastrados no seu acervo."}</p></div>${itemTable(list)}`;
}

function renderPeople(){
 const people=[...new Set(items.map(i=>i.person).filter(Boolean))];
 $("appContent").innerHTML=`<div class="hero"><h1>Pessoas</h1><p>Pessoas relacionadas aos itens do acervo.</p></div><div class="cards">${people.length?people.map(p=>`<div class="person-card" style="padding:20px"><div style="font-size:26px">♙</div><b>${esc(p)}</b><div class="muted">${items.filter(i=>i.person===p).length} item(ns)</div></div>`).join(""):`<div class="table"><div class="empty"><b>Nenhuma pessoa cadastrada</b>Informe uma pessoa ao cadastrar um item.</div></div>`}</div>`;
}
function renderCategories(){
 $("appContent").innerHTML=`<div class="hero"><h1>Categorias</h1><p>Visão geral das categorias utilizadas.</p></div><div class="cards">${defaultCategories.map(c=>`<div class="category-card"><div class="emoji">${categoryEmoji(c)}</div><b>${esc(c)}</b><span>${items.filter(i=>i.category===c).length} item(ns)</span></div>`).join("")}</div>`;
}
function renderLocations(){
 const locs=[...new Set(items.map(i=>i.physical).filter(Boolean))];
 $("appContent").innerHTML=`<div class="hero"><h1>Localização física</h1><p>Controle onde os originais estão guardados.</p></div><div class="table">${locs.length?`<div class="row header"><div>Localização</div><div>Itens</div><div></div><div></div><div></div></div>${locs.map(l=>`<div class="row"><div><b>📦 ${esc(l)}</b></div><div>${items.filter(i=>i.physical===l).length}</div><div></div><div></div><div></div></div>`).join("")}`:`<div class="empty"><b>Nenhuma localização cadastrada</b>Informe caixa, pasta ou outro local no cadastro.</div>`}</div>`;
}
function renderConfig(){
 $("appContent").innerHTML=`<div class="hero"><h1>Configurações</h1><p>Esta primeira versão funciona localmente neste navegador.</p></div><div class="table"><div style="padding:20px"><b>Armazenamento</b><p class="muted">Os registros ficam no armazenamento local do navegador. Para uma versão online com login, nuvem e arquivos grandes, a próxima etapa pode usar Firebase.</p><button class="secondary" onclick="exportData()">Exportar dados (JSON)</button> <button class="secondary" onclick="clearData()">Apagar todos os dados</button></div></div>`;
}

function openModal(item=null){
 $("itemModal").classList.remove("hidden"); $("modalTitle").textContent=item?"Editar item":"Adicionar ao acervo";
 $("itemId").value=item?.id||""; $("title").value=item?.title||""; $("type").value=item?.type||"Documento"; $("person").value=item?.person||""; $("category").innerHTML=categoryOptions(item?.category||defaultCategories[0]); $("date").value=item?.date||""; $("place").value=item?.place||""; $("physical").value=item?.physical||""; $("keywords").value=item?.keywords||""; $("description").value=item?.description||""; $("notes").value=item?.notes||""; $("file").value=""; $("fileLabel").textContent=item?.fileName?`Arquivo registrado: ${item.fileName}`:"Opcional — fica armazenado nesta versão no navegador.";
}
function closeModal(){$("itemModal").classList.add("hidden")}
$("openAdd").onclick=()=>openModal(); $("closeModal").onclick=closeModal; $("cancelModal").onclick=closeModal;
$("itemModal").addEventListener("click",e=>{if(e.target.id==="itemModal")closeModal()});
$("itemForm").onsubmit=e=>{e.preventDefault(); const id=$("itemId").value||crypto.randomUUID(); const old=items.find(i=>i.id===id); const f=$("file").files[0]; const item={id,title:$("title").value.trim(),type:$("type").value,person:$("person").value.trim(),category:$("category").value,date:$("date").value,place:$("place").value.trim(),physical:$("physical").value.trim(),keywords:$("keywords").value.trim(),description:$("description").value.trim(),notes:$("notes").value.trim(),fileName:f?.name||old?.fileName||""}; if(old)items=items.map(i=>i.id===id?item:i);else items.push(item); save();closeModal();render(currentView,$("globalSearch").value);};
window.editItem=id=>openModal(items.find(i=>i.id===id));
window.deleteItem=id=>{if(confirm("Excluir este item do acervo?")){items=items.filter(i=>i.id!==id);save();render(currentView,$("globalSearch").value)}};
function exportData(){const blob=new Blob([JSON.stringify(items,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="meu-acervo-backup.json";a.click();URL.revokeObjectURL(a.href)}
function clearData(){if(confirm("Isso apagará todos os registros deste navegador. Continuar?")){items=[];save();render("inicio")}}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>render(b.dataset.view,$("globalSearch").value=""));
$("globalSearch").addEventListener("input",e=>{if(e.target.value)render("itens",e.target.value);else render(currentView)});
updateCount();render("inicio");
