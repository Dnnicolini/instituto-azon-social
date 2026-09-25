Nova mensagem pelo site do Instituto Azon Social

Nome: {{ $contactMessage->name }}
E-mail: {{ $contactMessage->email }}
Telefone: {{ $contactMessage->phone ?: 'Não informado' }}
Assunto: {{ $contactMessage->subject ?: 'Contato geral' }}

Mensagem:
{{ $contactMessage->message }}

Ao responder este e-mail, a resposta será direcionada para {{ $contactMessage->email }}.
