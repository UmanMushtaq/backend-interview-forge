import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuizHub } from './pages/QuizHub';
import { QuizSession } from './pages/QuizSession';
import { CodingList } from './pages/CodingList';
import { CodingChallenge } from './pages/CodingChallenge';
import { DesignList } from './pages/DesignList';
import { DesignChallenge } from './pages/DesignChallenge';
import { SqlList } from './pages/SqlList';
import { SqlChallenge } from './pages/SqlChallenge';
import { InterviewQA } from './pages/InterviewQA';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quiz" element={<QuizHub />} />
        <Route path="/quiz/:category" element={<QuizSession />} />
        <Route path="/code" element={<CodingList />} />
        <Route path="/code/:id" element={<CodingChallenge />} />
        <Route path="/design" element={<DesignList />} />
        <Route path="/design/:id" element={<DesignChallenge />} />
        <Route path="/sql" element={<SqlList />} />
        <Route path="/sql/:id" element={<SqlChallenge />} />
        <Route path="/interview" element={<InterviewQA />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}
