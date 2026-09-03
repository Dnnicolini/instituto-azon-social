"use client";

import { useState } from "react";

const menu = [
  ["Visão geral", "⌂"], ["Páginas", "▤"], ["Projetos", "◆"], ["Notícias", "◫"],
  ["Eventos", "□"], ["Transparência", "◎"], ["Mensagens", "✉"], ["Administradores", "♙"], ["Configurações", "⚙"]
];

const recent = [
  { type: "Evento", title: "Sabeje Sepetiba 2026", status: "Publicado", date: "29/08/2026" },
  { type: "Projeto", title: "Lewa Orí", status: "Publicado", date: "Atualizado hoje" },
  { type: "Notícia", title: "Folhas, território e ancestralidade", status: "Rascunho", date: "Há 2 dias" },
  { type: "Documento", title: "Relatório anual 2026", status: "Em preparação", date: "Há 4 dias" },
];

export default function AdminPage() {
  const [active, setActive] = useState("Visão geral");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");

  function selectSection(label: string) {
    setActive(label);
    setMenuOpen(false);
    setNotice(label === "Visão geral" ? "" : `${label}: tela de gerenciamento prevista para a versão final.`);
  }

  return (
    <main className="admin-shell">
      <aside className={menuOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <a className="admin-sidebar-brand" href="/"><span className="brand-mark"><img src="/azon-social-logo.png" alt="" /></span><span><strong>Azon Social</strong><small>Painel administrativo</small></span></a>
        <nav>{menu.map(([label, icon]) => <button key={label} className={active === label ? "active" : ""} onClick={() => selectSection(label)}><span>{icon}</span>{label}{label === "Mensagens" && <b>3</b>}</button>)}</nav>
        <div className="admin-sidebar-footer"><div className="admin-avatar">IA</div><div><strong>Instituto Azon</strong><small>Administrador</small></div><a href="/admin/login" aria-label="Sair">↗</a></div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar"><button className="admin-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button><div><small>Painel administrativo</small><strong>{active}</strong></div><div className="admin-top-actions"><button aria-label="Notificações">♢<b></b></button><a href="/" target="_blank">Ver site ↗</a></div></header>
        <div className="admin-content">
          <div className="admin-welcome"><div><p className="eyebrow">Instituto Azon Social</p><h1>Olá, seja bem-vindo.</h1><p>Veja o que está acontecendo no site e mantenha as informações sempre atualizadas.</p></div><button className="admin-primary-button" onClick={() => setModal(true)}>＋ Novo conteúdo</button></div>
          {notice && <div className="admin-notice"><strong>{notice}</strong><span>Esta apresentação mostra o fluxo e a aparência do painel.</span></div>}

          <div className="admin-stats">
            <article><span className="blue">◆</span><div><small>Projetos ativos</small><strong>4</strong><em>Todos publicados</em></div></article>
            <article><span className="gold">◫</span><div><small>Notícias</small><strong>3</strong><em>1 em rascunho</em></div></article>
            <article><span className="green">□</span><div><small>Próximos eventos</small><strong>2</strong><em>1 inscrição aberta</em></div></article>
            <article><span className="brown">✉</span><div><small>Novas mensagens</small><strong>3</strong><em>Aguardando resposta</em></div></article>
          </div>

          <div className="admin-grid">
            <section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><h2>Conteúdos recentes</h2><p>Últimas publicações e alterações realizadas.</p></div><button onClick={() => selectSection("Páginas")}>Ver todos →</button></div><div className="admin-table"><div className="admin-table-head"><span>Conteúdo</span><span>Tipo</span><span>Status</span><span>Data</span><span></span></div>{recent.map(item => <div className="admin-table-row" key={item.title}><span><b>{item.title.charAt(0)}</b><strong>{item.title}</strong></span><span>{item.type}</span><span><em className={item.status === "Publicado" ? "published" : "draft"}>{item.status}</em></span><span>{item.date}</span><button aria-label={`Opções de ${item.title}`}>•••</button></div>)}</div></section>
            <aside className="admin-panel quick-panel"><div className="admin-panel-heading"><div><h2>Acesso rápido</h2><p>O que você deseja atualizar?</p></div></div>{[["＋","Novo evento","Divulgue uma nova ação"],["＋","Nova notícia","Compartilhe uma novidade"],["↥","Enviar documento","Adicione à transparência"],["✎","Editar página inicial","Atualize textos e números"]].map(([icon,title,text]) => <button key={title} onClick={() => setModal(true)}><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div><b>›</b></button>)}</aside>
          </div>

          <section className="admin-panel admin-site-card"><div><span className="site-status-dot"></span><div><h2>Site publicado</h2><p>As informações públicas estão disponíveis normalmente.</p></div></div><div><small>Última atualização</small><strong>Hoje, às 14:32</strong></div><a href="/" target="_blank">Abrir site ↗</a></section>
        </div>
      </section>

      {modal && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setModal(false)}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-content-title" onMouseDown={e => e.stopPropagation()}><button className="admin-modal-close" onClick={() => setModal(false)}>×</button><p className="eyebrow">Novo cadastro</p><h2 id="new-content-title">O que você quer publicar?</h2><p>Escolha uma opção para iniciar o cadastro.</p><div className="admin-modal-options">{["Evento","Projeto","Notícia","Documento","Página institucional"].map(item => <button key={item} onClick={() => {setModal(false); setNotice(`${item}: formulário de cadastro previsto para a versão final.`)}}><span>＋</span><strong>{item}</strong><b>›</b></button>)}</div></section></div>}
    </main>
  );
}
