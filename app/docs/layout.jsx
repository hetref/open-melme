import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
export default function Layout({ children }) {
  const { nav, ...base } = baseOptions();

  return (
    <DocsLayout  {...base}
      nav={{ ...nav, mode: 'navbar' }}
      tree={source.getPageTree()}>
      {children}
    </DocsLayout>
  );
}