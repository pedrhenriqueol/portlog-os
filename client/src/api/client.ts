import axios from 'axios';

// Normalização resiliente da baseURL da API (compatível com localhost, Render, Vercel)
const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';
const cleanBase = rawBaseURL.replace(/\/+$/, '');
const baseURL = cleanBase.includes('/api/v1')
  ? cleanBase
  : cleanBase.includes('/api')
    ? `${cleanBase}/v1`
    : `${cleanBase}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para injetar token do sessionStorage
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('portlog_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor global para formatar mensagens de erro de forma amigável ao usuário
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'Erro inesperado de comunicação com o servidor.';
    
    if (error.response?.data) {
      const data = error.response.data;

      // 1. Se for erro de validação do Zod (format / array de erros)
      if (data.errors && typeof data.errors === 'object') {
        const errorList: string[] = [];
        
        Object.entries(data.errors).forEach(([field, val]: [string, any]) => {
          if (field === '_errors' && Array.isArray(val) && val.length > 0) {
            errorList.push(...val);
          } else if (val && typeof val === 'object' && Array.isArray(val._errors) && val._errors.length > 0) {
            const fieldName = translateField(field);
            errorList.push(`${fieldName}: ${val._errors.join(', ')}`);
          }
        });

        if (errorList.length > 0) {
          friendlyMessage = errorList.join(' • ');
        } else if (data.message) {
          friendlyMessage = data.message;
        }
      } 
      // 2. Se tiver mensagem direta
      else if (data.message && typeof data.message === 'string') {
        // Se a mensagem contiver JSON puro (ex: stringified zod error)
        if (data.message.startsWith('[') || data.message.startsWith('{')) {
          try {
            const parsed = JSON.parse(data.message);
            if (Array.isArray(parsed) && parsed.length > 0) {
              friendlyMessage = parsed.map((p: any) => `${translateField(p.path?.[0] || 'Campo')}: ${p.message}`).join(' • ');
            } else {
              friendlyMessage = 'Dados inválidos preenchidos no formulário.';
            }
          } catch {
            friendlyMessage = 'Por favor, revise os dados preenchidos no formulário.';
          }
        } else {
          friendlyMessage = data.message;
        }
      }
    } else if (error.message) {
      friendlyMessage = error.message;
    }

    return Promise.reject(new Error(friendlyMessage));
  }
);

function translateField(field: string): string {
  const map: Record<string, string> = {
    title: 'Título',
    description: 'Descrição técnica',
    assetId: 'Equipamento',
    priority: 'Nível de prioridade',
    type: 'Tipo de manutenção',
    slaHours: 'Prazo de SLA',
    code: 'Código patrimonial',
    name: 'Nome do equipamento',
    tenantSlug: 'Slug do terminal',
    tenantName: 'Nome do terminal',
    cnpj: 'CNPJ',
    adminName: 'Nome do administrador',
    email: 'E-mail',
    password: 'Senha'
  };
  return map[field] || field;
}
