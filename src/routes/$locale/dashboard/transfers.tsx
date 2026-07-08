import { DashboardPlaceholder } from '#/components/dashboard/DashboardPlaceholder'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/dashboard/transfers')({
  component:  () => (
		<DashboardPlaceholder titleKey="dashboard.nav.transfers" />
	),
})
