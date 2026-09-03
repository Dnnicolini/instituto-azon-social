"use client";

import { useMemo, useState } from "react";

const events = [
  { id:"sabeje-2026", title:"Sabeje Sepetiba 2026", category:"Cultura e ancestralidade", status:"Próximos", date:"29 de agosto de 2026", time:"Concentração às 9h", place:"Praça Américo Marçal, Sepetiba", description:"Caminhos de Axé, tradição e ancestralidade. A caminhada segue pelas ruas de Sepetiba até o Hunkpame Azon Legidan.", image:"/evento-sabeje.png", imageClass:"crop-instagram", badge:"Nova data: 29/08", action:"Acompanhar informações", href:"https://www.instagram.com/azonlegidan/" },
  { id:"lewa-ori", title:"Seleção para o Projeto Lewa Orí", category:"Saúde mental", status:"Inscrições abertas", date:"Inscrições abertas", time:"Seleção remota", place:"Atendimento on-line", description:"Entrevistas on-line para acolhimento, avaliação e possível inserção no atendimento psicanalítico gratuito do projeto.", image:"/evento-lewa-ori.png", imageClass:"", badge:"Vagas limitadas", action:"Solicitar informações", href:"mailto:instituto.azonsocial@gmail.com?subject=Inscrição%20Projeto%20Lewa%20Orí" },
  { id:"aman-mudas", title:"Cadastro de mudas e ervas — Projeto Aman", category:"Meio ambiente", status:"Inscrições abertas", date:"Cadastro contínuo", time:"Formulário on-line", place:"Rio de Janeiro", description:"Cadastre-se para receber mudas e ervas e ser informado sobre novas plantas disponibilizadas pelo projeto Aman — Folhas de Axé.", image:"/evento-aman-mudas.png", imageClass:"", badge:"Cadastro aberto", action:"Preencher formulário", href:"https://forms.gle/gQwuyTMevgnSVNyS9" },
];

export default function EventosPage() {
  const [filter, setFilter] = useState("Todos");
  const filtered = useMemo(() => filter === "Todos" ? events : events.filter((event) => event.status === filter), [filter]);
  return (
    <main className="events-page">
      <header className="site-header events-header">
        <a className="brand" href="/" aria-label="Voltar ao início"><span className="brand-mark"><img src="/azon-social-logo.png" alt="" /></span><span><strong>Azon Social</strong><small>Instituto</small></span></a>
        <nav className="events-nav" aria-label="Navegação da página de eventos"><a href="/">Início</a><a href="/#projetos">Projetos</a><a href="/#noticias">Notícias</a><a className="active" href="/eventos">Eventos</a><a className="button button-small" href="/#contato">Contato</a></nav>
      </header>
      <section className="events-hero"><div><p className="eyebrow light">Agenda Azon Social</p><h1>Encontros que fortalecem <em>nossa comunidade.</em></h1></div><p>Confira inscrições abertas, atividades, celebrações e ações construídas pelo Instituto Azon Social e pelo Hunkpame Azon Legidan.</p></section>
      <section className="events-content">
        <div className="events-toolbar"><div><p className="eyebrow">Participe</p><h2>Eventos e oportunidades</h2></div><div className="filters" role="group" aria-label="Filtrar eventos">{["Todos","Inscrições abertas","Próximos","Realizados"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="event-list">{filtered.length ? filtered.map((event) => (
          <article className="event-card" key={event.id}>
            <div className="event-image"><img className={event.imageClass} src={event.image} alt={event.title} /><span className="event-badge">{event.badge}</span></div>
            <div className="event-info"><div className="event-meta"><span>{event.category}</span><b>{event.status}</b></div><h3>{event.title}</h3><p>{event.description}</p><dl><div><dt>Data</dt><dd>{event.date}</dd></div><div><dt>Horário</dt><dd>{event.time}</dd></div><div><dt>Local</dt><dd>{event.place}</dd></div></dl>{event.id === "sabeje-2026" && <p className="date-warning"><strong>Atenção:</strong> o evento foi remarcado para 29/08/2026. A arte original apresenta a data anterior.</p>}<a className="button button-event" href={event.href} target="_blank" rel="noreferrer">{event.action} ↗</a></div>
          </article>
        )) : <div className="events-empty"><h3>Ainda não há itens nesta categoria.</h3><p>Novas atividades serão publicadas aqui em breve.</p></div>}</div>
      </section>
      <section className="events-team"><div className="events-team-image"><img src="/evento-aman-equipe.png" alt="Equipe do projeto Aman — Folhas de Axé" /></div><div><p className="eyebrow light">Quem faz acontecer</p><h2>Projetos feitos por pessoas, para pessoas.</h2><p>Conheça quem cultiva saberes, cuida da vida e honra nossas raízes em cada ação do Instituto.</p><a className="text-link light" href="/#projetos">Conheça nossos projetos <span>→</span></a></div></section>
      <footer className="events-footer"><div className="footer-brand"><span className="brand-mark"><img src="/azon-social-logo.png" alt="" /></span><div><strong>Azon Social</strong><p>Ancestralidade, cuidado e transformação social.</p></div></div><div><strong>Informações</strong><a href="mailto:instituto.azonsocial@gmail.com">instituto.azonsocial@gmail.com</a><a href="tel:+5521951015058">(21) 95101-5058</a></div><div><strong>Acompanhe</strong><a href="https://www.instagram.com/azon.social/" target="_blank" rel="noreferrer">@azon.social ↗</a><a href="https://www.instagram.com/azonlegidan/" target="_blank" rel="noreferrer">@azonlegidan ↗</a></div><p className="copyright">© {new Date().getFullYear()} Instituto Azon Social</p></footer>
    </main>
  );
}
