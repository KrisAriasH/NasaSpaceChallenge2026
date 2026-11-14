import { Layout } from './components/Layout';
import { StoreProvider, useStore } from './store';
import { CrewOverview } from './screens/CrewOverview';
import { Alerts } from './screens/Alerts';
import { MemberDetail } from './screens/MemberDetail';
import { FollowUps } from './screens/FollowUps';
import { EnvironmentPage } from './screens/EnvironmentPage';
import { CheckInPage } from './screens/CheckInPage';
import { MyStatus } from './screens/MyStatus';
import { PrivacyPage } from './screens/PrivacyPage';
import { JournalPage } from './screens/JournalPage';

function Screen() {
  const { page, subjectId } = useStore();
  switch (page) {
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
    case 'mystatus':
      return <MyStatus />;
    case 'privacy':
      return <PrivacyPage />;
    case 'journal':
      return <JournalPage />;
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
