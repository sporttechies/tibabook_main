import BookingPage from '@/components/booking-page'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BookingPage hospitalSlug={slug} />
}
