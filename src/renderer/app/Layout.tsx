import { Outlet } from 'react-router-dom';
import { TitleBar } from '../shared/components/TitleBar';
import { SideNav } from '../shared/components/SideNav';
import { StatusBar } from '../shared/components/StatusBar';
import styles from './Layout.module.css';

export function Layout(): React.ReactElement {
  return (
    <div className={styles.layout}>
      <TitleBar />
      <div className={styles.body}>
        <SideNav />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
