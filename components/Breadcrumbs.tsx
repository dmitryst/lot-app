// app/components/Breadcrumbs.tsx
import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

type Crumb = {
  label: string;
  href: string;
};

type BreadcrumbsProps = {
  crumbs: Crumb[];
};

const Breadcrumbs = ({ crumbs }: BreadcrumbsProps) => (
  <nav aria-label="breadcrumb" className={styles.container}>
    <ol className={styles.list}>
      {crumbs.map((crumb, index) => (
        <li key={index} className={styles.item}>
          {index < crumbs.length - 1 ? (
            <Link href={crumb.href} className={styles.link}>{crumb.label}</Link>
          ) : (
            <span aria-current="page" className={styles.active}>{crumb.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export default Breadcrumbs;
