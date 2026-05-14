export interface CreatePollDTO {
  title: string;
  description?: string;
  isAnonymous?: boolean;
  requireAuth?: boolean;
  expiresAt?: string;
  questions: CreateQuestionDTO[];
}

export interface CreateQuestionDTO {
  question: string;
  isRequired?: boolean;
  order: number;
  options: CreateOptionDTO[];
}

export interface CreateOptionDTO {
  text: string;
  order: number;
}

export interface UpdatePollDTO {
  title?: string;
  description?: string;
  isAnonymous?: boolean;
  requireAuth?: boolean;
  expiresAt?: string;
}

export interface PollQueryDTO {
  page?: number;
  limit?: number;
  published?: boolean;
  closed?: boolean;
}
