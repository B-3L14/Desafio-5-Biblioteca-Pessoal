# 📚 Biblioteca Pessoal — Open Library API

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)
![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-yellow)
![License](https://img.shields.io/badge/license-MIT-green)
![OpenLibrary](https://img.shields.io/badge/API-Open%20Library-orange)
![LocalStorage](https://img.shields.io/badge/persistência-LocalStorage-lightgrey)

---

## 📖 Descrição Geral do Projeto

Este projeto foi desenvolvido para o cumprimento de um desafio técnico cujo objetivo é implementar um sistema capaz de:

- Buscar livros utilizando a **Open Library API**
- Exibir capa, autor, ano, descrição e outras informações
- Manter uma estante pessoal persistida localmente
- Registrar e gerenciar empréstimos
- Acompanhar vencimentos automáticos
- Exportar dados para CSV

O desenvolvimento utiliza **HTML, CSS e JavaScript (ESModules)** — sem frameworks — privilegiando arquitetura modular, código legível e simplicidade na execução.

---

## 🎯 Funcionalidades Atendidas (Requisitos do Desafio)

### 1. Busca de livros

- Busca por **título**, **autor** ou **ISBN**
- Exibe capa, autor, ano, idioma
- Obtém descrições reais usando:  
  `https://openlibrary.org/works/WORK_ID.json`

### 2. Exibição de detalhes

- Quando a API oferece descrição, ela é exibida no card
- Caso não exista, mostra mensagem alternativa

### 3. CRUD da estante pessoal

- Adicionar livro
- Editar status:

  #### Status de leitura

  - `Lido`
  - `Lendo`
  - `Relendo`
  - `Leitura Interrompida`

  #### Status de empréstimo

  - `Emprestado`
  - `Devolvido`
  - `Em atraso`

- Remover livro

### 4. Registro de empréstimos

- Nome do leitor
- Data de empréstimo
- Data de renovação
- Status do empréstimo
- Detecção automática de atraso

### 5. Persistência local

- Todos os dados são salvos no navegador em: `localStorage`
- Exemplo de item salvo (formato JSON):

```json
{
  "id": "OL12345M",
  "title": "Nome do Livro",
  "authors": ["Fulano"],
  "cover_i": 12345,
  "readingStatus": "Lido",
  "loanStatus": "Emprestado",
  "borrower": "Maria",
  "loanDate": "2025-01-10T10:30:00.000Z"
}
```

## Tecnologias Utilizadas

HTML5  
CSS3  
JavaScript (ES6+)  
Open Library API  
LocalStorage para persistência dos dados

---

## Como Executar Localmente

Nenhuma dependência externa é necessária. Duas formas comuns de executar o projeto localmente:

- Abrir `index.html` diretamente no navegador (simples, mas pode apresentar restrições de fetch/CORS em alguns navegadores).
- Rodar um servidor HTTP local para evitar problemas com requisições:

PowerShell / Terminal:

```powershell
python -m http.server 8000
# ou (Node.js):
npx http-server . -p 8000
```

Abra `http://localhost:8000` após rodar um dos comandos acima.

Se preferir usar o Live Server do VS Code, abra a pasta do projeto e clique em "Go Live".

---

## API Utilizada

A aplicação utiliza a Open Library API para realizar buscas de livros. Os dados retornados incluem título, autor, capas e identificadores que permitem consultar descrições mais detalhadas quando disponíveis.

Endpoint de exemplo para descrições de obras:

`https://openlibrary.org/works/WORK_ID.json`

---

## Funcionalidades (Resumo)

- Busca por título/autor/ISBN
- Cards com capa, autor, ano e descrição (quando disponível)
- CRUD completo da estante pessoal
- Status de leitura (`Lido`, `Lendo`, `Relendo`, `Leitura Interrompida`) e status de empréstimo (`Emprestado`, `Devolvido`, `Em atraso`)
- Registro e gestão de empréstimos com detecção automática de vencimento
- Exportação para CSV (botão disponível na página da estante)

---

## Teste de Vencimento de Empréstimos

Para validar o comportamento do sistema em relação ao prazo de devolução de livros emprestados, é possível simular datas antigas diretamente pelo DevTools do navegador. Isso permite testar cenários como "1 dia restante" ou "Em atraso" sem precisar aguardar dias reais.

### Como Acessar e Editar o LocalStorage

1. Abra a aplicação no navegador e vá até a página da estante.
2. Abra o DevTools (F12).
3. Acesse a aba **Application** (Chrome/Edge) ou **Storage** (Firefox).
4. No menu lateral, abra **Local Storage** e selecione o domínio do site.
5. Localize a chave `biblioteca_pessoal_books` onde os livros estão armazenados.
6. Edite o valor JSON manualmente para alterar o campo `loanDate` correspondente à data de empréstimo.

#### Simulações rápidas

- `loanDate` com **6 dias atrás** → simula **1 dia restante** (prazo padrão: 7 dias)
- `loanDate` com **8 dias atrás** → simula status **Em atraso**

Após editar e salvar no LocalStorage, recarregue a página para o sistema recalcular os prazos.

---

## Exportar / Backup

Há uma funcionalidade de exportação para CSV na página da estante. O CSV inclui campos básicos como `id`, `title`, `authors`, `readingStatus`, `loanStatus`, `borrower`, `loanDate`.

Também é possível copiar/baixar o conteúdo do `localStorage` (chave `biblioteca_pessoal_books`) como backup manual.

---

## Compatibilidade

Funciona em navegadores modernos (Chrome, Edge, Firefox). Testado principalmente em Chrome/Edge.

---
