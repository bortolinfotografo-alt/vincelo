// Pagina de Politica de Privacidade
export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-surface-900 mb-2">Politica de Privacidade</h1>
      <p className="text-surface-500 mb-10">Ultima atualizacao: abril de 2025</p>

      <div className="space-y-8 text-surface-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">1. Informacoes que Coletamos</h2>
          <p>Coletamos informacoes fornecidas diretamente por voce ao criar uma conta, como nome, e-mail, localizacao e fotos de portfolio. Tambem coletamos dados de uso anonimos para melhorar a plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">2. Como Usamos suas Informacoes</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Exibir seu perfil e portfolio para outros usuarios</li>
            <li>Conectar freelancers a empresas</li>
            <li>Enviar notificacoes sobre a plataforma</li>
            <li>Melhorar nossos servicos com base em dados anonimizados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">3. Compartilhamento de Dados</h2>
          <p>Nao vendemos seus dados pessoais. Podemos compartilhar informacoes com provedores de servico essenciais ao funcionamento da plataforma (ex.: hospedagem, pagamentos), sempre sujeitos a acordos de confidencialidade.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">4. Cookies e Rastreamento</h2>
          <p>Utilizamos cookies necessarios para autenticacao e preferencias de usuario. Nao utilizamos cookies de rastreamento publicitario de terceiros.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">5. Seus Direitos (LGPD)</h2>
          <p>Em conformidade com a Lei Geral de Protecao de Dados (Lei 13.709/2018), voce tem direito a acessar, corrigir, portabilizar ou solicitar a exclusao de seus dados pessoais a qualquer momento.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">6. Seguranca</h2>
          <p>Utilizamos criptografia e boas praticas de seguranca para proteger seus dados. Nenhum sistema e 100% seguro, mas fazemos o possivel para manter suas informacoes protegidas.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">7. Retencao de Dados</h2>
          <p>Mantemos seus dados enquanto sua conta estiver ativa. Apos o cancelamento, os dados sao removidos em ate 30 dias, exceto onde exigido por lei.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">8. Contato</h2>
          <p>Para exercer seus direitos ou tirar duvidas sobre privacidade: <a href="mailto:vincelofreelancers@gmail.com" className="text-primary-600 hover:underline">vincelofreelancers@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
