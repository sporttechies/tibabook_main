'use client'

import { BookingWidget } from './patient-home'

export default function PatientBooking({ hospitalSlug }: { hospitalSlug: string }) {
  return <BookingWidget initialSlug={hospitalSlug} />
}
