🛒 Minha Cestinha

Sua companheira inteligente para compras de mercado. Controle gastos, gerencie sua lista e analise seu histórico de compras.

<!-- Dica: Substitua o link acima por um print real do seu aplicativo funcionando -->

📋 Sobre o Projeto

Minha Cestinha é uma aplicação web focada em dispositivos móveis (Mobile First) desenvolvida para auxiliar durante as compras de supermercado. Diferente de uma lista de tarefas comum, ela foca no controle financeiro em tempo real, permitindo que o usuário saiba exatamente quanto vai pagar antes de chegar ao caixa.

A aplicação funciona totalmente no navegador e utiliza LocalStorage para persistir os dados, garantindo que você não perca sua lista mesmo se fechar a aba.

✨ Funcionalidades

📝 Gestão de Lista (CRUD): Adicione, edite e remova itens com facilidade.

🧮 Calculadora Automática: O valor total é atualizado instantaneamente ao mudar quantidades ou preços.

⚖️ Unidades de Medida: Suporte para itens por unidade (un) ou peso (kg), com cálculo de preço fracionado.

💰 Meta de Gastos: Defina um teto para sua compra e receba alertas visuais se ultrapassar o orçamento.

📊 Análise de Gastos: Gráficos visuais que mostram a distribuição dos gastos por categoria (Hortifruti, Carnes, Limpeza, etc.).

history Histórico de Compras: Salve suas compras finalizadas para consultar preços antigos e totais mensais.

📈 Comparador de Preços: Ao adicionar um item que você já comprou antes, o app avisa se o preço subiu ou desceu.

📱 Design Responsivo: Interface otimizada para uso com uma mão só (thumb-friendly) em smartphones.

🚀 Tecnologias Utilizadas

Este projeto foi desenvolvido com as tecnologias mais modernas do ecossistema React:

React - Biblioteca para construção de interfaces.

Vite - Tooling frontend de próxima geração (rápido e leve).

Tailwind CSS - Framework de utilitários CSS para estilização ágil.

Lucide React - Biblioteca de ícones leve e bonita.

📦 Como Rodar o Projeto

Para rodar este projeto localmente, você precisará ter o Node.js instalado em sua máquina.

Clone o repositório:

git clone [https://github.com/SEU_USUARIO/minha-cestinha.git](https://github.com/SEU_USUARIO/minha-cestinha.git)


Entre na pasta do projeto:

cd minha-cestinha


Instale as dependências:

npm install


Execute o servidor de desenvolvimento:

npm run dev


Acesse no navegador:
O projeto estará rodando em http://localhost:5173 (ou a porta indicada no terminal).

🛠️ Estrutura de Pastas

src/
├── components/      # Componentes de UI (Botões, Cards, Modais)
├── data/            # Dados estáticos (Categorias)
├── App.jsx          # Lógica principal e Views
├── main.jsx         # Ponto de entrada
└── index.css        # Estilos globais e Tailwind


📱 Instalação no Celular (PWA)

Embora seja um site, você pode "instalar" no seu celular:

Acesse o site pelo navegador do celular.

Abra o menu de opções.

Selecione "Adicionar à Tela Inicial".

O app aparecerá como um aplicativo nativo no seu menu.

🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um Pull Request.

Faça um Fork do projeto

Crie uma Branch para sua Feature (git checkout -b feature/MinhaFeature)

Faça o Commit (git commit -m 'Adicionando MinhaFeature')

Faça o Push (git push origin feature/MinhaFeature)

Abra um Pull Request

📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

Feito com 💚 para ajudar nas compras do mês.
