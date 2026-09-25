<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nova mensagem pelo site</title>
</head>
<body style="margin:0;background:#f4efe7;color:#2f2823;font-family:Arial,sans-serif;line-height:1.55">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px">
        <div style="background:#fff;border:1px solid #ded4c5;border-radius:12px;overflow:hidden">
            <div style="background:#4b2f24;color:#fff;padding:22px 28px">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#e6c88f">Instituto Azon Social</div>
                <h1 style="font-size:22px;margin:6px 0 0">Nova mensagem pelo site</h1>
            </div>
            <div style="padding:28px">
                <p style="margin:0 0 20px">Uma nova mensagem foi registrada no CRM.</p>
                <table role="presentation" style="width:100%;border-collapse:collapse">
                    <tr><th scope="row" style="text-align:left;vertical-align:top;padding:7px 14px 7px 0;width:92px">Nome</th><td style="padding:7px 0">{{ $contactMessage->name }}</td></tr>
                    <tr><th scope="row" style="text-align:left;vertical-align:top;padding:7px 14px 7px 0">E-mail</th><td style="padding:7px 0"><a href="mailto:{{ $contactMessage->email }}" style="color:#7b4c2f">{{ $contactMessage->email }}</a></td></tr>
                    <tr><th scope="row" style="text-align:left;vertical-align:top;padding:7px 14px 7px 0">Telefone</th><td style="padding:7px 0">{{ $contactMessage->phone ?: 'Não informado' }}</td></tr>
                    <tr><th scope="row" style="text-align:left;vertical-align:top;padding:7px 14px 7px 0">Assunto</th><td style="padding:7px 0">{{ $contactMessage->subject ?: 'Contato geral' }}</td></tr>
                </table>
                <div style="margin-top:22px;padding:18px;background:#f8f5ef;border-left:4px solid #bd8a45;white-space:pre-wrap">{{ $contactMessage->message }}</div>
                <p style="margin:22px 0 0;color:#6c625b;font-size:13px">Ao responder este e-mail, a resposta será direcionada para {{ $contactMessage->email }}.</p>
            </div>
        </div>
    </div>
</body>
</html>
