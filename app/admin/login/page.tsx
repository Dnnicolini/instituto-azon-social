"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  function enterDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = "/admin";
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-brand">
        <a className="brand admin-brand" href="/">
          <span className="brand-mark"><img src="/azon-social-logo.png" alt="" /></span>
          <span><strong>Azon Social</strong><small>Instituto</small></span>
        </a>
        <div>
          <p className="eyebrow light">Área administrativa</p>
          <h1>O site do Instituto nas suas mãos.</h1>
          <p>Publique ações, atualize informações e acompanhe todo o conteúdo em um só lugar.</p>
        </div>
        <small>Ambiente exclusivo para pessoas autorizadas.</small>
      </section>
      <section className="admin-login-form-wrap">
        <form className="admin-login-form" onSubmit={enterDemo}>
          <div><p className="eyebrow">Acesso seguro</p><h2>Entrar no painel</h2><p>Use seu e-mail e senha de administrador.</p></div>
          <label>E-mail<input required type="email" defaultValue="instituto.azonsocial@gmail.com" /></label>
          <label>Senha<div className="password-field"><input required type={showPassword ? "text" : "password"} defaultValue="demonstracao" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Ocultar" : "Mostrar"}</button></div></label>
          <div className="login-options"><label><input type="checkbox" /> Lembrar meu acesso</label><button type="button">Esqueci minha senha</button></div>
          <button className="admin-primary-button" type="submit">Entrar no painel</button>
          <p className="demo-note">Demonstração: clique em “Entrar no painel” para visualizar.</p>
          <a className="back-site" href="/">← Voltar ao site</a>
        </form>
      </section>
    </main>
  );
}
