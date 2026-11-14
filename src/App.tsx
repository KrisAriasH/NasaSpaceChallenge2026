import { Layout } from './components/Layout';
import { StoreProvider, useStore } from './store';
import { CrewOverview } from './screens/CrewOverview';
import { Alerts } from './screens/Alerts';
import { MemberDetail } from './screens/MemberDetail';
import { FollowUps } from './screens/FollowUps';
import { EnvironmentPage } from './screens/EnvironmentPage';
import { CheckInPage } from './screens/CheckInPage';
import { TestsPage } from './screens/TestsPage';
import { TodayPage } from './screens/TodayPage';
import { PatternsPage } from './screens/PatternsPage';
import { ReportsPage } from './screens/ReportsPage';
import { PrivacyPage } from './screens/PrivacyPage';
import { JournalPage } from './screens/JournalPage';
import { Validation } from './screens/Validation';

function Screen() {
  const { page, subjectId } = useStore();
  switch (page) {
    case 'today':
      return <TodayPage />;
    case 'overview':
      return <CrewOverview />;
    case 'alerts':
      return <Alerts />;
    case 'member':
      return <MemberDetail memberId={subjectId} />;
    case 'followups':
      return <FollowUps />;
    case 'environment':
      return <EnvironmentPage />;
    case 'checkin':
      return <CheckInPage />;
    case 'tests':
      return <TestsPage />;
    case 'patterns':
      return <PatternsPage />;
    case 'reports':
      return <ReportsPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'journal':
      return <JournalPage />;
    case 'validation':
      return <Validation />;
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Layout>
        <Screen />
      </Layout>
    </StoreProvider>
  );
}
