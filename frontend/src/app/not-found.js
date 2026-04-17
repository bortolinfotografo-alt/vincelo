import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary-500 mb-2">404</p>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-3">
          Página não encontrada
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mb-8 max-w-sm mx-auto">
          A página que você procura não existe ou foi removida.
        </p>
        <Link
          href="/feed"
          className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Voltar ao feed
        </Link>
      </div>
    </div>
  );
}
