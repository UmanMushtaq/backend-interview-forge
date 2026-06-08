import type { InterviewQuestion } from '../../types';
import { interviewQuestions } from './questions';

export const allInterviewQuestions: InterviewQuestion[] = interviewQuestions;

export const interviewCategories: string[] = Array.from(
  new Set(interviewQuestions.map((q) => q.category)),
);
