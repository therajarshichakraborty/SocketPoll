export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  timerSeconds: number;
  createdAt: number;
  endsAt: number;
  isActive: boolean;
  totalVotes: number;
}

export interface Student {
  socketId: string;
  name: string;
  roomId: string;
  hasVoted: boolean;
  votedOptionId: string | null;
  joinedAt: number;
}

export interface Vote {
  studentSocketId: string;
  pollId: string;
  optionId: string;
  timestamp: number;
}

export interface PollState {
  poll: Poll;
  students: Map<string, Student>;
  votes: Map<string, Vote>;
  timerId: ReturnType<typeof setTimeout> | null;
}

export interface CreatePollPayload {
  question: string;
  options: string[];
  timerSeconds: number;
}

export interface JoinPayload {
  name: string;
  roomId: string;
}

export interface SubmitVotePayload {
  roomId: string;
  optionId: string;
}

export interface NewQuestionPayload {
  poll: Poll;
  endsAt: number;
}

export interface PollUpdatePayload {
  poll: Poll;
}

export interface PollResultsPayload {
  poll: Poll;
  finalResults: PollOption[];
}

export interface StudentJoinedPayload {
  student: Omit<Student, 'socketId'>;
  totalStudents: number;
}

export interface StudentLeftPayload {
  name: string;
  totalStudents: number;
}

export interface ErrorPayload {
  message: string;
}