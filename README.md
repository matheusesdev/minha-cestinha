# Minha Cestinha

Aplicativo simples e intuitivo para controlar sua lista de compras, acompanhar metas de gasto, historico e analises. Os dados ficam salvos localmente no navegador via `localStorage`.

## Funcionalidades

- Cadastro de itens com nome, quantidade, unidade e categoria
- Calculo automatico do total da cestinha
- Meta de gasto com barra de progresso
- Historico de compras finalizadas
- Analises do consumo e comparacao de precos
- Interface responsiva com foco em mobile

## Tecnologias

- React 19
- Vite 7
- Tailwind CSS 3
- Lucide Icons

## Como rodar o projeto

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

## Build de producao

```bash
npm run build
npm run preview
```

## Estrutura de pastas

```
src/
	components/
		ui/
	data/
	views/
	App.jsx
	main.jsx
public/
	screenshots/
```

## Prints das telas

> Coloque os arquivos em `public/screenshots` com os nomes abaixo.

![Tela de Cestinha](public/screenshots/cestinha.png)
![Tela de Analise](public/screenshots/analise.png)
![Tela de Historico](public/screenshots/historico.png)

## Licenca

Este projeto e de uso livre para fins de estudo.
