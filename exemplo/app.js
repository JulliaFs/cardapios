/* Modelo de cardápio — lógica. Não precisa mexer aqui: tudo da loja fica no config.js. */
(() => {
  "use strict";
  const C = window.CARDAPIO;
  if (!C) { document.body.innerHTML = "<p style='padding:24px'>Faltou o config.js.</p>"; return; }

  const $ = (s, el = document) => el.querySelector(s);
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dinheiro = v => brl.format(v || 0);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const loja = C.loja || {};
  const CHAVE = "cardapio-" + slugify(loja.slug || loja.nome || "loja");

  const guardar = (k, v) => { try { localStorage.setItem(CHAVE + k, JSON.stringify(v)); } catch (e) {} };
  const ler = (k, padrao) => { try { const v = localStorage.getItem(CHAVE + k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } };

  /* ---------- Tema e fontes ---------- */
  const FONTES = {
    brasa: "family=Anton&family=Figtree:wght@400;500;600;700;800",
    forno: "family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Figtree:wght@400;500;600;700;800",
    doce: "family=Yeseva+One&family=Nunito:wght@400;600;700;800"
  };
  const temaUrl = new URLSearchParams(location.search).get("tema");
  const tema = FONTES[temaUrl] ? temaUrl : (FONTES[C.tema] ? C.tema : "brasa");
  document.documentElement.dataset.tema = tema;
  if (C.cores && !temaUrl) for (const [k, v] of Object.entries(C.cores)) document.documentElement.style.setProperty("--" + k, v);
  const fonte = document.createElement("link");
  fonte.rel = "stylesheet";
  fonte.href = `https://fonts.googleapis.com/css2?${FONTES[tema]}&display=swap`;
  document.head.appendChild(fonte);
  requestAnimationFrame(() => {
    const fundo = getComputedStyle(document.documentElement).getPropertyValue("--fundo").trim();
    if (fundo) $('meta[name="theme-color"]').content = fundo;
  });

  /* ---------- Horário ---------- */
  const paraMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
  const hora = t => { const [h, m] = t.split(":"); return m && m !== "00" ? `${+h}h${m}` : `${+h}h`; };
  const H = C.horarios || {};
  function status(agora = new Date()) {
    if (!C.horarios) return null;
    const d = agora.getDay(), m = agora.getHours() * 60 + agora.getMinutes();
    const ontem = H[(d + 6) % 7], hoje = H[d];
    if (ontem) { const [a, f] = ontem.map(paraMin); if (f <= a && m < f) return { aberto: true, fecha: ontem[1] }; }
    if (hoje) { const [a, f] = hoje.map(paraMin); if (m >= a && (f <= a || m < f)) return { aberto: true, fecha: hoje[1] }; }
    for (let i = 0; i < 8; i++) {
      const dd = (d + i) % 7, h = H[dd];
      if (!h) continue;
      if (i === 0 && paraMin(h[0]) <= m) continue;
      return { aberto: false, abre: h[0], quando: i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS[dd] };
    }
    return { aberto: false };
  }
  const st = status();

  /* ---------- Topo ---------- */
  document.title = `${loja.nome} · Cardápio e pedidos${loja.cidade ? " em " + loja.cidade : ""}`;
  const desc = `${loja.nome}${loja.slogan ? ": " + loja.slogan : ""}. Veja o cardápio e peça pelo WhatsApp.`;
  $('meta[name="description"]').content = desc;
  [["og:title", document.title], ["og:description", desc], ["og:image", loja.capa || loja.logo || ""]].forEach(([p, v]) => {
    if (!v) return; const m = document.createElement("meta"); m.setAttribute("property", p); m.content = v; document.head.appendChild(m);
  });

  $("#nome-loja").textContent = loja.nome;
  $("#slogan").textContent = loja.slogan || "";
  $("#logo").innerHTML = loja.logo ? `<img src="${esc(loja.logo)}" alt="Logo ${esc(loja.nome)}">` : esc((loja.nome || "?").trim()[0]);
  if (loja.capa) { $(".hero").classList.add("tem-foto"); $(".hero__capa").style.backgroundImage = `url("${loja.capa}")`; }

  const chips = [];
  if (st) chips.push(st.aberto
    ? `<li class="status aberto">Aberto agora · até ${hora(st.fecha)}</li>`
    : `<li class="status fechado">Fechado${st.abre ? ` · abre ${st.quando} às ${hora(st.abre)}` : ""}</li>`);
  const E = C.entrega || {};
  if (E.ativa && E.tempo) chips.push(`<li>🛵 ${esc(E.tempo)}</li>`);
  if (E.ativa && E.pedidoMinimo) chips.push(`<li>Mínimo ${dinheiro(E.pedidoMinimo)}</li>`);
  if (loja.endereco) chips.push(`<li class="chip-link"><a href="${esc(loja.mapa || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(loja.endereco + " " + (loja.cidade || "")))}" target="_blank" rel="noopener">📍 ${esc(loja.endereco)}</a></li>`);
  $("#chips").innerHTML = chips.join("");

  /* ---------- Cardápio ---------- */
  const cats = (C.categorias || []).map(c => ({ ...c, id: c.id || slugify(c.nome), itens: (c.itens || []).map(i => ({ ...i, id: i.id || slugify(c.nome + "-" + i.nome), cat: c })) }));
  const itens = new Map();
  cats.forEach(c => c.itens.forEach(i => itens.set(i.id, i)));

  const fotoHTML = (i, alt = true) => i.foto
    ? `<div class="foto"><img src="${esc(i.foto)}" alt="${alt ? esc(i.nome) : ""}" loading="lazy"></div>`
    : `<div class="foto foto--vazia"><span aria-hidden="true">${esc(i.emoji || i.cat.emoji || "🍽️")}</span></div>`;
  const precoHTML = i => `${dinheiro(i.preco)}${i.precoAntigo ? `<s>${dinheiro(i.precoAntigo)}</s>` : ""}`;

  const dest = cats.flatMap(c => c.itens).filter(i => i.destaque && !i.esgotado);
  if (dest.length) {
    $("#destaques-wrap").hidden = false;
    $("#destaques").innerHTML = dest.map(i => `
      <button class="dest" type="button" data-item="${esc(i.id)}">
        ${fotoHTML(i)}
        <span class="dest__txt"><strong>${esc(i.nome)}</strong><span>${dinheiro(i.preco)}</span></span>
      </button>`).join("");
  }

  $("#cats").innerHTML = cats.map(c => `<a href="#cat-${esc(c.id)}" data-cat="${esc(c.id)}">${esc(c.nome)}</a>`).join("");
  $("#secoes").innerHTML = cats.map(c => `
    <section class="secao" id="cat-${esc(c.id)}" data-cat="${esc(c.id)}">
      <h2>${esc(c.nome)}</h2>
      ${c.descricao ? `<p>${esc(c.descricao)}</p>` : ""}
      <ul class="itens">
        ${c.itens.map(i => `
          <li data-busca="${esc(slugify(i.nome + " " + (i.descricao || "")))}">
            <button class="item${i.esgotado ? " esgotado" : ""}" type="button" data-item="${esc(i.id)}" ${i.esgotado ? 'aria-disabled="true"' : ""}>
              <div>
                ${i.selo ? `<span class="selo">${esc(i.selo)}</span>` : ""}
                <p class="item__nome">${esc(i.nome)}</p>
                ${i.descricao ? `<p class="item__desc">${esc(i.descricao)}</p>` : ""}
                <span class="item__preco">${i.esgotado ? "Esgotado" : precoHTML(i)}</span>
              </div>
              ${fotoHTML(i, false)}
            </button>
          </li>`).join("")}
      </ul>
    </section>`).join("");

  // categoria ativa durante a rolagem
  const links = [...document.querySelectorAll("#cats a")];
  const marcar = id => links.forEach(a => {
    const on = a.dataset.cat === id; a.classList.toggle("ativa", on);
    if (on) a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => {
      const vis = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) marcar(vis.target.dataset.cat);
    }, { rootMargin: "-80px 0px -60% 0px" });
    document.querySelectorAll(".secao").forEach(s => io.observe(s));
  }

  // busca
  const busca = $("#busca");
  busca.addEventListener("input", () => {
    const q = slugify(busca.value);
    let total = 0;
    document.querySelectorAll(".secao").forEach(s => {
      let n = 0;
      s.querySelectorAll("li[data-busca]").forEach(li => { const ok = !q || li.dataset.busca.includes(q); li.hidden = !ok; if (ok) n++; });
      s.hidden = n === 0; total += n;
    });
    $("#sem-resultado").hidden = total > 0;
    $("#destaques-wrap").hidden = !!q || !dest.length;
    busca.parentElement.classList.toggle("ativa", !!q);
  });

  /* ---------- Rodapé ---------- */
  const hojeIdx = new Date().getDay();
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  $("#rodape").innerHTML = `
    ${C.horarios ? `<div><h3>Horários</h3><dl class="horarios">${ordem.map(d => `
      <dt class="${d === hojeIdx ? "hoje" : ""}">${DIAS[d]}</dt>
      <dd class="${d === hojeIdx ? "hoje" : ""}">${H[d] ? `${hora(H[d][0])} às ${hora(H[d][1])}` : "Fechado"}</dd>`).join("")}</dl></div>` : ""}
    <div><h3>Onde estamos</h3>
      ${loja.endereco ? `<p style="margin:0 0 6px">${esc(loja.endereco)}${loja.cidade ? ", " + esc(loja.cidade) : ""}</p>` : ""}
      <p style="margin:0">
        ${loja.instagram ? `<a href="https://instagram.com/${esc(loja.instagram.replace("@", ""))}" target="_blank" rel="noopener">Instagram</a> · ` : ""}
        <a href="https://wa.me/${esc(loja.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
      </p>
    </div>
    ${C.credito ? `<p class="credito">${C.credito.url ? `<a href="${esc(C.credito.url)}" target="_blank" rel="noopener">${esc(C.credito.texto)}</a>` : esc(C.credito.texto)}</p>` : ""}`;

  /* ---------- Dados estruturados (Google) ---------- */
  const ld = {
    "@context": "https://schema.org", "@type": loja.tipo || "Restaurant",
    name: loja.nome, telephone: "+" + loja.whatsapp, servesCuisine: loja.cozinha || undefined,
    address: loja.endereco ? { "@type": "PostalAddress", streetAddress: loja.endereco, addressLocality: loja.cidade, addressCountry: "BR" } : undefined,
    image: loja.capa || loja.logo || undefined, url: location.href.split("?")[0],
    sameAs: loja.instagram ? ["https://instagram.com/" + loja.instagram.replace("@", "")] : undefined,
    hasMenu: { "@type": "Menu", hasMenuSection: cats.map(c => ({ "@type": "MenuSection", name: c.nome,
      hasMenuItem: c.itens.map(i => ({ "@type": "MenuItem", name: i.nome, description: i.descricao, offers: { "@type": "Offer", price: i.preco, priceCurrency: "BRL" } })) })) }
  };
  const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(ld); document.head.appendChild(s);

  /* ---------- Sacola ---------- */
  let sacola = ler("-sacola", []).filter(l => itens.has(l.itemId));
  const subtotal = () => sacola.reduce((t, l) => t + l.unit * l.qtd, 0);
  const qtdTotal = () => sacola.reduce((t, l) => t + l.qtd, 0);
  function atualizarBarra(pular) {
    const b = $("#sacola-barra");
    b.hidden = sacola.length === 0;
    $("#sacola-qtd").textContent = qtdTotal();
    $("#sacola-total").textContent = dinheiro(subtotal());
    if (pular) { b.classList.remove("pulo"); void b.offsetWidth; b.classList.add("pulo"); }
    guardar("-sacola", sacola);
  }
  let toastT;
  const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 1800); };

  /* ---------- Folha do item ---------- */
  const dlgItem = $("#dlg-item");
  let atual = null, qtd = 1;
  function totalItem() {
    const extras = [...dlgItem.querySelectorAll(".adicional input:checked")].reduce((t, el) => t + Number(el.dataset.preco), 0);
    return (atual.preco + extras) * qtd;
  }
  const atualizarItem = () => { $("#item-qtd").textContent = qtd; $("#item-total").textContent = "· " + dinheiro(totalItem()); };
  function abrirItem(id) {
    const i = itens.get(id); if (!i || i.esgotado) return;
    atual = i; qtd = 1;
    $("#item-foto").innerHTML = fotoHTML(i);
    $("#item-nome").textContent = i.nome;
    $("#item-desc").textContent = i.descricao || "";
    $("#item-preco").innerHTML = precoHTML(i);
    $("#item-obs").value = "";
    const ad = i.adicionais || i.cat.adicionais || [];
    $("#item-adicionais").hidden = !ad.length;
    $("#item-adicionais-lista").innerHTML = ad.map((a, n) => `
      <label class="adicional"><input type="checkbox" data-nome="${esc(a.nome)}" data-preco="${Number(a.preco) || 0}" id="ad-${n}">
        <span>${esc(a.nome)}</span><em>+ ${dinheiro(a.preco)}</em></label>`).join("");
    atualizarItem();
    dlgItem.showModal();
    dlgItem.querySelector(".item-det").scrollTop = 0;
  }
  dlgItem.addEventListener("change", atualizarItem);
  $("#item-menos").onclick = () => { if (qtd > 1) { qtd--; atualizarItem(); } };
  $("#item-mais").onclick = () => { if (qtd < 50) { qtd++; atualizarItem(); } };
  $("#item-add").onclick = () => {
    const extras = [...dlgItem.querySelectorAll(".adicional input:checked")].map(el => ({ nome: el.dataset.nome, preco: Number(el.dataset.preco) }));
    const obs = $("#item-obs").value.trim();
    const chave = atual.id + "|" + extras.map(e => e.nome).join(",") + "|" + obs;
    const unit = atual.preco + extras.reduce((t, e) => t + e.preco, 0);
    const ex = sacola.find(l => l.chave === chave);
    if (ex) ex.qtd += qtd; else sacola.push({ chave, itemId: atual.id, nome: atual.nome, extras, obs, unit, qtd });
    dlgItem.close();
    atualizarBarra(true);
    toast(`${qtd}× ${atual.nome} na sacola`);
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-item]"); if (b) abrirItem(b.dataset.item);
  });
  // fechar clicando fora
  document.querySelectorAll("dialog").forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));

  /* ---------- Finalizar pedido ---------- */
  const dlgSacola = $("#dlg-sacola");
  const form = $("#form-pedido");
  const modos = [];
  if (E.ativa) modos.push(["entrega", "Entrega"]);
  if (C.retirada !== false) modos.push(["retirada", "Retirar no local"]);
  $("#modo").innerHTML = modos.map(([v, t], n) => `<label><input type="radio" name="modo" value="${v}" ${n === 0 ? "checked" : ""}><span>${t}</span></label>`).join("");
  const bairros = E.bairros || [];
  if (bairros.length) {
    $("#campo-bairro").hidden = false;
    $("#bairro").innerHTML = `<option value="">Escolha o bairro</option>` + bairros.map((b, n) => `<option value="${n}">${esc(b.nome)} · ${b.taxa ? dinheiro(b.taxa) : "grátis"}</option>`).join("");
  }
  const pags = C.pagamentos || ["Pix", "Cartão na entrega", "Dinheiro"];
  $("#pagamentos").innerHTML = pags.map(p => `<label><input type="radio" name="pagamento" value="${esc(p)}"><span>${esc(p)}</span></label>`).join("");
  $("#info-retirada").textContent = loja.endereco ? `Retire em: ${loja.endereco}${loja.cidade ? ", " + loja.cidade : ""}` : "";

  const cliente = ler("-cliente", {});
  ["cliente", "endereco", "complemento"].forEach(k => { if (cliente[k]) form.elements[k].value = cliente[k]; });
  if (cliente.bairro != null && bairros[cliente.bairro]) form.elements.bairro.value = cliente.bairro;

  const modo = () => (form.querySelector('input[name="modo"]:checked') || {}).value || "retirada";
  const taxa = () => {
    if (modo() !== "entrega") return 0;
    if (bairros.length) { const b = bairros[form.elements.bairro.value]; return b ? b.taxa || 0 : null; }
    return E.taxa || 0;
  };

  function renderSacola() {
    $("#linhas").innerHTML = sacola.map((l, n) => `
      <li class="linha">
        <span class="linha__nome">${esc(l.nome)}</span>
        <span class="linha__preco">${dinheiro(l.unit * l.qtd)}</span>
        ${l.extras.length ? `<span class="linha__extra">+ ${l.extras.map(e => esc(e.nome)).join(", ")}</span>` : ""}
        ${l.obs ? `<span class="linha__extra">“${esc(l.obs)}”</span>` : ""}
        <div class="qtd" role="group" aria-label="Quantidade de ${esc(l.nome)}">
          <button type="button" data-linha="${n}" data-d="-1" aria-label="${l.qtd === 1 ? "Remover" : "Diminuir"}">${l.qtd === 1 ? "🗑" : "−"}</button>
          <output>${l.qtd}</output>
          <button type="button" data-linha="${n}" data-d="1" aria-label="Aumentar">+</button>
        </div>
      </li>`).join("");
    const ent = modo() === "entrega";
    $("#bloco-entrega").hidden = !ent;
    $("#info-retirada").hidden = ent || !loja.endereco;
    const tx = taxa();
    $("#totais").innerHTML = `
      <dt>Subtotal</dt><dd>${dinheiro(subtotal())}</dd>
      ${ent ? `<dt>Entrega</dt><dd>${tx === null ? "escolha o bairro" : tx ? dinheiro(tx) : "Grátis"}</dd>` : ""}
      <dt class="total">Total</dt><dd class="total">${dinheiro(subtotal() + (tx || 0))}</dd>`;
    $("#campo-troco").hidden = !/dinheiro/i.test((form.querySelector('input[name="pagamento"]:checked') || {}).value || "");
    const av = $("#aviso-fechado");
    av.hidden = !st || st.aberto;
    if (st && !st.aberto) av.textContent = `Estamos fechados agora${st.abre ? ` (abrimos ${st.quando} às ${hora(st.abre)})` : ""}. Você pode mandar o pedido, e a gente responde assim que abrir.`;
  }
  $("#linhas").addEventListener("click", e => {
    const b = e.target.closest("[data-linha]"); if (!b) return;
    const l = sacola[+b.dataset.linha]; l.qtd += +b.dataset.d;
    if (l.qtd <= 0) sacola.splice(+b.dataset.linha, 1);
    atualizarBarra(); renderSacola();
    if (!sacola.length) dlgSacola.close();
  });
  form.addEventListener("change", renderSacola);
  $("#sacola-barra").onclick = () => { renderSacola(); $("#erro").hidden = true; dlgSacola.showModal(); };
  $("#continuar").onclick = () => dlgSacola.close();

  form.addEventListener("submit", e => {
    e.preventDefault();
    form.querySelectorAll(".invalido").forEach(el => el.classList.remove("invalido"));
    const erros = [];
    const marca = (el, msg) => { el.classList.add("invalido"); erros.push(msg); };
    const ent = modo() === "entrega";
    const f = form.elements;
    if (!sacola.length) erros.push("Sua sacola está vazia.");
    if (ent && bairros.length && f.bairro.value === "") marca(f.bairro, "Escolha o bairro.");
    if (ent && f.endereco.value.trim().length < 5) marca(f.endereco, "Coloque a rua e o número.");
    if (f.cliente.value.trim().length < 2) marca(f.cliente, "Coloque seu nome.");
    const pag = (form.querySelector('input[name="pagamento"]:checked') || {}).value;
    if (!pag) { $("#pagamentos").classList.add("invalido"); erros.push("Escolha a forma de pagamento."); }
    if (ent && E.pedidoMinimo && subtotal() < E.pedidoMinimo) erros.push(`O pedido mínimo para entrega é ${dinheiro(E.pedidoMinimo)}.`);
    const erro = $("#erro");
    if (erros.length) { erro.innerHTML = erros.map(esc).join("<br>"); erro.hidden = false; erro.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    erro.hidden = true;

    guardar("-cliente", { cliente: f.cliente.value.trim(), endereco: f.endereco.value.trim(), complemento: f.complemento.value.trim(), bairro: f.bairro.value });

    const tx = taxa() || 0;
    const L = [];
    L.push(`*Pedido · ${loja.nome}*`, "");
    sacola.forEach(l => {
      L.push(`${l.qtd}x ${l.nome} · ${dinheiro(l.unit * l.qtd)}`);
      l.extras.forEach(x => L.push(`   + ${x.nome}`));
      if (l.obs) L.push(`   Obs: ${l.obs}`);
    });
    L.push("", `Subtotal: ${dinheiro(subtotal())}`);
    if (ent) L.push(`Entrega${bairros.length ? " (" + bairros[f.bairro.value].nome + ")" : ""}: ${tx ? dinheiro(tx) : "grátis"}`);
    L.push(`*Total: ${dinheiro(subtotal() + tx)}*`, "");
    L.push(`Nome: ${f.cliente.value.trim()}`);
    if (ent) {
      L.push(`Entrega em: ${f.endereco.value.trim()}${bairros.length ? ", " + bairros[f.bairro.value].nome : ""}`);
      if (f.complemento.value.trim()) L.push(`Complemento: ${f.complemento.value.trim()}`);
    } else L.push("Vou retirar no local");
    let p = `Pagamento: ${pag}`;
    if (/dinheiro/i.test(pag) && f.troco.value.trim()) p += ` (troco para R$ ${f.troco.value.trim()})`;
    L.push(p);
    if (/pix/i.test(pag) && C.pix && C.pix.chave) L.push(`(chave Pix: ${C.pix.chave})`);
    if (f["obs-pedido"] && f["obs-pedido"].value.trim()) L.push("", `Obs: ${f["obs-pedido"].value.trim()}`);

    const url = `https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(L.join("\n"))}`;
    const w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
    sacola = []; atualizarBarra(); dlgSacola.close();
    toast("Pedido enviado pro WhatsApp!");
  });

  atualizarBarra();
})();
