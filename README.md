# 🚀 Customer Service Productivity Suite
**(Suite de Produtividade para Atendimento e Vendas)**

> **[English]** A collection of **UserScripts** developed to optimize workflow, reduce clicks, and prevent human errors within **Hyperflow** and **WhatsApp Web** environments.
>
> **[Português]** Uma coleção de **UserScripts** desenvolvida para otimizar o fluxo de trabalho, reduzir cliques e prevenir erros humanos nos ambientes **Hyperflow** e **WhatsApp Web**.

---

## 🛠 Technologies & Concepts
* **JavaScript (ES6+)**
* **DOM Manipulation** (Interface Injection)
* **LocalStorage API** (Data Persistence)
* **MutationObserver** (SPA state monitoring)
* **Clipboard API** & Event Handling
* **CSS Flexbox** (Responsive UI)

---

## 📂 The Projects (Os Projetos)

### 1. Financial Proposal Generator (Gerador de Propostas Financeiras)

![Demo Gerador de Propostas](assets/demo-gerador.gif)
> *Acima: Painel flutuante calculando datas e gerando texto de negociação automaticamente.*

**[EN]** An advanced tool that injects a calculator panel directly into the CRM interface. It automates the math for debt negotiation and generates standardized negotiation texts instantly.

**[BR]** Uma ferramenta avançada que injeta um painel de calculadora diretamente na interface do CRM. Ela automatiza a matemática da negociação de dívidas e gera textos de negociação padronizados instantaneamente.

* **Smart Date Logic:** Calculates due dates automatically based on business days, utilizing an integrated calendar of **Brazilian National Holidays (2025-2027)**.
* **Validation:** Prevents logic errors (e.g., ensuring credit card installments are calculated correctly).
* **One-Click Action:** Copies a fully formatted message ready to be sent via WhatsApp.
* **Tech:** `Date Object`, `Arrays`, `CSS Injection`.

---

### 2. Smart Corporate Notepad (Bloco de Notas Inteligente)

![Demo Bloco de Notas](assets/demo-bloco.gif)
> *Acima: Bloco de notas integrado com salvamento automático para anotações rápidas durante o atendimento.*

**[EN]** A persistent, floating workspace for temporary data storage during customer interactions, designed to eliminate the need for external apps like Windows Notepad.

**[BR]** Um espaço de trabalho flutuante e persistente para armazenamento temporário de dados durante interações com clientes, projetado para eliminar a necessidade de apps externos como o Bloco de Notas do Windows.

* **State Persistence:** Uses `LocalStorage` to save notes automatically. Data remains safe even if the browser crashes or the page refreshes.
* **Floating UI:** Draggable interface that overlays the CRM without blocking critical information.
* **Privacy First:** Data is stored locally in the user's browser, ensuring security.
* **Tech:** `LocalStorage API`, `Draggable UI Logic`.

---

### 3. SmartCopy Daemon

![Demo SmartCopy](assets/demo-smartcopy.gif)

**[EN]** A background utility that solves the conflict between "selecting text to edit" vs. "copying text to paste" in web-based spreadsheets and CRM inputs.

**[BR]** Um utilitário de segundo plano que resolve o conflito entre "selecionar texto para editar" vs. "copiar texto para colar" em planilhas web e inputs de CRM.

* **Context Awareness:** Blocks auto-copy when the user drags the mouse (interpreting it as an intent to edit).
* **Triple-Click Trigger:** Intelligently enables auto-copy only on **triple-click**, facilitating bulk data transfer from spreadsheets.
* **Global Protection:** Prevents accidental copying from restricted sensitive UI areas (like the Financial Panel).
* **Tech:** `Event Listeners (Click/MouseUp)`, `Selection API`.

---

## 🚀 Installation (Instalação)

**[EN]** These tools are designed to run with script managers like **Tampermonkey** or **Violentmonkey**.

**[BR]** Estas ferramentas foram projetadas para rodar com gerenciadores de script como **Tampermonkey** ou **Violentmonkey**.

1. Install the extension in your browser (e.g., [Tampermonkey](https://www.tampermonkey.net/)).
2. Click on the desired script below to open the code, then click the **"Raw"** button to install:
    * [📄 Install Financial Proposal Generator](scripts/GeradorPropostas.user.js)
    * [📄 Install Smart Corporate Notepad](scripts/bloconotasflowkey.user.js)
    * [📄 Install SmartCopy Daemon](scripts/SmartCopy.user.js)
4. Confirm installation.
5. Refresh Page.

---

## 👤 Author
**Paulo Sereduc**
*Biologist & Tech Enthusiast | Solucionando problemas reais de negócio através de código.*
