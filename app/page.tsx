"use client";

import { FormEvent, useMemo, useState } from "react";

const projects = [
  { tag: "Saúde mental", title: "Lewa Orí", tone: "blue", text: "Acolhimento, escuta qualificada e cuidado emocional como um direito para todas as pessoas." },
  { tag: "Cozinha social", title: "Ayidonun", tone: "gold", text: "Alimento como sustento, memória, afeto, dignidade e fortalecimento comunitário." },
  { tag: "Ervas de Axé", title: "Aman", tone: "green", text: "Valorização das folhas, dos saberes tradicionais e da relação ancestral com a natureza." },
  { tag: "Lutas sociais", title: "Emi Syó", tone: "brown", text: "Mobilização, defesa de direitos e fortalecimento das vozes do nosso território." },
];

const news = [
  { category: "Saúde Mental", date: "Em destaque", title: "Lewa Orí: escuta que transforma", text: "Conheça a iniciativa que promove acolhimento e cuidado emocional em comunidade.", tone: "blue" },
  { category: "Cozinha Social", date: "Em destaque", title: "Cozinha Ancestral Ayidonun", text: "Saberes, sabores e afeto reunidos para alimentar pessoas e preservar memórias.", tone: "gold" },
  { category: "Meio Ambiente", date: "Em destaque", title: "Folhas, território e ancestralidade", text: "O projeto Aman fortalece conhecimentos que atravessam gerações.", tone: "green" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [newsFilter, setNewsFilter] = useState("Todas");
  const [sent, setSent] = useState(false);
  const filteredNews = useMemo(() => newsFilter === "Todas" ? news : news.filter((item) => item.category === newsFilter), [newsFilter]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Instituto Azon Social — início">
          <span className="brand-mark"><img src="/azon-social-logo.png" alt="" /></span>
          <span><strong>Azon Social</strong><small>Instituto</small></span>
        </a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu" aria-expanded={menuOpen}><span></span><span></span><span></span></button>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Navegação principal">
          {[["O Instituto","#instituto"],["Projetos","#projetos"],["Notícias","#noticias"],["Agenda","#agenda"],["Transparência","#transparencia"]].map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="button button-small" href="#participar" onClick={() => setMenuOpen(false)}>Faça parte</a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-pattern" aria-hidden="true"></div>
        <div className="hero-copy">
          <p className="eyebrow light">Educação • Cultura • Cuidado • Território</p>
          <h1>Ancestralidade que cuida.<br /><em>Ação que transforma.</em></h1>
          <p className="hero-text">Ações sociais, culturais e ambientais que fortalecem pessoas, preservam saberes ancestrais e transformam territórios.</p>
          <div className="hero-actions"><a className="button button-gold" href="#projetos">Conheça nossos projetos</a><a className="text-link light" href="#participar">Quero fazer parte <span>↗</span></a></div>
        </div>
        <div className="hero-visual"><div className="sun" aria-hidden="true"></div><div className="logo-disc"><img src="/azon-social-logo.png" alt="Logomarca do Instituto Azon Social" /></div><p className="hero-note">Sepetiba • Rio de Janeiro</p></div>
      </section>

      <section className="intro section" id="instituto">
        <div><p className="eyebrow">Quem somos</p><h2>Cuidar das pessoas também é preservar nossas raízes.</h2></div>
        <div className="intro-copy"><p>O Instituto Azon Social nasceu da experiência comunitária e dos valores cultivados no Hunkpame Azon Legidan. Nossa atuação une ancestralidade, cuidado, educação, cultura, defesa de direitos e preservação ambiental.</p><a className="text-link" href="#historia">Conheça nossa história <span>→</span></a></div>
        <div className="values-row">
          <article><b>01</b><h3>Ancestralidade</h3><p>Saberes que atravessam gerações e orientam nosso caminho.</p></article>
          <article><b>02</b><h3>Cuidado coletivo</h3><p>Acolher, escutar e construir soluções junto à comunidade.</p></article>
          <article><b>03</b><h3>Transformação social</h3><p>Defender a vida, a dignidade e novas possibilidades no território.</p></article>
        </div>
      </section>

      <section className="projects section" id="projetos">
        <div className="section-heading"><div><p className="eyebrow">Nossas iniciativas</p><h2>Projetos que transformam</h2></div><p>Cada projeto nasce de uma necessidade real e cresce por meio da escuta, da participação e do compromisso comunitário.</p></div>
        <div className="project-grid">{projects.map((project, index) => <article className={`project-card ${project.tone}`} key={project.title}><div className="card-top"><span>{project.tag}</span><b>0{index + 1}</b></div><div className="project-symbol" aria-hidden="true">{project.title.charAt(0)}</div><h3>{project.title}</h3><p>{project.text}</p><a href="#contato" aria-label={`Conhecer o projeto ${project.title}`}>Conhecer projeto <span>↗</span></a></article>)}</div>
      </section>

      <section className="impact"><div><p className="eyebrow light">Impacto social</p><h2>Nosso impacto é construído em comunidade.</h2></div><p className="impact-copy">Cada número representa uma história, um encontro e uma transformação construída coletivamente.</p><div className="impact-numbers">{["Pessoas alcançadas","Ações realizadas","Parcerias construídas","Projetos em andamento"].map((label) => <div key={label}><strong>—</strong><span>{label}</span></div>)}</div></section>

      <section className="news section" id="noticias">
        <div className="section-heading compact"><div><p className="eyebrow">Azon News</p><h2>Histórias do nosso território</h2></div><p>Notícias, atividades, encontros e mobilizações do Instituto Azon Social.</p></div>
        <div className="filters" role="group" aria-label="Filtrar notícias por categoria">{["Todas","Saúde Mental","Cozinha Social","Meio Ambiente"].map((filter) => <button className={newsFilter === filter ? "active" : ""} onClick={() => setNewsFilter(filter)} key={filter}>{filter}</button>)}</div>
        <div className="news-grid">{filteredNews.map((item) => <article className="news-card" key={item.title}><div className={`news-art ${item.tone}`}><span>{item.category}</span></div><div className="news-body"><small>{item.date}</small><h3>{item.title}</h3><p>{item.text}</p><a href="#contato">Continuar lendo →</a></div></article>)}</div>
      </section>

      <section className="agenda section" id="agenda"><div><p className="eyebrow">Agenda</p><h2>Próximas atividades</h2></div><div className="agenda-empty"><span className="calendar-icon">+</span><div><h3>Novas atividades serão divulgadas em breve.</h3><p>Acompanhe a programação e os bastidores também pelo nosso Instagram.</p></div><a className="button button-outline" href="https://www.instagram.com/azon.social/" target="_blank" rel="noreferrer">Acompanhar no Instagram ↗</a></div></section>

      <section className="history" id="historia"><div className="history-mark" aria-hidden="true">A</div><div><p className="eyebrow light">De onde viemos</p><h2>Uma história que nasce no território e na ancestralidade.</h2></div><div><p>O Instituto Azon Social nasce no Hunkpame Azon Legidan, espaço de tradição, fé, preservação cultural e cuidado comunitário. Essa ancestralidade orienta valores como respeito, acolhimento, responsabilidade coletiva, defesa da natureza e valorização da vida.</p><a className="text-link light" href="https://www.instagram.com/azonlegidan/" target="_blank" rel="noreferrer">Conheça o Hunkpame <span>↗</span></a></div></section>

      <section className="participate section" id="participar"><div className="section-heading"><div><p className="eyebrow">Caminhe com a gente</p><h2>Existem muitas formas de transformar.</h2></div><p>Some sua presença, experiência ou apoio à construção de um território mais justo e acolhedor.</p></div><div className="participate-grid">{[{n:"01",t:"Seja voluntário",d:"Compartilhe seu tempo e conhecimento com nossos projetos."},{n:"02",t:"Seja parceiro",d:"Construa ações e oportunidades em parceria com o Instituto."},{n:"03",t:"Apoie nossas ações",d:"Contribua para a continuidade e ampliação das iniciativas sociais."}].map((item) => <a href="#contato" key={item.t}><span>{item.n}</span><h3>{item.t}</h3><p>{item.d}</p><b>Quero participar ↗</b></a>)}</div></section>

      <section className="transparency section" id="transparencia"><div><p className="eyebrow">Compromisso público</p><h2>Transparência fortalece confiança.</h2><p>Este espaço será dedicado a relatórios, documentos, parcerias, indicadores e prestação de contas do Instituto.</p></div><div className="document-list">{["Relatórios anuais","Prestação de contas","Estatuto e políticas","Parcerias e resultados"].map((item) => <div key={item}><span>{item}</span><small>Em preparação</small></div>)}</div></section>

      <section className="contact section" id="contato">
        <div className="contact-copy"><p className="eyebrow light">Entre em contato</p><h2>Vamos construir juntos?</h2><p>Envie sua mensagem para saber mais sobre projetos, parcerias, voluntariado e formas de apoio.</p><p className="location">Sepetiba • Rio de Janeiro — RJ</p></div>
        <form onSubmit={handleSubmit}><label>Nome<input required name="name" placeholder="Seu nome completo" /></label><label>E-mail<input required type="email" name="email" placeholder="voce@exemplo.com" /></label><label>Assunto<select required name="subject" defaultValue=""><option value="" disabled>Selecione uma opção</option><option>Informações</option><option>Voluntariado</option><option>Parceria</option><option>Doação</option><option>Imprensa</option><option>Projetos</option></select></label><label>Mensagem<textarea required name="message" placeholder="Como podemos conversar?" rows={4}></textarea></label><button className="button button-gold" type="submit">Preparar mensagem</button>{sent && <p className="form-note" role="status">Mensagem preenchida. A integração de envio será ativada quando o canal oficial for informado.</p>}</form>
      </section>

      <footer><div className="footer-brand"><span className="brand-mark"><img src="/azon-social-logo.png" alt="" /></span><div><strong>Azon Social</strong><p>Ancestralidade, cuidado e transformação social.</p></div></div><div><strong>Navegue</strong><a href="#instituto">O Instituto</a><a href="#projetos">Projetos</a><a href="#noticias">Notícias</a><a href="#transparencia">Transparência</a></div><div><strong>Redes</strong><a href="https://www.instagram.com/azon.social/" target="_blank" rel="noreferrer">@azon.social ↗</a><a href="https://www.instagram.com/azonlegidan/" target="_blank" rel="noreferrer">@azonlegidan ↗</a></div><p className="copyright">© {new Date().getFullYear()} Instituto Azon Social</p></footer>
    </main>
  );
}
