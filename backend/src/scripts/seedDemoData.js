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

if (env.nodeEnv === 'production') {
  console.error('Refusing to seed while NODE_ENV=production');
  process.exit(1);
}

const DEMO_PASSWORD = 'Password123'; // demo accounts only

const categoryNames = ['Plumbing', 'Electrician', 'Home Cleaning', 'Tutoring', 'Tailoring', 'AC Repair'];

const providers = [
  { name: 'Ahmed Raza', email: 'ahmed@example.com', city: 'Karachi', years: 8, rating: 4.7, reviews: 23, cats: ['Plumbing'], bio: 'Leak repair and bathroom fittings.',
    services: [['Leak repair', 1500, 60], ['Bathroom fitting install', 3500, 120]] },
  { name: 'Sana Iqbal', email: 'sana@example.com', city: 'Lahore', years: 5, rating: 4.9, reviews: 41, cats: ['Tutoring'], bio: 'Matric and O-level maths and physics.',
    services: [['Maths tuition (1 hour)', 1200, 60], ['Physics tuition (1 hour)', 1200, 60]] },
  { name: 'Bilal Hussain', email: 'bilal@example.com', city: 'Karachi', years: 10, rating: 4.5, reviews: 17, cats: ['Electrician'], bio: 'Wiring, switchboards and fan installation.',
    services: [['Fan installation', 800, 45], ['Switchboard repair', 1800, 60], ['Full house wiring check', 4000, 120]] },
  { name: 'Hina Malik', email: 'hina@example.com', city: 'Islamabad', years: 4, rating: 4.8, reviews: 30, cats: ['Home Cleaning'], bio: 'Deep cleaning for flats and houses.',
    services: [['Deep clean, 2-bedroom flat', 6000, 180], ['Kitchen deep clean', 2500, 90]] },
  { name: 'Tariq Mehmood', email: 'tariq@example.com', city: 'Lahore', years: 12, rating: 4.3, reviews: 12, cats: ['AC Repair'], bio: 'Split and window AC service and gas refill.',
    services: [['AC service and cleaning', 2500, 60], ['AC gas refill', 4500, 90]] },
  { name: 'Ayesha Khan', email: 'ayesha@example.com', city: 'Karachi', years: 7, rating: 4.6, reviews: 19, cats: ['Tailoring'], bio: 'Stitching and alterations for women wear.',
    services: [['Suit stitching', 3000, 60], ['Alterations', 700, 30]] },
];

async function seed() {
  await connectDB();

  await Promise.all([User, Provider, Category, Service, Availability, Booking, Review].map((m) => m.deleteMany({})));
  await Promise.all([User, Provider, Category, Service, Availability, Booking, Review].map((m) => m.syncIndexes()));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const categories = await Category.create(categoryNames.map((name) => ({ name })));
  const catId = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  await User.create([
    { name: 'Platform Admin', email: 'admin@example.com', passwordHash, role: 'admin', city: 'Karachi' },
    { name: 'Demo Customer', email: 'customer@example.com', passwordHash, role: 'customer', city: 'Karachi' },
  ]);

  const created = [];
  for (const p of providers) {
    const user = await User.create({ name: p.name, email: p.email, passwordHash, role: 'provider', city: p.city });
    const provider = await Provider.create({
      user: user._id, bio: p.bio, city: p.city, experienceYears: p.years, categories: p.cats.map((c) => catId[c]),
      approvalStatus: 'approved', avgRating: p.rating, reviewCount: p.reviews,
    });
    await Service.create(p.services.map(([title, price, durationMinutes]) => ({
      provider: provider._id, category: catId[p.cats[0]], title, price, durationMinutes,
    })));
    // Mon to Sat, 10:00 to 18:00 (used for slots in Week 3)
    await Availability.create({
      provider: provider._id, slotMinutes: 60,
      weekly: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, startTime: '10:00', endTime: '18:00' })),
    });
    created.push({ name: p.name, id: provider._id.toString() });
  }

  // One provider waiting for approval, to test the "pending providers are hidden" rule
  const pendingUser = await User.create({ name: 'Pending Provider', email: 'pending@example.com', passwordHash, role: 'provider', city: 'Karachi' });
  await Provider.create({ user: pendingUser._id, city: 'Karachi', categories: [catId.Plumbing], approvalStatus: 'pending' });

  console.log('\nSeed complete.');
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
  console.log('Approved provider ids (use one in the add-service form or in Postman):');
  created.forEach((c) => console.log(`  ${c.name}: ${c.id}`));
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
