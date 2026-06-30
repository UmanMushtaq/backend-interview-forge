import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CourseOverview } from './pages/CourseOverview';
import { ChapterPage } from './pages/ChapterPage';
import { LearnList } from './pages/LearnList';
import { ModulePage } from './pages/ModulePage';
import { QuizHub } from './pages/QuizHub';
import { QuizSession } from './pages/QuizSession';
import { CodingList } from './pages/CodingList';
import { CodingChallenge } from './pages/CodingChallenge';
import { DesignList } from './pages/DesignList';
import { DesignChallenge } from './pages/DesignChallenge';
import { SqlList } from './pages/SqlList';
import { SqlChallenge } from './pages/SqlChallenge';
import { InterviewQA } from './pages/InterviewQA';
import { InterviewSimulator } from './pages/InterviewSimulator';
import { Companies } from './pages/Companies';
import { CompanyDetail } from './pages/CompanyDetail';
import { CVAssistant } from './pages/CVAssistant';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Bookmarks } from './pages/Bookmarks';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses/:courseId" element={<CourseOverview />} />
        <Route path="/courses/:courseId/:chapterId" element={<ChapterPage />} />
        <Route path="/learn" element={<LearnList />} />
        <Route path="/learn/:moduleId" element={<ModulePage />} />
        <Route path="/quiz" element={<QuizHub />} />
        <Route path="/quiz/:category" element={<QuizSession />} />
        <Route path="/code" element={<CodingList />} />
        <Route path="/code/:id" element={<CodingChallenge />} />
        <Route path="/design" element={<DesignList />} />
        <Route path="/design/:id" element={<DesignChallenge />} />
        <Route path="/sql" element={<SqlList />} />
        <Route path="/sql/:id" element={<SqlChallenge />} />
        <Route path="/interview" element={<InterviewQA />} />
        <Route path="/interview-simulator" element={<InterviewSimulator />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:companyId" element={<CompanyDetail />} />
        <Route path="/cv-assistant" element={<CVAssistant />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}
