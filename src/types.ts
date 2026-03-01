
export enum Subject {
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  BIOLOGY = 'Biology',
  MATHEMATICS = 'Mathematics'
}

export interface DoubtResult {
  explanation: string;
  stepByStep: string[];
  tips: string[];
  tricks: string[];
  examples: {
    problem: string;
    solution: string;
  }[];
  diagramPrompt: string;
}

export interface HistoryItem {
  id: string;
  question: string;
  subject: Subject;
  result: DoubtResult;
  imageUrl?: string;
  timestamp: number;
}
