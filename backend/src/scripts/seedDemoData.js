// Fills the database with demo data. Run with: npm run seed
// WARNING: it deletes everything in these collections first.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import Availability from '../models/Availability.js';
import Booking from '../models/Booking.js';
import Category from '../models/Category.js';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { recalculateRating } from '../services/ratingService.js';
import { addDays, fromMinutes, karachiNow, toMinutes } from '../utils/time.js';

if (env.nodeEnv === 'production') {
  console.error('Refusing to seed while NODE_ENV=production');
  process.exit(1);
}

const DEMO_PASSWORD = 'Password123'; // demo accounts only

const categoryNames = ['Plumbing', 'Electrician', 'Home Cleaning', 'Tutoring', 'Tailoring', 'AC Repair'];

const providers = [
  {
    name: 'Ahmed Raza', ratings: [5, 5, 4, 5, 4], slotMinutes: 60, email: 'ahmed@example.com', city: 'Karachi', years: 8, cats: ['Plumbing'], bio: 'Leak repair and bathroom fittings.',
    services: [['Leak repair', 1500, 60], ['Bathroom fitting install', 3500, 120]]
  },
  {
    name: 'Sana Iqbal', ratings: [5, 5, 5, 4], slotMinutes: 60, email: 'sana@example.com', city: 'Lahore', years: 5, cats: ['Tutoring'], bio: 'Matric and O-level maths and physics.',
    services: [['Maths tuition (1 hour)', 1200, 60], ['Physics tuition (1 hour)', 1200, 60]]
  },
  {
    name: 'Bilal Hussain', ratings: [4, 5, 4, 4], slotMinutes: 60, email: 'bilal@example.com', city: 'Karachi', years: 10, cats: ['Electrician'], bio: 'Wiring, switchboards and fan installation.',
    services: [['Fan installation', 800, 45], ['Switchboard repair', 1800, 60], ['Full house wiring check', 4000, 120]]
  },
  {
    name: 'Hina Malik', ratings: [5, 4, 5], slotMinutes: 90, email: 'hina@example.com', city: 'Islamabad', years: 4, cats: ['Home Cleaning'], bio: 'Deep cleaning for flats and houses.',
    services: [['Deep clean, 2-bedroom flat', 6000, 180], ['Kitchen deep clean', 2500, 90]]
  },
  {
    name: 'Tariq Mehmood', ratings: [4, 4, 5], slotMinutes: 60, email: 'tariq@example.com', city: 'Lahore', years: 12, cats: ['AC Repair'], bio: 'Split and window AC service and gas refill.',
    services: [['AC service and cleaning', 2500, 60], ['AC gas refill', 4500, 90]]
  },
  {
    name: 'Ayesha Khan', ratings: [5, 4, 5, 4], slotMinutes: 30, email: 'ayesha@example.com', city: 'Karachi', years: 7, cats: ['Tailoring'], bio: 'Stitching and alterations for women wear.',
    services: [['Suit stitching', 3000, 60], ['Alterations', 700, 30]]
  },
];

async function seed() {
  await connectDB();

  await Promise.all([User, Provider, Category, Service, Availability, Booking, Review].map((m) => m.deleteMany({})));
  await Promise.all([User, Provider, Category, Service, Availability, Booking, Review].map((m) => m.syncIndexes()));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const categories = await Category.create(categoryNames.map((name) => ({ name })));
  const catId = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const [, demoCustomer, ...reviewers] = await User.create([
    { name: 'Platform Admin', email: 'admin@example.com', passwordHash, role: 'admin', city: 'Karachi' },
    { name: 'Demo Customer', email: 'customer@example.com', passwordHash, role: 'customer', city: 'Karachi' },
    { name: 'Omar Farooq', email: 'omar@example.com', passwordHash, role: 'customer', city: 'Karachi' },
    { name: 'Zainab Ali', email: 'zainab@example.com', passwordHash, role: 'customer', city: 'Lahore' },
    { name: 'Hamza Sheikh', email: 'hamza@example.com', passwordHash, role: 'customer', city: 'Islamabad' },
  ]);
  const comments = ['Arrived on time and did a tidy job.', 'Good work and fair price.', 'Polite and professional.', 'Would book again.'];

  const created = [];
  for (const p of providers) {
    const user = await User.create({ name: p.name, email: p.email, passwordHash, role: 'provider', city: p.city });
    const provider = await Provider.create({
      user: user._id, bio: p.bio, city: p.city, experienceYears: p.years, categories: p.cats.map((c) => catId[c]),
      approvalStatus: 'approved',
      paymentAccounts: { easypaisa: '0300-1234567', jazzcash: '0301-7654321', bank: '' },
    });
    const services = await Service.create(p.services.map(([title, price, durationMinutes]) => ({
      provider: provider._id, category: catId[p.cats[0]], title, price, durationMinutes,
    })));
    // Mon to Sat, 10:00 to 18:00
    await Availability.create({
      provider: provider._id, slotMinutes: p.slotMinutes,
      weekly: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, startTime: '10:00', endTime: '18:00' })),
    });

    // Real history: completed bookings in the past, each with a review. Ratings are then computed, never typed in.
    const today = karachiNow().date;
    for (let i = 0; i < p.ratings.length; i += 1) {
      const startMin = toMinutes('10:00') + i * p.slotMinutes;
      const booking = await Booking.create({
        customer: reviewers[i % reviewers.length]._id, provider: provider._id, service: services[0]._id,
        date: addDays(today, -(3 + i * 2)), startTime: fromMinutes(startMin), endTime: fromMinutes(startMin + p.slotMinutes),
        status: 'completed', priceAtBooking: services[0].price, address: 'Demo address',
      });
      await Review.create({ booking: booking._id, customer: booking.customer, provider: provider._id, rating: p.ratings[i], comment: comments[i % comments.length] });
    }
    await recalculateRating(provider._id);
    created.push({ name: p.name, id: provider._id.toString(), provider, service: services[0] });
  }

  // Two upcoming bookings for the demo customer (one pending, one confirmed)
  const today = karachiNow().date;
  for (const [i, status] of ['pending', 'confirmed'].entries()) {
    const c = created[i];
    await Booking.create({
      customer: demoCustomer._id, provider: c.provider._id, service: c.service._id, date: addDays(today, 3 + i),
      startTime: '15:00', endTime: fromMinutes(toMinutes('15:00') + providers[i].slotMinutes), status, priceAtBooking: c.service.price, address: 'House 12, Street 4',
    });
  }

  // One provider waiting for approval, to test the "pending providers are hidden" rule
  const pendingUser = await User.create({ name: 'Pending Provider', email: 'pending@example.com', passwordHash, role: 'provider', city: 'Karachi' });
  await Provider.create({ user: pendingUser._id, city: 'Karachi', categories: [catId.Plumbing], approvalStatus: 'pending' });

  console.log('\nSeed complete.');
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
  console.log('Accounts: admin@example.com, customer@example.com, ahmed@example.com (provider), pending@example.com (unapproved provider)');
  console.log('Approved provider ids (handy for Postman):');
  created.forEach((c) => console.log(`  ${c.name}: ${c.id}`));
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
