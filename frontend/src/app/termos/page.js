// Pagina de Termos de Uso
export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-surface-900 mb-2">Termos de Uso</h1>
      <p className="text-surface-500 mb-10">Ultima atualizacao: abril de 2025</p>

      <div className="prose prose-surface max-w-none space-y-8 text-surface-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">1. Aceitacao dos Termos</h2>
          <p>Ao acessar ou utilizar a plataforma Vincelo, voce concorda com estes Termos de Uso. Se nao concordar com qualquer parte, nao utilize a plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">2. Descricao do Servico</h2>
          <p>A Vincelo e um marketplace que conecta profissionais de fotografia e audiovisual a empresas e clientes que buscam esses servicos no Brasil.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">3. Cadastro e Conta</h2>
          <p>Para utilizar os recursos completos da plataforma, e necessario criar uma conta com informacoes verdadeiras e precisas. Voce e responsavel pela seguranca de suas credenciais de acesso.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">4. Conteudo do Usuario</h2>
          <p>Ao publicar conteudo na plataforma, voce garante possuir os direitos sobre ele e concede a Vincelo licenca nao exclusiva para exibi-lo dentro da plataforma. Conteudo ofensivo, ilegal ou que viole direitos de terceiros sera removido.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">5. Contratacoes e Pagamentos</h2>
          <p>As negociacoes entre freelancers e empresas sao de responsabilidade das proprias partes. A Vincelo nao se responsabiliza por acordos realizados fora da plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">6. Suspensao e Cancelamento</h2>
          <p>A Vincelo reserva-se o direito de suspender ou encerrar contas que violem estes termos, sem aviso previo, a seu exclusivo criterio.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">7. Alteracoes nos Termos</h2>
          <p>Podemos atualizar estes termos periodicamente. Notificaremos usuarios sobre mudancas significativas. O uso continuado da plataforma apos as alteracoes implica aceitacao dos novos termos.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-2">8. Contato</h2>
          <p>Duvidas sobre estes termos: <a href="mailto:juridico@vincelo.com.br" className="text-primary-600 hover:underline">juridico@vincelo.com.br</a></p>
        </section>
      </div>
    </div>
  );
}
