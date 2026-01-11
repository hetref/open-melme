import { MailboxProvider } from './_context/MailboxContext'
import { GlobalComposeDialog } from './_components/GlobalComposeDialog'

export default function MyMailboxLayout({ children }) {
  return (
    <MailboxProvider>
      {children}
      <GlobalComposeDialog />
    </MailboxProvider>
  )
}
