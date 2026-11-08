const storageKey = "pcomp-draft-2";

const words = {
  en: {
    aiSkills:"PLANNING CHECKS", browserTitle:"PCom Assistant", suggestionFan:"Portable fan", suggestionLight:"Desk light", suggestionSimple:"Simplify my idea",
    newProject:"New Project", pinned:"Pinned", recent:"Recent", importProject:"Import Project",
    productLabel:"Physical computing planner", saved:"SAVED LOCALLY", rename:"Rename", pin:"Pin",
    pinnedButton:"Pinned", export:"Export", delete:"Delete",
    skillScope:"Scope", skillSimple:"Simplify", skillParts:"Parts", skillPower:"Power", skillSize:"Size", skillWiring:"Wiring", skillShop:"Shopping", skillTest:"Testing",
    chat:"Chat", plan:"Plan", conversation:"Conversation", ready:"Connected", thinking:"Working",
    offline:"Offline", prototypePlan:"Prototype plan", download:"Save PDF",
    messageLabel:"Describe your idea or ask for a change", chatHint:"The assistant asks one question at a time.",
    send:"Send", noPlan:"No plan yet", noPlanCopy:"Talk with the assistant. A simple plan will appear here when the idea is clear.",
    idea:"Idea", space:"Space", power:"Power", budget:"Budget", solution:"Simplest solution",
    shopping:"Parts list", sixParts:"Usually 6 main parts or fewer", component:"Component",
    quantity:"Qty", size:"Size", reason:"Purpose", how:"How it works", wiring:"Basic wiring",
    from:"From", to:"To", note:"Note", test:"First test", espUpgrade:"Optional ESP32-C3 upgrade",
    deleteProject:"Delete project?", cancel:"Cancel", newName:"Name your new project:",
    renamePrompt:"Enter a new project name:", deleteQuestion:"This permanently removes the project from this browser:",
    cannotDelete:"Keep at least one project.", welcome:"Tell me what you want to build. I will first look for the simplest functional prototype, and I will ask one short question at a time.",
    apiError:"The AI response was incomplete or the connection stopped. Please send your last message again. If it repeats, check the local server window.",
    emptyMessage:"Please type a message first.", imported:"Project imported.", invalid:"Invalid project file.",
    downloadEmpty:"There is no plan to download yet."
  },
  zh: {
    aiSkills:"AI能力", browserTitle:"PCom Assistant", suggestionFan:"便携风扇", suggestionLight:"桌灯", suggestionSimple:"简化我的想法",
    newProject:"新建项目", pinned:"置顶项目", recent:"最近项目", importProject:"导入项目",
    productLabel:"实体计算方案助手", saved:"已保存在本地", rename:"修改名称", pin:"置顶", pinnedButton:"已置顶",
    export:"导出", delete:"删除",
    skillScope:"明确需求", skillSimple:"简化方案", skillParts:"选择元件", skillPower:"电源安全", skillSize:"尺寸检查", skillWiring:"接线规划", skillShop:"购买清单", skillTest:"原型测试",
    chat:"对话", plan:"方案", conversation:"对话", ready:"就绪", thinking:"思考中",
    offline:"未连接", prototypePlan:"原型方案", download:"保存 PDF",
    messageLabel:"描述你的想法，或者提出修改", chatHint:"助手每次只问一个问题。",
    send:"发送", noPlan:"还没有方案", noPlanCopy:"先和助手对话；当想法足够清楚后，简单方案会显示在这里。",
    idea:"产品想法", space:"内部空间", power:"电源", budget:"预算", solution:"最简单的方案",
    shopping:"购买清单", sixParts:"通常不超过6个主要元件", component:"元件",
    quantity:"数量", size:"尺寸", reason:"用途", how:"工作方式", wiring:"基础接线",
    from:"从", to:"到", note:"说明", test:"第一次测试", espUpgrade:"可选 ESP32-C3 升级",
    deleteProject:"删除项目？", cancel:"取消", newName:"请输入新项目名称：",
    renamePrompt:"请输入新的项目名称：", deleteQuestion:"这会从当前浏览器中永久删除项目：",
    cannotDelete:"请至少保留一个项目。", welcome:"告诉我你想做什么。我会先寻找最简单的功能原型，并且每次只问一个简短问题。",
    apiError:"AI回复不完整或连接中断。请重新发送上一条消息；如果再次出现，请检查本地服务器窗口。",
    emptyMessage:"请先输入一条消息。", imported:"项目导入成功。", invalid:"项目文件无效。",
    downloadEmpty:"当前还没有可以下载的方案。"
  }
};

const samplePlan = {
  input:{ idea:"A small portable fan", space:"90 × 65 × 35 mm", power:"3.7V LiPo", budget:"$30" },
  solution:"Use a small fan, battery, switch, and a suitable power module. No controller is needed for a basic on/off prototype.",
  why:"This is the shortest path to testing airflow, scale, and switch placement.",
  parts:[
    {name:"5V mini fan", quantity:1, size:"40 × 40 × 10 mm", reason:"Creates airflow"},
    {name:"3.7V LiPo battery", quantity:1, size:"50 × 34 × 6 mm", reason:"Portable power"},
    {name:"Mini toggle switch", quantity:1, size:"12 × 8 × 10 mm", reason:"On/off control"},
    {name:"5V boost module", quantity:1, size:"Confirm seller dimensions", reason:"Raises battery voltage for the fan"},
    {name:"Wire", quantity:1, size:"As needed", reason:"Connects the circuit"}
  ],
  flow:["Battery","Switch","Boost module","Fan"],
  wiring:[
    {from:"Battery +",to:"Switch input",note:"Power line"},
    {from:"Switch output",to:"Boost IN+",note:"Switched power"},
    {from:"Battery −",to:"Boost IN−",note:"Common negative"},
    {from:"Boost OUT+ / OUT−",to:"Fan + / −",note:"Check polarity"}
  ],
  tests:["Test the power module without the fan.","Confirm the output voltage is correct.","Connect the fan for two seconds.","Stop if a wire or module becomes hot."],
  esp32Upgrade:"Only add an ESP32-C3 SuperMini if you later need automatic speed control, sensors, or wireless control."
};

function makeProject(title, withSample) {
  return {
    id:"project-" + Date.now() + "-" + Math.floor(Math.random()*1000), title:title, pinned:false,
    updated:new Date().toISOString(),
    messages:[{role:"assistant",content:wordSafe("welcome")}],
    plan:withSample ? structuredClone(samplePlan) : null
  };
}
function initialState() {
  const project = makeProject("Portable Fan", true);
  project.id = "portable-fan"; project.pinned = true;
  project.messages.push({role:"user",content:"I want to make a small portable fan."});
  project.messages.push({role:"assistant",content:"A basic fan does not need a microcontroller. What internal space, power source, and budget do you have?"});
  return {language:"en",activeId:project.id,projects:[project]};
}
function wordSafe(key){ return (words.en && words.en[key]) || key; }

let state;
try { state = JSON.parse(localStorage.getItem(storageKey)) || initialState(); }
catch (error) { state = initialState(); }
function detectLanguage(value){
  return /[㐀-鿿]/.test(String(value||""))?"zh":"en";
}

function normalizeLocalizedData(){
  state.projects.forEach(project=>{
    project.titleTranslations=project.titleTranslations||{};
    const titleLanguage=detectLanguage(project.title);
    if(!project.titleTranslations[titleLanguage]) project.titleTranslations[titleLanguage]=project.title;

    (project.messages||[]).forEach(message=>{
      message.translations=message.translations||{};
      const originalLanguage=detectLanguage(message.content);
      if(!message.translations[originalLanguage]) message.translations[originalLanguage]=message.content;
    });

    if(project.plan){
      project.planTranslations=project.planTranslations||{};
      const planLanguage=detectLanguage(project.plan.solution||project.plan.input?.idea);
      if(!project.planTranslations[planLanguage]) project.planTranslations[planLanguage]=project.plan;
    }
  });
}
normalizeLocalizedData();

function save(){ localStorage.setItem(storageKey,JSON.stringify(state)); }
function word(key){ return words[state.language][key]; }
function activeProject(){ return state.projects.find(p=>p.id===state.activeId) || state.projects[0]; }
function text(value, fallback="—"){ return value === undefined || value === null || value === "" ? fallback : String(value); }
function localizedTitle(project){ return project.titleTranslations?.[state.language]||project.title; }
function localizedPlan(project){ return project.planTranslations?.[state.language]||project.plan; }

function renderProjectButtons(listId, projects, pinned) {
  const list = document.getElementById(listId); list.innerHTML="";
  projects.sort((a,b)=>new Date(b.updated)-new Date(a.updated)).forEach(project=>{
    const button=document.createElement("button");
    button.className="project-button"+(project.id===state.activeId?" active":"");
    const mark=document.createElement("span"); mark.className="mark"; mark.textContent=pinned?"●":"□";
    const title=document.createElement("span"); title.textContent=localizedTitle(project);
    button.append(mark,title);
    button.onclick=()=>{state.activeId=project.id;save();render();};
    list.appendChild(button);
  });
}

function render(){
  document.documentElement.lang=state.language==="en"?"en":"zh-CN";
  document.title=word("browserTitle");
  document.querySelectorAll("[data-word]").forEach(el=>{el.textContent=word(el.dataset.word);});
  document.getElementById("chatInput").placeholder=state.language==="en"
    ?"Example: I want to make a small battery-powered fan."
    :"例如：我想制作一个使用电池的小风扇。";
  document.getElementById("enLabel").classList.toggle("selected",state.language==="en");
  document.getElementById("zhLabel").classList.toggle("selected",state.language==="zh");

  renderProjectButtons("pinnedList",state.projects.filter(p=>p.pinned),true);
  renderProjectButtons("recentList",state.projects.filter(p=>!p.pinned),false);

  const project=activeProject();
  document.getElementById("projectTitle").textContent=localizedTitle(project);
  document.getElementById("pinButton").classList.toggle("active",project.pinned);
  document.querySelector("#pinButton span").textContent=project.pinned?word("pinnedButton"):word("pin");
  renderMessages(project);
  renderPlan(localizedPlan(project));
}

function renderMessages(project){
  const list=document.getElementById("messages"); list.innerHTML="";
  (project.messages||[]).forEach(message=>{
    const row=document.createElement("div"); row.className="message "+message.role;
    const avatar=document.createElement("div"); avatar.className="avatar";
    if(message.role==="user"){
      avatar.textContent="U";
    }else{
      avatar.classList.add("assistant-avatar");
      avatar.setAttribute("aria-label","PCom Assistant");
      const person=document.createElement("span");person.className="pixel-person";avatar.appendChild(person);
    }
    const bubble=document.createElement("div"); bubble.className="bubble"; bubble.textContent=message.translations?.[state.language]||message.content;
    row.append(avatar,bubble); list.appendChild(row);
  });
  requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight;});
}

function renderPlan(plan){
  document.getElementById("emptyPlan").hidden=Boolean(plan);
  document.getElementById("planContent").hidden=!plan;
  if(!plan)return;

  const input=plan.input||{};
  document.getElementById("idea").textContent=text(input.idea);
  document.getElementById("space").textContent=text(input.space);
  document.getElementById("power").textContent=text(input.power);
  document.getElementById("budget").textContent=text(input.budget);
  document.getElementById("solutionText").textContent=text(plan.solution);
  document.getElementById("whyText").textContent="✓ "+text(plan.why);

  const shopping=document.getElementById("shoppingBody"); shopping.innerHTML="";
  (plan.parts||[]).forEach(part=>{
    const row=document.createElement("tr");
    [part.name,part.quantity,part.size,part.reason].forEach(value=>{const cell=document.createElement("td");cell.textContent=text(value);row.appendChild(cell);});
    shopping.appendChild(row);
  });

  const flow=document.getElementById("flow"); flow.innerHTML="";
  (plan.flow||[]).forEach((name,index)=>{
    const box=document.createElement("div");box.className="flow-box";box.textContent=text(name);flow.appendChild(box);
    if(index<(plan.flow||[]).length-1){const arrow=document.createElement("div");arrow.className="arrow";arrow.textContent="→";flow.appendChild(arrow);}
  });

  const wiring=document.getElementById("wiringBody"); wiring.innerHTML="";
  (plan.wiring||[]).forEach(connection=>{
    const row=document.createElement("tr");
    [connection.from,connection.to,connection.note].forEach(value=>{const cell=document.createElement("td");cell.textContent=text(value);row.appendChild(cell);});
    wiring.appendChild(row);
  });

  const tests=document.getElementById("testList"); tests.innerHTML="";
  (plan.tests||[]).forEach(step=>{const item=document.createElement("li");item.textContent=text(step);tests.appendChild(item);});

  const esp=document.getElementById("espDetails");
  esp.hidden=!plan.esp32Upgrade;
  document.getElementById("espText").textContent=plan.esp32Upgrade||"";
}

async function sendMessage(content){
  const project=activeProject();
  project.messages=project.messages||[];
  project.messages.push({role:"user",content,translations:{[state.language]:content}});
  project.updated=new Date().toISOString(); save(); renderMessages(project);
  setStatus("thinking");

  try{
    const response=await fetch("/api/chat",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        language:state.language,
        messages:project.messages.slice(-12).map(message=>({role:message.role,content:message.translations?.[state.language]||message.content})),
        currentPlan:localizedPlan(project)
      })
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"API error");
    project.messages.push({role:"assistant",content:text(data.assistantMessage),translations:{[state.language]:text(data.assistantMessage)}});
    if(data.projectTitle && project.title.startsWith(state.language==="en"?"New Project":"新项目")){
      project.title=data.projectTitle;
      project.titleTranslations={[state.language]:data.projectTitle};
    }
    if(data.plan){
      project.plan=data.plan;
      project.planTranslations={[state.language]:data.plan};
    }
    project.updated=new Date().toISOString(); save(); render(); setStatus("ready");
  }catch(error){
    console.error(error);
    project.messages.push({role:"assistant",content:word("apiError"),translations:{[state.language]:word("apiError")}});
    save(); renderMessages(project); setStatus("error");
  }
}



function collectPlanTranslationItems(plan, add){
  if(!plan)return;
  ["idea","space","power","budget"].forEach(key=>add(plan.input?.[key],value=>{plan.input[key]=value;}));
  add(plan.solution,value=>{plan.solution=value;});
  add(plan.why,value=>{plan.why=value;});
  (plan.parts||[]).forEach(part=>{
    add(part.name,value=>{part.name=value;});
    add(part.size,value=>{part.size=value;});
    add(part.reason,value=>{part.reason=value;});
  });
  (plan.flow||[]).forEach((value,index)=>add(value,translated=>{plan.flow[index]=translated;}));
  (plan.wiring||[]).forEach(connection=>{
    add(connection.from,value=>{connection.from=value;});
    add(connection.to,value=>{connection.to=value;});
    add(connection.note,value=>{connection.note=value;});
  });
  (plan.tests||[]).forEach((value,index)=>add(value,translated=>{plan.tests[index]=translated;}));
  add(plan.esp32Upgrade,value=>{plan.esp32Upgrade=value;});
}

async function translateCurrentPage(targetLanguage){
  const project=activeProject();
  const pending=[];
  const add=(value,setter)=>{
    if(value===undefined||value===null||String(value).trim()===""||String(value)==="—")return;
    pending.push({text:String(value),setter});
  };

  state.projects.forEach(item=>{
    item.titleTranslations=item.titleTranslations||{};
    if(!item.titleTranslations[targetLanguage]){
      const sourceTitle=item.titleTranslations.en||item.titleTranslations.zh||item.title;
      add(sourceTitle,value=>{item.titleTranslations[targetLanguage]=value;});
    }
  });

  (project.messages||[]).forEach(message=>{
    message.translations=message.translations||{};
    if(!message.translations[targetLanguage]){
      const sourceText=message.translations.en||message.translations.zh||message.content;
      add(sourceText,value=>{message.translations[targetLanguage]=value;});
    }
  });

  if(project.plan){
    project.planTranslations=project.planTranslations||{};
    if(!project.planTranslations[targetLanguage]){
      const sourcePlan=project.planTranslations.en||project.planTranslations.zh||project.plan;
      const translatedPlan=structuredClone(sourcePlan);
      collectPlanTranslationItems(translatedPlan,add);
      project.planTranslations[targetLanguage]=translatedPlan;
    }
  }

  if(!pending.length){render();return;}
  setStatus("thinking");

  try{
    for(let start=0;start<pending.length;start+=30){
      const batch=pending.slice(start,start+30);
      const response=await fetch("/api/translate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({targetLanguage,texts:batch.map(item=>item.text)})
      });
      const data=await response.json();
      if(!response.ok||!Array.isArray(data.translations)||data.translations.length!==batch.length){
        throw new Error(data.error||"Translation failed");
      }
      batch.forEach((item,index)=>item.setter(data.translations[index]));
    }
    save();
    render();
    setStatus("ready");
  }catch(error){
    console.error(error);
    if(project.planTranslations)delete project.planTranslations[targetLanguage];
    setStatus("error");
  }
}
async function checkConnection(){
  try{
    const response=await fetch("/api/status",{cache:"no-store"});
    if(!response.ok) throw new Error("status unavailable");
    const data=await response.json();
    setStatus(data.aiConfigured?"ready":"error");
  }catch(error){
    setStatus("error");
  }
}
function setStatus(type){
  const status=document.getElementById("connectionStatus");
  status.className="status mono"+(type==="thinking"?" thinking":type==="error"?" error":"");
  status.textContent=word(type==="thinking"?"thinking":type==="error"?"offline":"ready");
}

document.getElementById("chatForm").onsubmit=event=>{
  event.preventDefault();
  const input=document.getElementById("chatInput"); const value=input.value.trim();
  if(!value){window.alert(word("emptyMessage"));return;}
  input.value=""; sendMessage(value);
};
document.querySelectorAll("[data-prompt-en]").forEach(button=>{button.onclick=()=>sendMessage(state.language==="zh"?button.dataset.promptZh:button.dataset.promptEn);});

document.getElementById("newProject").onclick=()=>{
  const title=window.prompt(word("newName"),state.language==="en"?"New Project":"新项目");
  if(!title||!title.trim())return;
  const project=makeProject(title.trim(),false); project.messages[0].content=word("welcome");
  project.messages[0].translations={[state.language]:word("welcome")};
  project.titleTranslations={[state.language]:title.trim()};
  state.projects.push(project);state.activeId=project.id;save();render();
};
document.getElementById("renameButton").onclick=()=>{
  const project=activeProject(); const title=window.prompt(word("renamePrompt"),localizedTitle(project));
  if(!title||!title.trim())return;
  project.title=title.trim();project.titleTranslations=project.titleTranslations||{};project.titleTranslations[state.language]=title.trim();project.updated=new Date().toISOString();save();render();
};
document.getElementById("pinButton").onclick=()=>{
  const project=activeProject();project.pinned=!project.pinned;project.updated=new Date().toISOString();save();render();
};
document.getElementById("deleteButton").onclick=()=>{
  if(state.projects.length===1){window.alert(word("cannotDelete"));return;}
  const project=activeProject();
  document.getElementById("deleteCopy").textContent=word("deleteQuestion")+" “"+localizedTitle(project)+"”";
  document.getElementById("confirmDialog").showModal();
};
document.getElementById("confirmDelete").onclick=()=>{
  const current=state.activeId;state.projects=state.projects.filter(p=>p.id!==current);state.activeId=state.projects[0].id;save();render();
};
document.getElementById("languageButton").onclick=async()=>{
  state.language=state.language==="en"?"zh":"en";
  save();
  render();
  await translateCurrentPage(state.language);
};

document.getElementById("exportButton").onclick=()=>downloadJson(activeProject(),activeProject().id+".json");
document.getElementById("downloadPlan").onclick=()=>{
  const project=activeProject();
  const plan=localizedPlan(project);
  if(!plan){window.alert(word("downloadEmpty"));return;}
  openPlanPrintView(project,plan);
};

function escapeHtml(value){
  return text(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[character]));
}

function openPlanPrintView(project,plan){
  const printWindow=window.open("","_blank","width=900,height=700");
  if(!printWindow){
    window.alert(state.language==="zh"?"浏览器阻止了打印窗口，请允许弹出窗口后重试。":"The browser blocked the print window. Allow pop-ups and try again.");
    return;
  }

  const input=plan.input||{};
  const parts=(plan.parts||[]).map(part=>`<tr><td>${escapeHtml(part.name)}</td><td>${escapeHtml(part.quantity)}</td><td>${escapeHtml(part.size)}</td><td>${escapeHtml(part.reason)}</td></tr>`).join("");
  const wiring=(plan.wiring||[]).map(connection=>`<tr><td>${escapeHtml(connection.from)}</td><td>${escapeHtml(connection.to)}</td><td>${escapeHtml(connection.note)}</td></tr>`).join("");
  const tests=(plan.tests||[]).map(step=>`<li>${escapeHtml(step)}</li>`).join("");
  const flow=(plan.flow||[]).map(item=>escapeHtml(item)).join(" → ");
  const optional=plan.esp32Upgrade?`<section><h2>${escapeHtml(word("espUpgrade"))}</h2><p>${escapeHtml(plan.esp32Upgrade)}</p></section>`:"";
  const saveHint=state.language==="zh"?"在打印窗口中选择“存储为 PDF”。":"Choose “Save as PDF” in the print window.";

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html lang="${state.language==="zh"?"zh-CN":"en"}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(localizedTitle(project))} — ${escapeHtml(word("prototypePlan"))}</title>
<style>
@page{size:A4;margin:15mm}
*{box-sizing:border-box}
body{margin:0;color:#151515;background:white;font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45}
header{display:flex;justify-content:space-between;align-items:end;padding-bottom:12px;border-bottom:2px solid #151515}
h1{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:28pt;font-weight:400}
.brand{font-family:"Courier New",monospace;font-size:9pt;letter-spacing:.08em;text-transform:uppercase}
.hint{margin:8px 0 22px;color:#666;font-size:9pt}
.summary{display:grid;grid-template-columns:repeat(4,1fr);margin:20px 0;border:1px solid #777}
.summary div{padding:9px;border-right:1px solid #bbb}.summary div:last-child{border-right:0}
.summary span{display:block;margin-bottom:3px;color:#666;font-size:8pt;text-transform:uppercase}.summary strong{font-size:10pt}
section{margin:0 0 18px;break-inside:avoid}h2{margin:0 0 8px;padding-bottom:5px;border-bottom:1px solid #999;font-family:"Courier New",monospace;font-size:12pt;text-transform:uppercase}
p{margin:0 0 7px}.why{padding:8px 10px;background:#eee;border-left:3px solid #222}
table{width:100%;border-collapse:collapse;font-size:9.5pt}th,td{padding:6px;border:1px solid #aaa;text-align:left;vertical-align:top}th{color:white;background:#222}
.flow{padding:12px;border:1px solid #777;text-align:center;font-family:"Courier New",monospace;font-weight:700}
ol{margin:0;padding-left:23px}li{margin:4px 0}
@media print{.hint{display:none}}
</style>
</head>
<body>
<header><div><div class="brand">PCom Assistant</div><h1>${escapeHtml(localizedTitle(project))}</h1></div><div class="brand">${escapeHtml(word("prototypePlan"))}</div></header>
<p class="hint">${escapeHtml(saveHint)}</p>
<div class="summary">
  <div><span>${escapeHtml(word("idea"))}</span><strong>${escapeHtml(input.idea)}</strong></div>
  <div><span>${escapeHtml(word("space"))}</span><strong>${escapeHtml(input.space)}</strong></div>
  <div><span>${escapeHtml(word("power"))}</span><strong>${escapeHtml(input.power)}</strong></div>
  <div><span>${escapeHtml(word("budget"))}</span><strong>${escapeHtml(input.budget)}</strong></div>
</div>
<section><h2>${escapeHtml(word("solution"))}</h2><p>${escapeHtml(plan.solution)}</p><p class="why">${escapeHtml(plan.why)}</p></section>
<section><h2>${escapeHtml(word("shopping"))}</h2><table><thead><tr><th>${escapeHtml(word("component"))}</th><th>${escapeHtml(word("quantity"))}</th><th>${escapeHtml(word("size"))}</th><th>${escapeHtml(word("reason"))}</th></tr></thead><tbody>${parts}</tbody></table></section>
<section><h2>${escapeHtml(word("how"))}</h2><div class="flow">${flow}</div></section>
<section><h2>${escapeHtml(word("wiring"))}</h2><table><thead><tr><th>${escapeHtml(word("from"))}</th><th>${escapeHtml(word("to"))}</th><th>${escapeHtml(word("note"))}</th></tr></thead><tbody>${wiring}</tbody></table></section>
<section><h2>${escapeHtml(word("test"))}</h2><ol>${tests}</ol></section>
${optional}
</body>
</html>`);
  printWindow.document.close();
  window.setTimeout(()=>{printWindow.focus();printWindow.print();},350);
}

function downloadJson(data,name){
  const file=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const link=document.createElement("a");link.href=URL.createObjectURL(file);link.download=name;link.click();URL.revokeObjectURL(link.href);
}
document.getElementById("importButton").onclick=()=>document.getElementById("importFile").click();
document.getElementById("importFile").onchange=event=>{
  const file=event.target.files[0];if(!file)return;const reader=new FileReader();
  reader.onload=()=>{
    try{
      const project=JSON.parse(reader.result);
      if(!project.title||!Array.isArray(project.messages))throw new Error("invalid");
      project.id="project-"+Date.now();project.updated=new Date().toISOString();state.projects.push(project);state.activeId=project.id;save();render();window.alert(word("imported"));
    }catch(error){window.alert(word("invalid"));}
  };
  reader.readAsText(file);event.target.value="";
};

function setMobilePanel(panel){
  const chat=panel==="chat";document.getElementById("chatPanel").classList.toggle("mobile-hide",!chat);
  document.getElementById("planPanel").classList.toggle("mobile-hide",chat);
  document.getElementById("showChat").classList.toggle("active",chat);
  document.getElementById("showPlan").classList.toggle("active",!chat);
}
document.getElementById("showChat").onclick=()=>setMobilePanel("chat");
document.getElementById("showPlan").onclick=()=>setMobilePanel("plan");
window.addEventListener("resize",()=>{if(window.innerWidth>850){document.getElementById("chatPanel").classList.remove("mobile-hide");document.getElementById("planPanel").classList.remove("mobile-hide");}});

render();
checkConnection();















