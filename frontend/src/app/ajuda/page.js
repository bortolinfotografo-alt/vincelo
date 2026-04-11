// Pagina de Ajuda
export default function AjudaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-surface-900 mb-2">Central de Ajuda</h1>
      <p className="text-surface-500 mb-10">Encontre respostas para as duvidas mais frequentes sobre a plataforma.</p>

      <div className="space-y-6">
        {[
          {
            q: 'Como me cadastro na plataforma?',
            a: 'Clique em "Criar conta" e escolha se voce e freelancer ou empresa. Preencha seus dados e pronto — acesso imediato.',
          },
          {
            q: 'Como funciona a contratacao de freelancers?',
            a: 'Empresas publicam vagas ou entram em contato direto pelo perfil do profissional. Freelancers tambem podem se candidatar a vagas abertas.',
          },
          {
            q: 'Como atualizo meu perfil e portfolio?',
            a: 'Acesse "Editar Perfil" no menu superior. Voce pode adicionar fotos, descricao, especialidades e links de portfolio.',
          },
          {
            q: 'Como funciona o chat?',
            a: 'Apos encontrar um profissional ou empresa de interesse, acesse o perfil e inicie uma conversa pelo botao de mensagem.',
          },
          {
            q: 'Como cancelo minha conta?',
            a: 'Entre em contato pelo e-mail suporte@vincelo.com.br com o assunto "Cancelamento de conta" e processaremos em ate 5 dias uteis.',
          },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-surface-200 p-6 dark:bg-gray-900 dark:border-gray-800">
            <h3 className="font-semibold text-surface-900 mb-2">{item.q}</h3>
            <p className="text-surface-600 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-primary-50 border border-primary-200 rounded-xl p-6 text-center">
        <p className="text-surface-700 font-medium mb-1">Nao encontrou o que precisava?</p>
        <p className="text-surface-500 text-sm">
          Fale conosco pelo e-mail{' '}
          <a href="mailto:suporte@vincelo.com.br" className="text-primary-600 font-medium hover:underline">
            suporte@vincelo.com.br
          </a>
        </p>
      </div>
    </div>
  );
}
