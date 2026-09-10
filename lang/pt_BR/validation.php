<?php

return [
    'required' => 'O campo :attribute é obrigatório.',
    'required_if' => 'O campo :attribute é obrigatório.',
    'required_with' => 'O campo :attribute é obrigatório.',
    'email' => 'Informe um e-mail válido.',
    'string' => 'O campo :attribute deve ser um texto.',
    'array' => 'O campo :attribute deve ser uma lista válida.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'date' => 'Informe uma data válida em :attribute.',
    'after' => 'O campo :attribute deve ser posterior a :date.',
    'confirmed' => 'A confirmação de :attribute não confere.',
    'unique' => 'Este valor de :attribute já está em uso.',
    'exists' => 'A seleção em :attribute é inválida.',
    'url' => 'Informe uma URL válida em :attribute.',
    'max' => ['string' => 'O campo :attribute não pode ter mais de :max caracteres.', 'file' => 'O arquivo :attribute não pode ter mais de :max KB.', 'array' => 'O campo :attribute não pode ter mais de :max itens.'],
    'min' => ['string' => 'O campo :attribute deve ter ao menos :min caracteres.', 'numeric' => 'O campo :attribute deve ser no mínimo :min.', 'array' => 'Selecione ao menos :min item.'],
    'mimes' => 'O arquivo :attribute deve ser de um tipo permitido: :values.',
    'mimetypes' => 'O conteúdo do arquivo :attribute não é permitido.',
    'dimensions' => 'As dimensões da imagem :attribute não são válidas.',
    'attributes' => [
        'name' => 'nome', 'email' => 'e-mail', 'password' => 'senha', 'title' => 'título', 'slug' => 'endereço amigável',
        'body' => 'conteúdo', 'status' => 'status', 'published_at' => 'data de publicação', 'starts_at' => 'início',
        'ends_at' => 'término', 'cover' => 'capa', 'file' => 'arquivo', 'message' => 'mensagem', 'roles' => 'grupos',
        'permissions' => 'permissões',
    ],
];
