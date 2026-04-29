import type { User, Student, InventoryItem, Movement, Schedule, Suggestion, Project, Quiz, QuizResult, WorkProposal, Report, MaterialUsage } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Administrador SESI', email: 'admin@sesi.br', role: 'admin', unit: 'FabLab SP', active: true },
  { id: 'u2', name: 'Prof. Maria Silva', email: 'maria@sesi.br', role: 'professor', unit: 'FabLab SP', active: true },
  { id: 'u3', name: 'João Funcionario', email: 'joao@sesi.br', role: 'funcionario', unit: 'FabLab SP', active: true },
  { id: 'u4', name: 'Aluno Pedro Santos', email: 'pedro@sesi.br', role: 'student', unit: 'SESI Ipiranga', active: true },
  { id: 'u5', name: 'Aluna Ana Costa', email: 'ana@sesi.br', role: 'student', unit: 'SESI Ipiranga', active: true },
];

export const mockStudents: Student[] = [
  {
    id: 's1', name: 'Pedro Santos', birth_date: '2010-05-15', grade: '8º Ano A', school: 'SESI Ipiranga',
    status: 'monitoramento', responsible_name: 'Maria Santos', responsible_contact: '(11) 98765-4321',
    primary_areas: ['Lógico-Matemática', 'Criatividade', 'Espacial'],
    notes: 'Excelente desempenho em matemática e raciocínio lógico. Demonstrou interesse em programação e robótica.',
    identified_at: '2024-03-10', identified_by: 'Prof. Maria Silva',
    gifted_grades: [
      { id: 'g1', subject: 'Matemática', grade: 9.5, period: '1º Bim 2025', date: '2025-04-15' },
      { id: 'g2', subject: 'Matemática', grade: 9.8, period: '2º Bim 2025', date: '2025-06-20' },
      { id: 'g3', subject: 'Física', grade: 8.7, period: '1º Bim 2025', date: '2025-04-18' },
      { id: 'g4', subject: 'Física', grade: 9.2, period: '2º Bim 2025', date: '2025-06-22' },
      { id: 'g5', subject: 'Português', grade: 8.0, period: '1º Bim 2025', date: '2025-04-12' },
      { id: 'g6', subject: 'Português', grade: 8.5, period: '2º Bim 2025', date: '2025-06-18' },
      { id: 'g7', subject: 'Inglês', grade: 9.0, period: '1º Bim 2025', date: '2025-04-10' },
      { id: 'g8', subject: 'Inglês', grade: 9.3, period: '2º Bim 2025', date: '2025-06-15' },
    ],
    gifted_skills: [
      { area: 'Lógico-Matemática', score: 95, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
      { area: 'Linguística', score: 78, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
      { area: 'Espacial', score: 88, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
      { area: 'Musical', score: 65, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
      { area: 'Naturalista', score: 72, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
      { area: 'Interpessoal', score: 80, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
      { area: 'Intrapessoal', score: 85, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
      { area: 'Criatividade', score: 92, assessed_by: 'Prof. Maria Silva', date: '2025-03-15' },
    ],
    gifted_developments: [
      { id: 'd1', date: '2025-04-01', title: 'Excelente desempenho em simulado de matemática', description: 'Pedro obteve a maior nota da turma no simulado preparatório para OBMEP.', category: 'academico', author: 'Prof. Maria Silva' },
      { id: 'd2', date: '2025-03-20', title: 'Demonstração de liderança em projeto de grupo', description: 'Coordenou equipe na construção de modelo de ponte com palitos.', category: 'social', author: 'Prof. Carlos' },
      { id: 'd3', date: '2025-03-10', title: 'Iniciativa em projeto de programação', description: 'Começou projeto pessoal de app em Python para resolver equações.', category: 'criativo', author: 'Prof. Maria Silva' },
      { id: 'd4', date: '2025-02-28', title: 'Reconhecimento por empatia', description: 'Auxiliou colegas com dificuldades em matemática durante horário de almoço.', category: 'social', author: 'Coord. Pedagógico' },
    ],
    gifted_achievements: [
      { id: 'a1', title: 'OBMEP 2024 - Medalha de Prata', description: 'Obteve medalha de prata na Olimpíada Brasileira de Matemática das Escolas Públicas.', date: '2024-11-15', type: 'olimpiada' },
      { id: 'a2', title: 'Robótica SESI - 2º Lugar Regional', description: 'Equipe de robótica obteve 2º lugar na competição regional com projeto de braço robótico.', date: '2024-09-20', type: 'projeto' },
      { id: 'a3', title: 'Menção Honrosa - Feira de Ciências', description: 'Projeto sobre energia solar recebeu menção honrosa na feira de ciências estadual.', date: '2024-08-10', type: 'reconhecimento' },
    ],
  },
  {
    id: 's2', name: 'Ana Costa', birth_date: '2011-08-22', grade: '7º Ano B', school: 'SESI Ipiranga',
    status: 'identificado', responsible_name: 'Carlos Costa', responsible_contact: '(11) 97654-3210',
    primary_areas: ['Linguística', 'Musical', 'Interpessoal'],
    notes: 'Destaque em redação e música. Participa do coral escolar e escreve poesias.',
    identified_at: '2025-01-20', identified_by: 'Prof. Carlos',
    gifted_grades: [
      { id: 'g9', subject: 'Português', grade: 9.7, period: '1º Bim 2025', date: '2025-04-12' },
      { id: 'g10', subject: 'Inglês', grade: 9.5, period: '1º Bim 2025', date: '2025-04-10' },
      { id: 'g11', subject: 'Matemática', grade: 7.8, period: '1º Bim 2025', date: '2025-04-15' },
    ],
    gifted_skills: [
      { area: 'Lógico-Matemática', score: 70, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
      { area: 'Linguística', score: 95, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
      { area: 'Espacial', score: 60, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
      { area: 'Musical', score: 92, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
      { area: 'Naturalista', score: 68, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
      { area: 'Interpessoal', score: 90, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
      { area: 'Intrapessoal', score: 82, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
      { area: 'Criatividade', score: 88, assessed_by: 'Prof. Carlos', date: '2025-02-10' },
    ],
    gifted_developments: [
      { id: 'd5', date: '2025-03-25', title: 'Excelente redação sobre meio ambiente', description: 'Texto foi selecionado para representar a escola em concurso estadual.', category: 'academico', author: 'Prof. Carlos' },
      { id: 'd6', date: '2025-03-15', title: 'Composição musical original', description: 'Compôs música original para apresentação do coral escolar.', category: 'criativo', author: 'Prof. Beatriz' },
    ],
    gifted_achievements: [
      { id: 'a4', title: 'Concurso de Redação - 1º Lugar', description: 'Primeiro lugar no concurso municipal de redação com tema "O futuro que queremos".', date: '2024-10-05', type: 'reconhecimento' },
    ],
  },
  {
    id: 's3', name: 'Lucas Oliveira', birth_date: '2009-12-03', grade: '9º Ano A', school: 'SESI Santo Amaro',
    status: 'em_avaliacao', responsible_name: 'Fernanda Oliveira', responsible_contact: '(11) 96543-2109',
    primary_areas: ['Lógico-Matemática', 'Naturalista'],
    notes: 'Forte interesse em biologia e ciências. Questionador e curioso.',
    identified_at: '2025-02-15', identified_by: 'Prof. Ana Paula',
    gifted_grades: [
      { id: 'g12', subject: 'Ciências', grade: 9.3, period: '1º Bim 2025', date: '2025-04-20' },
      { id: 'g13', subject: 'Matemática', grade: 8.5, period: '1º Bim 2025', date: '2025-04-15' },
    ],
    gifted_skills: [
      { area: 'Lógico-Matemática', score: 88, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
      { area: 'Linguística', score: 72, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
      { area: 'Espacial', score: 75, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
      { area: 'Musical', score: 55, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
      { area: 'Naturalista', score: 96, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
      { area: 'Interpessoal', score: 70, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
      { area: 'Intrapessoal', score: 78, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
      { area: 'Criatividade', score: 82, assessed_by: 'Prof. Ana Paula', date: '2025-03-01' },
    ],
    gifted_developments: [
      { id: 'd7', date: '2025-04-05', title: 'Experimento de biologia molecular', description: 'Realizou experimento avançado de extração de DNA com supervisão mínima.', category: 'academico', author: 'Prof. Ana Paula' },
    ],
    gifted_achievements: [],
  },
];

export const mockInventory: InventoryItem[] = [
  { id: 'i1', name: 'Impressora 3D Prusa MK4', category: 'Equipamento', quantity: 3, total: 4, status: 'in', description: 'Laboratório B, Mesa 1', last_action: '2025-04-20', last_action_by: 'Prof. Maria Silva' },
  { id: 'i2', name: 'Arduino Uno R3', category: 'Eletrônico', quantity: 15, total: 20, status: 'in', description: 'Gaveta eletrônicos', last_action: '2025-04-18', last_action_by: 'Prof. Carlos' },
  { id: 'i3', name: 'Filamento PLA 1kg - Vermelho', category: 'Consumível', quantity: 2, total: 10, status: 'in', description: 'Prateleira C2', last_action: '2025-04-15', last_action_by: 'João Funcionario' },
  { id: 'i4', name: 'Filamento PLA 1kg - Azul', category: 'Consumível', quantity: 0, total: 8, status: 'out', description: 'Prateleira C2', last_action: '2025-04-10', last_action_by: 'Prof. Maria Silva' },
  { id: 'i5', name: 'Ferro de solda 60W', category: 'Ferramenta', quantity: 5, total: 6, status: 'in', description: 'Bancada de eletrônica', last_action: '2025-04-12', last_action_by: 'João Funcionario' },
  { id: 'i6', name: 'Raspberry Pi 4 8GB', category: 'Eletrônico', quantity: 4, total: 5, status: 'in', description: 'Gaveta eletrônicos', last_action: '2025-04-08', last_action_by: 'Prof. Carlos' },
  { id: 'i7', name: 'Sensor ultrassônico HC-SR04', category: 'Eletrônico', quantity: 12, total: 15, status: 'in', description: 'Kit sensores', last_action: '2025-04-05', last_action_by: 'João Funcionario' },
  { id: 'i8', name: 'Protoboard 830 pontos', category: 'Material', quantity: 8, total: 10, status: 'in', description: 'Gaveta eletrônicos', last_action: '2025-04-01', last_action_by: 'Prof. Maria Silva' },
  { id: 'i9', name: 'Cortadora laser K40', category: 'Equipamento', quantity: 1, total: 2, status: 'in', description: 'Laboratório B, Área laser', last_action: '2025-03-28', last_action_by: 'João Funcionario' },
  { id: 'i10', name: 'Jumpers macho-macho', category: 'Consumível', quantity: 0, total: 20, status: 'out', description: 'Kit fios', last_action: '2025-03-25', last_action_by: 'Prof. Carlos' },
];

export const mockMovements: Movement[] = [
  { id: 'm1', item_id: 'i3', item_name: 'Filamento PLA 1kg - Vermelho', action: 'saida', quantity: 2, responsible: 'Prof. Maria Silva', notes: 'Aula de impressão 3D - Turma EM1', moved_at: '2025-04-15T10:30:00' },
  { id: 'm2', item_id: 'i4', item_name: 'Filamento PLA 1kg - Azul', action: 'saida', quantity: 3, responsible: 'Prof. Carlos', notes: 'Projeto de turma', moved_at: '2025-04-10T14:00:00' },
  { id: 'm3', item_id: 'i1', item_name: 'Impressora 3D Prusa MK4', action: 'saida', quantity: 1, responsible: 'João Funcionario', notes: 'Manutenção preventiva', moved_at: '2025-04-20T09:00:00' },
  { id: 'm4', item_id: 'i2', item_name: 'Arduino Uno R3', action: 'saida', quantity: 3, responsible: 'Prof. Carlos', notes: 'Oficina de Arduino', moved_at: '2025-04-18T08:00:00' },
  { id: 'm5', item_id: 'i3', item_name: 'Filamento PLA 1kg - Vermelho', action: 'entrada', quantity: 5, responsible: 'João Funcionario', notes: 'Compra nova', moved_at: '2025-04-12T11:00:00' },
];

export const mockSchedules: Schedule[] = [
  { id: 'sc1', title: 'Aula de Impressão 3D', date: '2025-04-25', start_time: '09:00', end_time: '11:00', responsible: 'Prof. Maria Silva', class_name: 'Turma A - EM1', notes: 'Introdução ao Tinkercad', status: 'confirmado', schedule_materials: [{ id: 'sm1', item_name: 'Filamento PLA', quantity_used: 2, registered_by: 'Prof. Maria Silva' }] },
  { id: 'sc2', title: 'Oficina Arduino Básico', date: '2025-04-26', start_time: '14:00', end_time: '16:00', responsible: 'Prof. Carlos', class_name: 'Turma B - EM2', notes: 'Pisca LED e sensores', status: 'pendente', schedule_materials: [] },
  { id: 'sc3', title: 'Projeto Braço Robótico', date: '2025-04-22', start_time: '10:00', end_time: '12:00', responsible: 'Prof. Maria Silva', class_name: 'Turma C - EM3', notes: 'Montagem do braço', status: 'concluido', schedule_materials: [{ id: 'sm2', item_name: 'Arduino Uno', quantity_used: 4, registered_by: 'Prof. Maria Silva' }] },
  { id: 'sc4', title: 'Corte Laser - Protótipos', date: '2025-04-28', start_time: '08:00', end_time: '10:00', responsible: 'Prof. Carlos', class_name: 'Turma A - EM2', notes: 'Cortar peças do projeto', status: 'pendente', schedule_materials: [] },
  { id: 'sc5', title: 'Manutenção Equipamentos', date: '2025-04-23', start_time: '07:00', end_time: '09:00', responsible: 'João Funcionario', class_name: 'Manutenção', notes: 'Revisão mensal', status: 'remarcado', schedule_materials: [] },
];

export const mockSuggestions: Suggestion[] = [
  { id: 'sg1', title: 'Introdução ao Tinkercad para 6º Ano', description: 'Plano de aula para introduzir modelagem 3D usando Tinkercad. Inclui exercícios de criação de chaveiros personalizados.', tags: ['3D', 'Tinkercad', 'Design'], author: 'Prof. Maria Silva', votes: 8, status: 'approved' },
  { id: 'sg2', title: 'Robótica com Arduino - Seguidor de linha', description: 'Montagem de carrinho seguidor de linha usando Arduino, motores DC e sensor IR. Projeto de 4 aulas.', tags: ['Arduino', 'Robótica', 'Eletrônica'], author: 'Prof. Carlos', votes: 12, status: 'open' },
  { id: 'sg3', title: 'Impressão 3D de moléculas', description: 'Usar impressão 3D para criar modelos de moléculas orgânicas, integrando química e tecnologia.', tags: ['3D', 'Química', 'STEM'], author: 'Prof. Ana Paula', votes: 5, status: 'open' },
];

export const mockProjects: Project[] = [
  { id: 'p1', title: 'Suporte para Notebook', description: 'Suporte articulado feito em MDF cortado a laser, com ajuste de ângulo.', type: 'Fusion 360', link: '', author: 'Prof. Maria Silva', class_name: 'Turma A - EM1', tags: ['3D', 'Corte Laser', 'Design'] },
  { id: 'p2', title: 'Estação Meteorológica IoT', description: 'Estação que mede temperatura, umidade e pressão, enviando dados para dashboard web.', type: 'Arduino', link: '', author: 'Prof. Carlos', class_name: 'Turma B - EM2', tags: ['IoT', 'Sensores', 'Web'] },
  { id: 'p3', title: 'Jogo Educativo de Matemática', description: 'Jogo em Scratch para ensinar frações de forma interativa.', type: 'Scratch', link: '', author: 'Prof. Maria Silva', class_name: 'Turma C - EM3', tags: ['Programação', 'Educação'] },
  { id: 'p4', title: 'Luminária Paramétrica', description: 'Luminária com design paramétrico, feita em madeira compensada.', type: 'Tinkercad', link: '', author: 'Prof. Carlos', class_name: 'Turma A - EM2', tags: ['3D', 'Design', 'Iluminação'] },
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'q1', title: 'Avaliação de Matemática - Nível Avançado', description: 'Teste de raciocínio lógico e matemática avançada para alunos do programa.', subject: 'Matemática', time_limit: 30, status: 'published',
    questions: [
      { id: 'qu1', text: 'Qual é o próximo número na sequência: 2, 6, 12, 20, 30, ?', options: [{ id: 'o1', text: '38', correct: false }, { id: 'o2', text: '40', correct: false }, { id: 'o3', text: '42', correct: true }, { id: 'o4', text: '44', correct: false }], points: 10, multiple_correct: false },
      { id: 'qu2', text: 'Um triângulo tem ângulos de 30° e 60°. Qual é a medida do terceiro ângulo?', options: [{ id: 'o5', text: '80°', correct: false }, { id: 'o6', text: '90°', correct: true }, { id: 'o7', text: '100°', correct: false }, { id: 'o8', text: '70°', correct: false }], points: 10, multiple_correct: false },
      { id: 'qu3', text: 'Se x² - 5x + 6 = 0, quais são os valores de x?', options: [{ id: 'o9', text: '2 e 3', correct: true }, { id: 'o10', text: '1 e 6', correct: false }, { id: 'o11', text: '-2 e -3', correct: false }, { id: 'o12', text: '0 e 5', correct: false }], points: 10, multiple_correct: false },
    ],
    assigned_students: ['s1', 's2', 's3'], created_by: 'Prof. Maria Silva', created_at: '2025-04-01',
  },
  {
    id: 'q2', title: 'Quiz de Ciências - Biologia Molecular', description: 'Avaliação de conhecimentos sobre DNA, RNA e proteínas.', subject: 'Ciências', time_limit: 20, status: 'published',
    questions: [
      { id: 'qu4', text: 'Qual é a função principal do DNA?', options: [{ id: 'o13', text: 'Produzir energia', correct: false }, { id: 'o14', text: 'Armazenar informação genética', correct: true }, { id: 'o15', text: 'Transportar oxigênio', correct: false }, { id: 'o16', text: 'Combater vírus', correct: false }], points: 10, multiple_correct: false },
      { id: 'qu5', text: 'O que significa a sigla RNA?', options: [{ id: 'o17', text: 'Ácido Ribonucléico', correct: true }, { id: 'o18', text: 'Ácido Desoxirribonucléico', correct: false }, { id: 'o19', text: 'Proteína de Replicação', correct: false }, { id: 'o20', text: 'Enzima Catalítica', correct: false }], points: 10, multiple_correct: false },
    ],
    assigned_students: ['s3'], created_by: 'Prof. Ana Paula', created_at: '2025-04-10',
  },
];

export const mockQuizResults: QuizResult[] = [
  { id: 'qr1', quiz_id: 'q1', student_id: 's1', score: 30, max_score: 30, answers: [{ question_id: 'qu1', selected: ['o3'], correct: true }, { question_id: 'qu2', selected: ['o6'], correct: true }, { question_id: 'qu3', selected: ['o9'], correct: true }], completed_at: '2025-04-15T10:00:00', time_taken: 18 },
];

export const mockProposals: WorkProposal[] = [
  { id: 'wp1', student_id: 's1', title: 'App de Resolução de Equações', description: 'Desenvolver um aplicativo em Python que resolve equações do 1º e 2º grau, mostrando passo a passo.', objectives: 'Criar ferramenta educacional para auxiliar colegas em matemática.', methodology: 'Desenvolvimento em Python com interface Tkinter.', expected_results: 'App funcional com resolução passo a passo.', timeline: '3 meses', status: 'approved', feedback: 'Excelente proposta! Pode iniciar.', created_at: '2025-03-01', updated_at: '2025-03-05' },
];

export const mockReports: Report[] = [
  { id: 'r1', type: 'daily', period_start: '2025-04-22', period_end: '2025-04-22', total_schedules: 3, total_completed: 1, total_pending: 1, total_cancelled: 0, generated_by: 'Admin', generated_at: '2025-04-22T18:00:00', summary: { stats: { total: 3, completed: 1, pending: 1, cancelled: 0 }, top_materials: [{ item_name: 'Filamento PLA', total: 2 }], schedules: [{ title: 'Projeto Braço Robótico', start_time: '10:00', responsible: 'Prof. Maria Silva', status: 'concluido' }] } },
];

export const mockMaterialUsage: MaterialUsage[] = [
  { item_name: 'Filamento PLA', category: 'Consumível', total_used: 12, times_used: 5, last_used: '2025-04-20' },
  { item_name: 'Arduino Uno R3', category: 'Eletrônico', total_used: 8, times_used: 4, last_used: '2025-04-18' },
  { item_name: 'Protoboard', category: 'Material', total_used: 6, times_used: 3, last_used: '2025-04-15' },
  { item_name: 'Jumpers', category: 'Consumível', total_used: 20, times_used: 6, last_used: '2025-04-10' },
];

export const SKILL_AREAS = ['Lógico-Matemática', 'Linguística', 'Espacial', 'Musical', 'Naturalista', 'Interpessoal', 'Intrapessoal', 'Criatividade'];

export const INV_CATS = ['Equipamento', 'Material', 'Eletrônico', 'Ferramenta', 'Consumível', 'Outro'];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  funcionario: 'Funcionário',
  student: 'Aluno',
};
