const enviarMensagem = async () => {
  const url = "http://localhost:8081/message/sendText/ecogestao";
  
  const dados = {
    number: "5551993290240", // Coloque o seu número aqui (55 + DDD + Número)
    options: {
      delay: 1500,
      presence: "composing" // Isso faz aparecer o "digitando..." lá no WhatsApp!
    },
    textMessage: {
      text: "🤖 *EcoGestão:* Olá, Pamella! Minha cupinxa, estou vivo e pronto para cobrar os lançamentos das encarregadas!"
    }
  };

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "EcoMindsX2026"
      },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();
    console.log("Sucesso! Resposta da API:", resultado);
  } catch (erro) {
    console.log("Opa, deu erro:", erro);
  }
};

enviarMensagem();