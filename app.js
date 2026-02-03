const ADM_PIN = "1821";
let currentSector = null;

const db = JSON.parse(localStorage.getItem("db")) || {
  holiday:false,
  items:{
    sacolao:[
      {name:"Tomate",meta:10,stock:0,unit:"CX"},
      {name:"Alface",meta:5,stock:0,unit:"UN"}
    ],
    limpeza:[],
    gelo:[],
    geral:[]
  }
};

function save(){localStorage.setItem("db",JSON.stringify(db));}

function show(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function login(){
  const nome=document.getElementById("nome").value;
  const pin=document.getElementById("pin").value;
  const remember=document.getElementById("remember").checked;

  if(pin.length!==4){
    error("PIN inválido");
    return;
  }

  if(remember) localStorage.setItem("user",nome);

  document.getElementById("welcome").innerText=`Olá, ${nome}`;
  document.getElementById("holidayBadge").style.display=db.holiday?"inline-block":"none";

  show("dashboard");
}

function error(msg){
  document.getElementById("loginError").innerText=msg;
  navigator.vibrate?.(200);
}

function logout(){show("login");}

function openInventory(sector){
  currentSector=sector;
  document.getElementById("sectorTitle").innerText=sector.toUpperCase();
  const box=document.getElementById("items");
  box.innerHTML="";

  db.items[sector].forEach((item,i)=>{
    const meta=calcMeta(item.meta,sector);
    const div=document.createElement("div");
    div.className="item "+(item.stock>=meta?"ok":"low");
    div.innerHTML=`
      <strong>${item.name}</strong><br>
      Meta: ${meta}<br>
      <input type="number" value="${item.stock}"
      onchange="updateStock(${i},this.value)">
    `;
    box.appendChild(div);
  });

  show("inventory");
}

function calcMeta(base,sector){
  let m=base;
  if(new Date().getDay()===5 && sector==="sacolao") m*=3;
  if(db.holiday) m*=1.5;
  return Math.ceil(m);
}

function updateStock(i,val){
  db.items[currentSector][i].stock=Number(val);
  save();
  openInventory(currentSector);
}

function openCart(){
  let txt="PEDIDO PIZZERIA MASTER\n\n";
  Object.keys(db.items).forEach(sec=>{
    db.items[sec].forEach(it=>{
      const meta=calcMeta(it.meta,sec);
      if(it.stock<meta){
        txt+=`✅ ${meta-it.stock} ${it.unit} - ${it.name}\n`;
      }
    });
  });
  document.getElementById("cartText").innerText=txt;
  show("cart");
}

function sendWhatsApp(){
  const msg=encodeURIComponent(document.getElementById("cartText").innerText);
  window.open(`https://wa.me/?text=${msg}`);
}

function goDashboard(){show("dashboard");}

function openAdmin(){
  const pin=prompt("PIN ADM:");
  if(pin===ADM_PIN){
    show("admin");
  }else{
    alert("Acesso negado");
    navigator.vibrate?.(300);
  }
}

function toggleHoliday(v){
  db.holiday=v;
  save();
}

function exportData(){
  const blob=new Blob([JSON.stringify(db)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="backup-pizzeria.json";
  a.click();
}

const remembered=localStorage.getItem("user");
if(remembered) document.getElementById("nome").value=remembered;
