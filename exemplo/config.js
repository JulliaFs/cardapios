/* =========================================================
   TUDO DA LOJA FICA AQUI. Pra fazer o cardápio de um cliente,
   copie a pasta inteira e troque só este arquivo.
   (Este exemplo é uma loja inventada, só pra demonstração.)
   ========================================================= */
window.CARDAPIO = {
  // Estilo: "brasa" (hamburgueria/bar), "forno" (pizzaria/padaria) ou "doce" (confeitaria/café)
  tema: "brasa",
  // Pra usar as cores da marca do cliente, descomente e troque:
  // cores: { primaria: "#e63946", destaque: "#ffd166" },

  loja: {
    nome: "Brasa 77",
    slogan: "Smash na chapa quente, do jeito que tem que ser.",
    whatsapp: "5511900000000",          // só números, com 55 + DDD
    endereco: "Rua Exemplo, 77 - Centro",
    cidade: "Diadema - SP",
    instagram: "@brasa77",
    logo: "",                           // ex.: "img/logo.png" (vazio = primeira letra do nome)
    capa: "",                           // ex.: "img/capa.jpg" (foto do salão ou do lanche)
    tipo: "Restaurant",
    cozinha: "Hambúrguer"
  },

  // Dia da semana: 0 = domingo ... 6 = sábado. null = fechado.
  // Se fechar depois da meia-noite, é só colocar ["18:30", "02:00"].
  horarios: {
    0: ["18:00", "23:30"],
    1: null,
    2: ["18:00", "23:30"],
    3: ["18:00", "23:30"],
    4: ["18:00", "23:30"],
    5: ["18:00", "01:00"],
    6: ["18:00", "01:00"]
  },

  entrega: {
    ativa: true,
    tempo: "40–60 min",
    pedidoMinimo: 25,
    taxa: 6,                            // usado quando não tem lista de bairros
    bairros: [                          // apague a lista pra usar taxa única
      { nome: "Centro", taxa: 5 },
      { nome: "Vila Nogueira", taxa: 6 },
      { nome: "Conceição", taxa: 7 },
      { nome: "Serraria", taxa: 8 },
      { nome: "Piraporinha", taxa: 8 }
    ]
  },
  retirada: true,

  pagamentos: ["Pix", "Cartão na entrega", "Dinheiro"],
  pix: { chave: "" },                   // se preencher, a chave vai junto no pedido

  credito: { texto: "Site feito por Jullia", url: "https://julliafs.github.io/portfolio/" },

  categorias: [
    {
      nome: "Smash",
      emoji: "🍔",
      descricao: "Pão brioche selado na manteiga. Blend 100% bovino, 80 g cada carne.",
      adicionais: [
        { nome: "Carne extra", preco: 7 },
        { nome: "Bacon", preco: 5 },
        { nome: "Cheddar cremoso", preco: 4 },
        { nome: "Cebola caramelizada", preco: 3 }
      ],
      itens: [
        { nome: "Smash Simples", descricao: "1 carne, queijo prato e maionese da casa.", preco: 22 },
        { nome: "Smash Duplo", descricao: "2 carnes, dobro de queijo, cebola na chapa e maionese da casa.", preco: 30, destaque: true, selo: "Mais pedido" },
        { nome: "Smash Bacon", descricao: "2 carnes, cheddar, bacon crocante e barbecue.", preco: 34, destaque: true },
        { nome: "Smash Salada", descricao: "2 carnes, queijo, alface, tomate e cebola roxa.", preco: 31 },
        { nome: "Triplo 77", descricao: "3 carnes, 3 queijos, bacon e molho especial. Pra quem tá com fome de verdade.", preco: 42, precoAntigo: 46, destaque: true, selo: "Promo" }
      ]
    },
    {
      nome: "Combos",
      emoji: "🍟",
      descricao: "Acompanha batata 120 g e refri lata.",
      itens: [
        { nome: "Combo Duplo", descricao: "Smash Duplo + batata + refri.", preco: 42 },
        { nome: "Combo Bacon", descricao: "Smash Bacon + batata + refri.", preco: 46 },
        { nome: "Combo Casal", descricao: "2 Smash Duplo + batata grande + 2 refris.", preco: 79, selo: "Pra dividir" }
      ]
    },
    {
      nome: "Porções",
      emoji: "🧀",
      itens: [
        { nome: "Batata frita", descricao: "300 g, sal e páprica.", preco: 18 },
        { nome: "Batata cheddar e bacon", descricao: "300 g com cheddar cremoso e bacon.", preco: 27 },
        { nome: "Onion rings", descricao: "12 anéis empanados + maionese verde.", preco: 22, esgotado: true }
      ]
    },
    {
      nome: "Bebidas",
      emoji: "🥤",
      itens: [
        { nome: "Refrigerante lata", descricao: "Coca, Coca Zero, Guaraná ou Fanta (diga na observação).", preco: 7 },
        { nome: "Suco natural 400 ml", descricao: "Laranja, limão ou maracujá.", preco: 10 },
        { nome: "Água", preco: 4 }
      ]
    },
    {
      nome: "Sobremesas",
      emoji: "🍫",
      itens: [
        { nome: "Brownie", descricao: "Com casquinha crocante e calda de chocolate.", preco: 12 },
        { nome: "Milk-shake Ninho", descricao: "400 ml, Ninho com Nutella.", preco: 19 }
      ]
    }
  ]
};
