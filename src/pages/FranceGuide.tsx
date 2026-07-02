import type { ReactNode } from 'react';
import { Flag } from 'lucide-react';

interface Section {
  title: string;
  content: ReactNode;
}

const SECTIONS: Section[] = [
  {
    title: 'The changement de statut',
    content: (
      <>
        <p>
          If you are on a student visa or a job-search residence permit (recherche d'emploi ou création
          d'entreprise) when you sign your contract, you do not need to leave France or start over. You go
          through what is called a <strong>changement de statut</strong>, a process that converts your
          current permit into a work permit tied to your new employer. For most tech roles, the process is
          simpler than people expect.
        </p>
        <p>
          The good news for engineers specifically: for most tech roles above a certain salary threshold,
          your employer does not need to run a labour market test proving no French or EU candidate could
          fill the role. That test, called the <strong>opposabilité du marché du travail</strong>, is
          usually waived for shortage occupations, and backend engineering consistently qualifies. The
          paperwork is handled through the local prefecture or, in many cases, through{' '}
          <strong>OFII</strong> (Office Français de l'Immigration et de l'Intégration), which coordinates
          the medical visit and permit issuance once your employer files the work authorization request.
        </p>
        <p>
          In practice the whole process takes <strong>two to six weeks</strong> depending on the
          prefecture's backlog. Many candidates are allowed to start working immediately once the
          récépissé (temporary receipt) is issued, well before the final titre de séjour card arrives. Ask
          your future employer's HR or immigration counsel to confirm this for your specific prefecture,
          since processing times vary noticeably between Paris and other regions.
        </p>
      </>
    ),
  },
  {
    title: 'How French tech companies hire',
    content: (
      <>
        <p>
          French CVs are still, by convention, kept to <strong>one page</strong>. Recruiters read fast and
          expect density: your stack, your impact, and your most relevant project, without padding. A
          two-page CV is not disqualifying at English-first startups, but a tight one-pager reads as more
          senior, not less.
        </p>
        <p>
          The <strong>lettre de motivation</strong> (cover letter) is taken more seriously in France than
          in the UK or US, even at modern tech companies. It does not need to be long, but a generic,
          unedited letter is noticed and counts against you. A few sentences that show you understand what
          the company actually builds go a long way.
        </p>
        <p>
          Interviews tend to run more formal in tone than what you might be used to from UK or US startups.
          There is less small talk up front and more direct structure: expect the interviewer to state the
          plan for the session before diving in. This is not coldness, it is simply a different default
          register.
        </p>
        <p>
          Salary is discussed <strong>early</strong>, often on the very first recruiter call, rather than
          being held back until an offer stage. Companies like <strong>Qonto</strong>,{' '}
          <strong>Alan</strong>, and <strong>Swan</strong> run their entire hiring process in English and
          hire many non-French engineers, but showing that you have picked up even basic French phrases is
          noticed positively and signals you intend to stay.
        </p>
      </>
    ),
  },
  {
    title: 'Salary ranges in Paris for senior backend engineers',
    content: (
      <>
        <p>
          Ranges vary by company stage and funding, but for backend engineering in Paris fintech and
          well-funded startups, a reasonable band looks like this: <strong>55-70k EUR</strong> for
          mid-level engineers with three to five years of experience, <strong>65-85k EUR</strong> for
          senior engineers with five to eight years, and <strong>80-100k EUR or more</strong> for lead or
          staff-level roles. Base salary is usually the majority of total compensation; cash bonuses exist
          but are smaller and less standard than in the UK or US.
        </p>
        <p>
          Equity in French startups is most commonly granted as <strong>BSPCE</strong> (bons de
          souscription de parts de créateur d'entreprise), the French equivalent of stock options.{' '}
          <strong>BSPCEs</strong> give you the right to buy shares at a fixed price set when they are
          granted, and they are taxed favorably compared to regular income if you hold them long enough
          before exercising and selling.
        </p>
      </>
    ),
  },
  {
    title: 'Questions French interviewers ask that UK and US interviewers do not',
    content: (
      <>
        <p>
          A few questions come up in French interviews far more often than in Anglo-American ones, and
          being unprepared for them stands out. <strong>"Why France?"</strong> is close to universal:
          interviewers want a real answer, not a diplomatic one, whether it is about the quality of life,
          a partner, or the specific tech scene.
        </p>
        <p>
          You may also be asked about your <strong>projet du coeur</strong>, literally your "project of the
          heart," meaning the side project or personal initiative you care about beyond your day job. This
          is not a trick question, it is a genuine attempt to see what motivates you outside of assigned
          work.
        </p>
        <p>
          "How do you see your career in five years?" is asked more pointedly than the usual pleasantry
          version, often as a real check on whether the role fits your trajectory. And "What do you know
          about our company?" is treated as a research test: vague or generic answers are penalized more
          heavily than you might expect, since French interviewers generally assume you did your homework
          before showing up.
        </p>
      </>
    ),
  },
  {
    title: 'Navigating the permit question in interviews',
    content: (
      <>
        <p>
          Work permit questions come up early, often on the first recruiter call, and hesitating or sounding
          unsure about your status raises more concern than the actual permit situation does. The fix is to
          address it clearly, briefly, and with confidence, then move on.
        </p>
        <p>A script that works well: </p>
        <blockquote className="border-l-2 border-primary/40 pl-4 italic text-text/90">
          "I am currently on a job-search residence permit. Once a contract is signed, the changement de
          statut process is straightforward and does not require a labour market test for tech roles. I can
          typically start within 2-4 weeks of signing."
        </blockquote>
        <p>
          Saying this once, clearly, early in the process removes it as a source of ongoing uncertainty for
          the recruiter and lets the conversation move back to your actual qualifications.
        </p>
      </>
    ),
  },
  {
    title: 'LinkedIn in France',
    content: (
      <>
        <p>
          French recruiters and hiring managers use LinkedIn heavily, more so than some other European
          markets, and it is a genuinely active channel rather than a formality. Cold InMail messages tend
          to get a lower response rate than a short, personalized connection request that references
          something specific about the person's work or the company's recent news.
        </p>
        <p>
          Posting content in <strong>French</strong> gets noticeably more reach and engagement from the
          local network than the same content in English, even among English-first companies, simply
          because the algorithm and audience skew local. If you are comfortable writing even simple French,
          it is worth doing occasionally.
        </p>
        <p>
          French tech Twitter (and its successors) is smaller than the US equivalent but tight-knit:
          engineers, founders, and recruiters overlap heavily, and a small number of well-regarded voices
          drive a large share of hiring-adjacent conversation.
        </p>
      </>
    ),
  },
];

export function FranceGuide() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Flag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">French Tech Job Market Guide</h1>
      </div>

      <div className="relative space-y-6 pl-8">
        <div className="absolute bottom-2 left-3 top-2 w-px bg-border" aria-hidden="true" />

        {SECTIONS.map((section, i) => (
          <div key={section.title} className="relative">
            <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-4 ring-bg">
              {i + 1}
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-3 font-semibold">{section.title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-text/90">{section.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
