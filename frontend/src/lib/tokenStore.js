// ============================================================
// TOKEN STORE
// Armazena o access token em memória (não no localStorage).
//
// Vantagem: token em memória não é acessível via XSS.
// O refresh token fica em httpOnly cookie (gerenciado pelo servidor).
//
// O módulo usa uma variável de módulo — persiste enquanto a página
// estiver aberta. Ao recarregar, o auth-context chama /auth/refresh
// para obter um novo access token via cookie.
// ============================================================

let _accessToken = null;

export function setToken(token) {
  _accessToken = token;
}

export function getToken() {
  return _accessToken;
}

export function clearToken() {
  _accessToken = null;
}
