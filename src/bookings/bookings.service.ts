import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { User } from '../entities/user.entity';
import { WorkingHour } from '../entities/working-hour.entity';
import { RestaurantOffer } from '../entities/restaurant-offer.entity';
import { RestaurantTable } from '../entities/restaurant-table.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsGateway } from './bookings.gateway';
import { WaitlistService } from '../waitlist/waitlist.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

const POINTS_PER_BOOKING = 100;
const SLOT_MINUTES = 30;

type AvailabilityResponse = {
  date: string;
  open: boolean;
  openTime?: string;
  closeTime?: string;
  reason?: string;
  slots: { time: string; available: boolean }[];
};

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WorkingHour) private hoursRepo: Repository<WorkingHour>,
    @InjectRepository(RestaurantOffer) private offerRepo: Repository<RestaurantOffer>,
    @InjectRepository(RestaurantTable) private tablesRepo: Repository<RestaurantTable>,
    private notificationsService: NotificationsService,
    private waitlistService: WaitlistService,
    private loyaltyService: LoyaltyService,
    private bookingsGateway: BookingsGateway,
  ) {}

  async create(dto: {
    restaurant_id: string; date: string; time: string;
    guests_count: number; comment?: string;
  }, user: User) {
    const guests = Number(dto.guests_count);
    if (!dto.restaurant_id || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dto.date) || !/^\\d{2}:\\d{2}$/.test(dto.time)) {
      throw new BadRequestException('არასწორი ჯავშნის მონაცემები');
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
      throw new BadRequestException('სტუმრების რაოდენობა უნდა იყოს 1-დან 12-მდე');
    }

    const availability = await this.getAvailability(dto.restaurant_id, dto.date, guests);
    const slot = availability.slots.find(s => s.time === dto.time);
    if (!slot?.available) {
      throw new BadRequestException('ეს დრო ამჟამად მიუწვდომელია');
    }

    const restaurant = await this.restaurantRepo.findOne({ where: { id: dto.restaurant_id, status: 'approved' } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const activeTables = await this.tablesRepo.find({
      where: { restaurantId: dto.restaurant_id, isActive: true },
      order: { capacity: 'ASC' },
      select: ['id', 'capacity'],
    });
    let assignedTableId: string | null = null;
    if (activeTables.length) {
      const sameSlot = await this.repo.find({
        where: { restaurantId: dto.restaurant_id, date: dto.date, time: dto.time, status: In(['pending', 'confirmed']) },
        select: ['id', 'tableId', 'guestsCount'],
      });
      const used = new Set(sameSlot.map(row => row.tableId).filter(Boolean) as string[]);
      const unassigned = sameSlot.filter(row => !row.tableId).length;
      const suitable = activeTables.filter(table => Number(table.capacity) >= guests && !used.has(table.id));
      if (suitable.length <= unassigned) {
        throw new BadRequestException('ამ დროისთვის საკმარისი მაგიდა აღარ არის');
      }
      assignedTableId = suitable[unassigned]?.id || null;
      if (!assignedTableId) throw new BadRequestException('ამ დროისთვის საკმარისი მაგიდა აღარ არის');
    } else {
      const conflicting = await this.repo.findOne({
        where: { restaurantId: dto.restaurant_id, date: dto.date, time: dto.time, status: In(['pending', 'confirmed']) },
        select: ['id'],
      });
      if (conflicting) throw new BadRequestException('ეს დრო უკვე დაჯავშნილია');
    }

    const activeOffers = await this.offerRepo.createQueryBuilder('offer')
      .where('offer.restaurantId = :restaurantId', { restaurantId: dto.restaurant_id })
      .andWhere('offer.isActive = :active', { active: true })
      .andWhere('(offer.startDate IS NULL OR offer.startDate <= :date)', { date: dto.date })
      .andWhere('(offer.endDate IS NULL OR offer.endDate >= :date)', { date: dto.date })
      .andWhere('(offer.startTime IS NULL OR offer.startTime <= :time)', { time: dto.time })
      .andWhere('(offer.endTime IS NULL OR offer.endTime >= :time)', { time: dto.time })
      .andWhere('(offer.minimumGuests IS NULL OR offer.minimumGuests <= :guests)', { guests })
      .andWhere('(offer.maximumGuests IS NULL OR offer.maximumGuests >= :guests)', { guests })
      .andWhere('offer.discountPercent IS NOT NULL')
      .orderBy('offer.discountPercent', 'DESC')
      .addOrderBy('offer.createdAt', 'ASC')
      .getMany();

    const selectedOffer = activeOffers[0] || null;
    const baseDiscount = Number(restaurant.discountPercent || 0);
    const offerDiscount = Number(selectedOffer?.discountPercent || 0);
    const appliedDiscount = Math.max(baseDiscount, offerDiscount);

    const booking = this.repo.create({
      restaurantId: dto.restaurant_id,
      date: dto.date,
      time: dto.time,
      guestsCount: guests,
      comment: dto.comment?.trim().slice(0, 200),
      userId: user.id,
      offerId: selectedOffer?.id || null,
      discountPercentApplied: appliedDiscount > 0 ? appliedDiscount : null,
      tableId: assignedTableId,
    });
    const saved = await this.repo.save(booking);

    if (restaurant.ownerId) {
      const full = await this.repo.findOne({ where: { id: saved.id }, relations: ['user', 'restaurant'] });
      this.bookingsGateway.emitNewBooking(restaurant.ownerId, full);
      await this.notificationsService.createForUser(
        restaurant.ownerId,
        'ახალი ჯავშანი',
        `${user.name} — ${dto.date} ${dto.time}, ${guests} სტუმარი`,
        'booking_new',
        { bookingId: saved.id },
      );

      const manager = await this.userRepo.findOne({ where: { id: restaurant.ownerId }, select: ['pushToken'] });
      if (manager?.pushToken) {
        await this.notificationsService.sendPushNotification(
          manager.pushToken,
          '🔔 ახალი ჯავშანი',
          `${user.name} — ${dto.date} ${dto.time}, ${guests} სტუმარი`,
          { bookingId: saved.id },
        );
      }
    }

    return saved;
  }

  async updateBooking(id: string, dto: { date?: string; time?: string; guests_count?: number; comment?: string }, user: User) {
    const booking = await this.repo.findOne({ where: { id }, relations: ['restaurant', 'user'] });
    if (!booking) throw new NotFoundException('Booking not found');

    const allowed = user.role === 'admin' || user.id === booking.userId || user.id === booking.restaurant?.ownerId;
    if (!allowed) throw new ForbiddenException();
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestException('Only pending or confirmed bookings can be changed');
    }

    const date = dto.date || booking.date;
    const time = dto.time || booking.time;
    const guests = dto.guests_count == null ? booking.guestsCount : Number(dto.guests_count);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      throw new BadRequestException('არასწორი ჯავშნის მონაცემები');
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
      throw new BadRequestException('სტუმრების რაოდენობა უნდა იყოს 1-დან 12-მდე');
    }

    const now = this.tbilisiNow();
    if (date < now.date || (date === now.date && this.toMinutes(time)! <= now.minutes)) {
      throw new BadRequestException('ჯავშნის დრო უკვე გასულია');
    }

    const activeTables = await this.tablesRepo.find({
      where: { restaurantId: booking.restaurantId, isActive: true },
      order: { capacity: 'ASC' },
      select: ['id', 'capacity'],
    });
    const sameSlot = await this.repo.find({
      where: { restaurantId: booking.restaurantId, date, time, status: In(['pending', 'confirmed']) },
      select: ['id', 'tableId', 'guestsCount'],
    });
    const others = sameSlot.filter(row => row.id !== id);
    let tableId: string | null = null;

    if (activeTables.length) {
      const assigned = new Set(others.map(row => row.tableId).filter(Boolean) as string[]);
      const unassigned = others.filter(row => !row.tableId).length;
      const suitable = activeTables.filter(table => Number(table.capacity) >= guests && !assigned.has(table.id));
      if (suitable.length <= unassigned) throw new BadRequestException('ამ დროისთვის საკმარისი მაგიდა აღარ არის');
      tableId = suitable[unassigned]?.id || null;
      if (!tableId) throw new BadRequestException('ამ დროისთვის საკმარისი მაგიდა აღარ არის');
    } else if (others.length) {
      throw new BadRequestException('ეს დრო უკვე დაჯავშნილია');
    }

    const activeOffers = await this.offerRepo.createQueryBuilder('offer')
      .where('offer.restaurantId = :restaurantId', { restaurantId: booking.restaurantId })
      .andWhere('offer.isActive = :active', { active: true })
      .andWhere('(offer.startDate IS NULL OR offer.startDate <= :date)', { date })
      .andWhere('(offer.endDate IS NULL OR offer.endDate >= :date)', { date })
      .andWhere('(offer.startTime IS NULL OR offer.startTime <= :time)', { time })
      .andWhere('(offer.endTime IS NULL OR offer.endTime >= :time)', { time })
      .andWhere('(offer.minimumGuests IS NULL OR offer.minimumGuests <= :guests)', { guests })
      .andWhere('(offer.maximumGuests IS NULL OR offer.maximumGuests >= :guests)', { guests })
      .andWhere('offer.discountPercent IS NOT NULL')
      .orderBy('offer.discountPercent', 'DESC')
      .addOrderBy('offer.createdAt', 'ASC')
      .getMany();

    const selectedOffer = activeOffers[0] || null;
    const baseDiscount = Number(booking.restaurant?.discountPercent || 0);
    const offerDiscount = Number(selectedOffer?.discountPercent || 0);

    booking.date = date;
    booking.time = time;
    booking.guestsCount = guests;
    if (dto.comment !== undefined) booking.comment = String(dto.comment || '').trim().slice(0, 200);
    booking.offerId = selectedOffer?.id || null;
    booking.discountPercentApplied = Math.max(baseDiscount, offerDiscount) || null;
    booking.tableId = tableId;
    const saved = await this.repo.save(booking);

    await this.notificationsService.createForUser(
      booking.userId,
      'ჯავშანი განახლდა',
      (booking.restaurant?.name || 'რესტორანი') + ' — ' + date + ' ' + time + ', ' + guests + ' სტუმარი',
      'booking_changed',
      { bookingId: booking.id },
    );
    if (booking.restaurant?.ownerId && booking.restaurant.ownerId !== booking.userId) {
      await this.notificationsService.createForUser(
        booking.restaurant.ownerId,
        'ჯავშანი შეიცვალა',
        user.name + ' — ' + date + ' ' + time + ', ' + guests + ' სტუმარი',
        'booking_changed',
        { bookingId: booking.id },
      );
    }
    return saved;
  }

  async getAvailability(restaurantId: string, date: string, guests = 2): Promise<AvailabilityResponse> {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId, status: 'approved' } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const parts = date.split('-').map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isInteger(n))) {
      throw new BadRequestException('Invalid date');
    }
    const [year, month, day] = parts;
    const dateCheck = new Date(Date.UTC(year, month - 1, day));
    if (
      dateCheck.getUTCFullYear() !== year ||
      dateCheck.getUTCMonth() !== month - 1 ||
      dateCheck.getUTCDate() !== day
    ) {
      throw new BadRequestException('Invalid date');
    }
    const dayOfWeek = dateCheck.getUTCDay();

    const hours = await this.hoursRepo.find({ where: { restaurantId, day: dayOfWeek }, order: { open: 'ASC' } });
    const openHours = hours.find(h => !h.isClosed && h.open && h.close);
    if (!openHours) {
      return { date, slots: [], open: false, reason: 'closed' };
    }

    const open = this.toMinutes(openHours.open);
    const close = this.toMinutes(openHours.close);
    if (open == null || close == null || close <= open) {
      return { date, slots: [], open: false, reason: 'invalid_hours' };
    }

    const bookingRows = await this.repo.find({
      where: { restaurantId, date },
      select: ['time', 'status', 'tableId', 'guestsCount'],
    });
    const activeTables = await this.tablesRepo.find({
      where: { restaurantId, isActive: true },
      select: ['id', 'capacity'],
    });

    const now = this.tbilisiNow();
    if (date < now.date) {
      return {
        date,
        open: true,
        openTime: openHours.open,
        closeTime: openHours.close,
        slots: [],
        reason: 'past',
      };
    }
    const isToday = now.date === date;
    const slots: { time: string; available: boolean }[] = [];

    const start = open;
    const end = close;
    for (let minutes = start; minutes <= end - SLOT_MINUTES; minutes += SLOT_MINUTES) {
      const time = this.formatMinutes(minutes);
      const past = isToday && minutes <= now.minutes;
      const sameSlotBookings = bookingRows.filter(b => (b.status === 'pending' || b.status === 'confirmed') && String(b.time).slice(0, 5) === time);
      const available = activeTables.length
        ? this.hasTableCapacity(activeTables, sameSlotBookings, guests)
        : sameSlotBookings.length === 0;
      slots.push({ time, available: !past && available });
    }

    return {
      date,
      open: true,
      openTime: openHours.open,
      closeTime: openHours.close,
      slots,
    };
  }

  private hasTableCapacity(
    tables: Pick<RestaurantTable, 'id' | 'capacity'>[],
    bookings: Pick<Booking, 'tableId' | 'guestsCount'>[],
    guests: number,
  ) {
    const suitable = tables.filter(table => Number(table.capacity) >= guests);
    if (!suitable.length) return false;
    const assigned = new Set(bookings.map(b => b.tableId).filter(Boolean) as string[]);
    const unassigned = bookings.filter(b => !b.tableId).length;
    const freeSuitable = suitable.filter(table => !assigned.has(table.id)).length;
    return freeSuitable > unassigned;
  }

  async availabilitySummary(date: string, guests = 2, limit = 24) {
    const normalizedGuests = Number(guests);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(normalizedGuests) || normalizedGuests < 1 || normalizedGuests > 12) {
      throw new BadRequestException('Invalid availability parameters');
    }
    const parts = date.split('-').map(Number);
    const [year, month, day] = parts;
    const dateCheck = new Date(Date.UTC(year, month - 1, day));
    if (dateCheck.getUTCFullYear() !== year || dateCheck.getUTCMonth() !== month - 1 || dateCheck.getUTCDate() !== day) {
      throw new BadRequestException('Invalid date');
    }

    const dayOfWeek = dateCheck.getUTCDay();
    const restaurants = await this.restaurantRepo.find({
      where: { status: 'approved' },
      relations: ['cuisine', 'photos', 'workingHours'],
      take: 120,
    });
    const bookingRows = await this.repo.find({
      where: { date },
      select: ['restaurantId', 'time', 'status', 'tableId', 'guestsCount'],
    });
    const tableRows = await this.tablesRepo.find({
      where: { restaurantId: In(restaurants.map(r => r.id)), isActive: true },
      select: ['id', 'restaurantId', 'capacity'],
    });
    const tablesByRestaurant = new Map<string, RestaurantTable[]>();
    for (const table of tableRows) {
      const list = tablesByRestaurant.get(table.restaurantId) || [];
      list.push(table);
      tablesByRestaurant.set(table.restaurantId, list);
    }
    const bookingsByRestaurantTime = new Map<string, Booking[]>();
    for (const row of bookingRows) {
      if (row.status !== 'pending' && row.status !== 'confirmed') continue;
      const key = row.restaurantId + ':' + String(row.time).slice(0, 5);
      const list = bookingsByRestaurantTime.get(key) || [];
      list.push(row);
      bookingsByRestaurantTime.set(key, list);
    }

    const now = this.tbilisiNow();
    const isToday = now.date === date;
    const rows = restaurants.map(restaurant => {
      const hours = (restaurant.workingHours || [])
        .filter(h => h.day === dayOfWeek && !h.isClosed && h.open && h.close)
        .sort((a, b) => String(a.open).localeCompare(String(b.open)));
      const tables = tablesByRestaurant.get(restaurant.id) || [];
      const availableTimes: string[] = [];
      for (const range of hours) {
        const open = this.toMinutes(range.open);
        const close = this.toMinutes(range.close);
        if (open == null || close == null || close <= open) continue;
        for (let minutes = open; minutes <= close - SLOT_MINUTES; minutes += SLOT_MINUTES) {
          const time = this.formatMinutes(minutes);
          if (isToday && minutes <= now.minutes) continue;
          const sameSlotBookings = bookingsByRestaurantTime.get(restaurant.id + ':' + time) || [];
          const slotAvailable = tables.length
            ? this.hasTableCapacity(tables, sameSlotBookings, normalizedGuests)
            : sameSlotBookings.length === 0;
          if (slotAvailable) {
            availableTimes.push(time);
            if (availableTimes.length >= 3) break;
          }
        }
        if (availableTimes.length >= 3) break;
      }
      if (!availableTimes.length) return null;
      return {
        ...this.mapCoverPhoto(restaurant),
        isOpen: this.calcIsOpen(restaurant.workingHours || []),
        availableTimes,
      };
    }).filter(Boolean).sort((a, b) => Number(b.ratingAvg || 0) - Number(a.ratingAvg || 0));

    return { date, guests: normalizedGuests, restaurants: rows.slice(0, Math.min(Math.max(Number(limit) || 24, 1), 50)) };
  }

  private calcIsOpen(hours: WorkingHour[]): boolean {
    if (!hours.length) return false;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tbilisi', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[map.weekday];
    const today = hours.find(h => h.day === day);
    if (!today || today.isClosed || !today.open || !today.close) return false;
    const hhmm = String(map.hour) + ':' + String(map.minute);
    return hhmm >= today.open && hhmm <= today.close;
  }

  private mapCoverPhoto = (r: Restaurant) => {
    const cover = r.photos?.find((p) => p.isCover) || r.photos?.[0];
    return { ...r, cover_photo: cover?.url || null };
  };

  async findMy(user: User) {
    return this.repo.find({
      where: { userId: user.id },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyRestaurantBookings(user: User) {
    const restaurants = await this.restaurantRepo.find({ where: { ownerId: user.id }, select: ['id'] });
    if (!restaurants.length) throw new NotFoundException('No restaurant linked to this account');
    const ids = restaurants.map(r => r.id);
    return this.repo.find({
      where: { restaurantId: In(ids) },
      relations: ['user', 'restaurant'],
      order: { date: 'DESC', time: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string, user: User) {
    const booking = await this.repo.findOne({
      where: { id },
      relations: ['restaurant', 'user'],
    });
    if (!booking) throw new NotFoundException();

    if (!['pending', 'confirmed', 'cancelled', 'rejected'].includes(status)) {
      throw new BadRequestException('Invalid booking status');
    }

    const isAdmin = user.role === 'admin';
    const isOwner = booking.restaurant?.ownerId === user.id;
    const isCustomer = booking.userId === user.id;

    if (!isAdmin && !isOwner && !isCustomer) {
      throw new ForbiddenException();
    }
    if ((status === 'confirmed' || status === 'rejected') && !isAdmin && !isOwner) {
      throw new ForbiddenException('Only the restaurant can confirm or reject a booking');
    }
    if (status === 'cancelled' && !isAdmin && !isOwner && !isCustomer) {
      throw new ForbiddenException();
    }
    if (!isAdmin) {
      const allowedTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'rejected', 'cancelled'],
        confirmed: ['cancelled'],
        cancelled: [],
        rejected: [],
      };
      if (!allowedTransitions[booking.status]?.includes(status)) {
        throw new BadRequestException('Invalid booking status transition');
      }
    }

    const previousStatus = booking.status;
    if (previousStatus === status) return booking;

    booking.status = status as any;
    if (status === 'cancelled' || status === 'rejected') booking.tableId = null;
    let saved: Booking;
    try {
      saved = await this.repo.save(booking);
    } catch (error: any) {
      // The table-slot unique index is the final concurrency guard against double assignment.
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new BadRequestException('ეს მაგიდა ამ დროისთვის უკვე დაკავებულია');
      }
      throw error;
    }

    if (status === 'confirmed' && previousStatus === 'pending') {
      await this.loyaltyService.awardUser(booking.userId, POINTS_PER_BOOKING, 'booking_confirmed', 'Confirmed booking bonus', 'booking:' + booking.id);
    }

    const customer = await this.userRepo.findOne({ where: { id: booking.userId }, select: ['pushToken'] });
    const restaurantName = booking.restaurant?.name || 'რესტორანი';
    const msgs: Record<string, { title: string; body: string }> = {
      confirmed: { title: '✅ ჯავშანი დადასტურდა', body: `${restaurantName} — ${booking.date} ${booking.time}` },
      rejected: { title: '❌ ჯავშანი უარყოფილია', body: `სამწუხაროდ ${restaurantName}-მა ვერ მიიღო ჯავშანი` },
      cancelled: { title: 'ℹ️ ჯავშანი გაუქმდა', body: `${restaurantName} — ${booking.date}` },
    };
    const msg = msgs[status];
    if (msg) {
      await this.notificationsService.createForUser(
        booking.userId,
        msg.title,
        msg.body,
        'booking_' + status,
        { bookingId: id },
      );
      if (customer?.pushToken) {
        await this.notificationsService.sendPushNotification(
          customer.pushToken,
          msg.title,
          msg.body,
          { bookingId: id },
        );
      }
    }

    if (status === 'cancelled') {
      await this.waitlistService.notifyForFreedSlot(booking.restaurantId, booking.date, booking.time);
    }

    this.bookingsGateway.emitBookingUpdated(booking.userId, saved);

    return saved;
  }

  private toMinutes(value?: string | null): number | null {
    if (!value || !/^\\d{2}:\\d{2}$/.test(value)) return null;
    const [hours, minutes] = value.split(':').map(Number);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  private formatMinutes(minutes: number) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  private tbilisiNow() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tbilisi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return {
      date: `${map.year}-${map.month}-${map.day}`,
      minutes: Number(map.hour) * 60 + Number(map.minute),
    };
  }
}
