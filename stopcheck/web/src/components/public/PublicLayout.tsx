import type { ReactNode } from 'react'
import Lockups from './Lockups'
import PublicNav from './PublicNav'
import GovernanceStrip from './GovernanceStrip'
import PublicFooter from './PublicFooter'
import './design-system.css'

/**
 * Wrapper for all Stage 4 public-marketing surfaces.
 * Renders the SVG lockup defs once, then chrome + page content + governance strip + footer.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Lockups />
      <PublicNav />
      <main>{children}</main>
      <GovernanceStrip />
      <PublicFooter />
    </>
  )
}
