'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Brand } from './brand'
import PatientBooking from './patient-booking'

export default function BookingPage({ hospitalSlug }: { hospitalSlug: string }) {
  return <main className="booking-route"><header className="site-header"><div className="header-inner"><Brand /><Link className="hospital-link" href="/">Back to TibaBook <ArrowLeft size={15} /></Link></div></header><div className="booking-route-content"><span className="eyebrow">Secure appointment booking</span><h1>Book your visit</h1><p>Choose a time and share your contact details with the clinic.</p><PatientBooking hospitalSlug={hospitalSlug} /></div></main>
}
