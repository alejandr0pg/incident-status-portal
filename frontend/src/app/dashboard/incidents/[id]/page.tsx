import IncidentDetailClient from './IncidentDetailClient'

export function generateStaticParams() {
  return [{ id: '_' }]
}

export const dynamicParams = false

export default function IncidentDetailPage() {
  return <IncidentDetailClient />
}
