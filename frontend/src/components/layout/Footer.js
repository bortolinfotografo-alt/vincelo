'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-black text-lg mb-2 tracking-tight">
              Vin<span className="text-orange-500">celo</span>
            </h3>
            <p className="text-sm leading-relaxed">
              A rede social do mercado audiovisual no Brasil.
            </p>
          </div>
          <div className="text-center">
            <h4 className="text-white font-semibold mb-3 text-sm">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/freelancers" className="hover:text-white transition-colors">Encontrar Freelancers</Link></li>
              <li><Link href="/jobs" className="hover:text-white transition-colors">Vagas Disponíveis</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Criar Conta</Link></li>
            </ul>
          </div>
          <div className="text-center">
            <h4 className="text-white font-semibold mb-3 text-sm">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ajuda" className="hover:text-white transition-colors">Ajuda</Link></li>
              <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Vincelo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
