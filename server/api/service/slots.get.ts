import { db } from '../../utils/db';
import { serviceSlots, serviceBlockedDates, serviceAppointments, dealers } from '../../database/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug } from '../../utils/tenant';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();
  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = (query.dealer as string) || resolveDealerSlug(event, fallbackSlug);
  const dateFrom = query.dateFrom as string;
  const dateTo = query.dateTo as string;

  // Get dealer
  const [dealer] = await db
    .select()
    .from(dealers)
    .where(eq(dealers.slug, dealerSlug));

  if (!dealer) {
    throw createError({ statusCode: 404, message: 'Dealer not found' });
  }

  // Default date range: next 30 days
  const startDate = dateFrom ? new Date(dateFrom) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = dateTo ? new Date(dateTo) : new Date();
  if (!dateTo) {
    endDate.setDate(endDate.getDate() + 30);
  }
  endDate.setHours(23, 59, 59, 999);

  // Get service slots configuration
  const slots = await db
    .select()
    .from(serviceSlots)
    .where(and(
      eq(serviceSlots.dealerId, dealer.id),
      eq(serviceSlots.isActive, true)
    ));

  // Get blocked dates
  const blockedDates = await db
    .select()
    .from(serviceBlockedDates)
    .where(and(
      eq(serviceBlockedDates.dealerId, dealer.id),
      gte(serviceBlockedDates.blockedDate, startDate),
      lte(serviceBlockedDates.blockedDate, endDate)
    ));

  const blockedDateStrings = new Set(
    blockedDates.map(d => d.blockedDate.toISOString().split('T')[0] || '')
  );

  // Get existing appointments count per day/time
  const appointmentCounts = await db
    .select({
      date: sql<string>`date_trunc('day', ${serviceAppointments.scheduledDate})::date`,
      time: serviceAppointments.scheduledTime,
      count: sql<number>`count(*)`,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, dealer.id),
      gte(serviceAppointments.scheduledDate, startDate),
      lte(serviceAppointments.scheduledDate, endDate),
      sql`${serviceAppointments.status} not in ('cancelled', 'no_show')`
    ))
    .groupBy(
      sql`date_trunc('day', ${serviceAppointments.scheduledDate})::date`,
      serviceAppointments.scheduledTime
    );

  // Build appointment count map
  const appointmentMap = new Map<string, number>();
  for (const apt of appointmentCounts) {
    const key = `${apt.date}|${apt.time}`;
    appointmentMap.set(key, Number(apt.count));
  }

  // Build slot configuration by day of week
  const slotsByDay = new Map<string, typeof slots>();
  for (const slot of slots) {
    if (!slotsByDay.has(slot.dayOfWeek)) {
      slotsByDay.set(slot.dayOfWeek, []);
    }
    slotsByDay.get(slot.dayOfWeek)!.push(slot);
  }

  // Default slots if none configured
  const defaultSlots = [
    { startTime: '07:30', endTime: '08:00' },
    { startTime: '08:00', endTime: '08:30' },
    { startTime: '08:30', endTime: '09:00' },
    { startTime: '09:00', endTime: '09:30' },
    { startTime: '09:30', endTime: '10:00' },
    { startTime: '10:00', endTime: '10:30' },
    { startTime: '10:30', endTime: '11:00' },
    { startTime: '11:00', endTime: '11:30' },
    { startTime: '11:30', endTime: '12:00' },
    { startTime: '13:00', endTime: '13:30' },
    { startTime: '13:30', endTime: '14:00' },
    { startTime: '14:00', endTime: '14:30' },
    { startTime: '14:30', endTime: '15:00' },
    { startTime: '15:00', endTime: '15:30' },
    { startTime: '15:30', endTime: '16:00' },
    { startTime: '16:00', endTime: '16:30' },
  ];

  const defaultMaxAppointments = 3;

  // Generate available dates
  const availableDates: Array<{
    date: string;
    dayOfWeek: string;
    isBlocked: boolean;
    slots: Array<{
      time: string;
      available: number;
      maxAppointments: number;
    }>;
  }> = [];

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0] || '';
    const dayOfWeek = dayNames[currentDate.getDay()] || '';
    if (!dateStr || !dayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Skip weekends if no slots configured
    if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const isBlocked = blockedDateStrings.has(dateStr);

    if (!isBlocked) {
      const daySlots = slotsByDay.get(dayOfWeek) || [];
      const useDefaultSlots = daySlots.length === 0;

      const availableSlots: Array<{
        time: string;
        available: number;
        maxAppointments: number;
      }> = [];

      if (useDefaultSlots) {
        for (const slot of defaultSlots) {
          const key = `${dateStr}|${slot.startTime}`;
          const booked = appointmentMap.get(key) || 0;
          const available = defaultMaxAppointments - booked;

          if (available > 0) {
            availableSlots.push({
              time: slot.startTime,
              available,
              maxAppointments: defaultMaxAppointments,
            });
          }
        }
      } else {
        for (const slot of daySlots) {
          const key = `${dateStr}|${slot.startTime}`;
          const booked = appointmentMap.get(key) || 0;
          const max = parseInt(slot.maxAppointments) || defaultMaxAppointments;
          const available = max - booked;

          if (available > 0) {
            availableSlots.push({
              time: slot.startTime,
              available,
              maxAppointments: max,
            });
          }
        }
      }

      availableDates.push({
        date: dateStr,
        dayOfWeek,
        isBlocked: false,
        slots: availableSlots,
      });
    } else {
      availableDates.push({
        date: dateStr,
        dayOfWeek,
        isBlocked: true,
        slots: [],
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    dealer: {
      name: dealer.name,
      phone: dealer.phone,
      email: dealer.email,
    },
    dateRange: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
    availableDates,
    blockedDates: Array.from(blockedDateStrings),
  };
});
