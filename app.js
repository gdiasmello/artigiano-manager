const SENHA_ADM = "1821";

// LOGIN
function login() {
  const senha = document.getElementById("senha").value;

  if (senha === SENHA_ADM) {
    localStorage.setItem("admLogado", "true");
    mostrarPainel();
  } else {
    document.getElementById("erroLogin").innerText = "❌ Senha incorreta";
  }
}

function logout() {
  localStorage.removeItem("admLogado");
  location.reload();
}

function mostrarPainel() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("painel").classList.remove("hidden");
  carregarEstoque();
}

// ESTOQUE
function adicionarProduto() {
  const produto = document.getElementById("produto").value;
  const quantidade = document.getElementById("quantidade").value;

  if (!produto || quantidade <= 0) return;

  const estoque = JSON.parse(localStorage.getItem("estoque")) || [];

  estoque.push({ produto, quantidade });

  localStorage.setItem("estoque", JSON.stringify(estoque));

  document.getElementById("produto").value = "";
  document.getElementById("quantidade").value = "";

  carregarEstoque();
}

function carregarEstoque() {
  const lista = document.getElementById("listaEstoque");
  lista.innerHTML = "";

  const estoque = JSON.parse(localStorage.getItem("estoque")) || [];

  estoque.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.produto} — ${item.quantidade}`;
    lista.appendChild(li);
  });
}

// AUTO LOGIN
if (localStorage.getItem("admLogado") === "true") {
  mostrarPainel();
}
