export type DataStatus = 'confirmada' | 'a_confirmar' | 'a_definir';
export type Modalidade = 'presencial' | 'online' | 'hibrido' | 'a_definir';

export interface Congresso {
  id: number;
  slug: string;
  nome: string;
  data_inicio: string | null;
  data_fim: string | null;
  data_status: DataStatus;
  data_observacao: string | null;
  modalidade: Modalidade;
  cidade: string | null;
  estado_uf: string | null;
  pais: string | null;
  local_formatado: string;
  tema_principal: string;
  temas: string[];
  fontes: string[];
  atualizado_em: string;
}

export type SortField = 'data' | 'nome' | 'local' | 'tema';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  busca: string;
  temas: string[];
  mesAno: string; // 'todos' | 'YYYY-MM' | 'a_definir'
  modalidade: 'todos' | Modalidade;
  regiao: string; // 'todos' | 'brasil' | 'exterior' | 'UF:SP'
  dataStatus: 'todos' | DataStatus;
}
