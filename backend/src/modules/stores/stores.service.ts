import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

export interface StoreWithDistance extends Store {
  distanceKm?: number;
  matchType?: 'COORDINATE_DISTANCE' | 'CITY_MATCH' | 'STATE_MATCH' | 'REGIONAL';
}

@Injectable()
export class StoresService implements OnModuleInit {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultStoresIfEmpty();
  }

  async findAll(onlyActive: boolean = true) {
    const where = onlyActive ? { isActive: true } : {};
    return this.storeRepo.find({
      where,
      order: { city: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new NotFoundException(`Store with ID '${id}' not found`);
    return store;
  }

  async create(dto: CreateStoreDto) {
    const store = this.storeRepo.create(dto);
    return this.storeRepo.save(store);
  }

  async update(id: string, dto: UpdateStoreDto) {
    const store = await this.findOne(id);
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  async remove(id: string) {
    const store = await this.findOne(id);
    store.isActive = false;
    await this.storeRepo.save(store);
    return { success: true, message: `Store '${store.name}' deactivated successfully` };
  }

  /**
   * Identifies nearby stores based on customer latitude/longitude and city/state
   */
  async findNearby(
    lat?: number,
    lng?: number,
    city?: string,
    state?: string,
  ): Promise<StoreWithDistance[]> {
    const stores = await this.findAll(true);

    const hasCoords = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng);
    const normalizedCity = city?.trim().toLowerCase();
    const normalizedState = state?.trim().toLowerCase();

    const ranked: StoreWithDistance[] = stores.map((s) => {
      const storeWithDist: StoreWithDistance = { ...s };

      if (hasCoords && s.latitude && s.longitude) {
        storeWithDist.distanceKm = this.calculateHaversineDistance(
          lat,
          lng,
          Number(s.latitude),
          Number(s.longitude),
        );
        storeWithDist.matchType = 'COORDINATE_DISTANCE';
      } else if (normalizedCity && s.city.toLowerCase() === normalizedCity) {
        storeWithDist.distanceKm = 5.0; // Same city baseline
        storeWithDist.matchType = 'CITY_MATCH';
      } else if (normalizedState && s.state.toLowerCase() === normalizedState) {
        storeWithDist.distanceKm = 45.0; // Same state baseline
        storeWithDist.matchType = 'STATE_MATCH';
      } else {
        storeWithDist.distanceKm = 250.0;
        storeWithDist.matchType = 'REGIONAL';
      }

      return storeWithDist;
    });

    // Sort by proximity ascending
    ranked.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

    return ranked;
  }

  /**
   * Haversine formula for calculating geodesic distance in kilometers
   */
  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Seeds realistic network stores if table is empty
   */
  async seedDefaultStoresIfEmpty() {
    const count = await this.storeRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding initial network store locations...');
    const defaults: Partial<Store>[] = [
      {
        name: 'Vijayawada Medical & Jewellery Flagship',
        code: 'STR-VIJ-01',
        city: 'Vijayawada',
        state: 'Andhra Pradesh',
        address: 'MG Road, Governorpet, Opposite City Square',
        phone: '+91 866 247 1100',
        email: 'vijayawada@jewellery.com',
        latitude: 16.506174,
        longitude: 80.648015,
        isActive: true,
      },
      {
        name: 'Guntur Regional Showroom',
        code: 'STR-GUN-01',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        address: 'Arundelpet 4th Line, Main Commercial Arcade',
        phone: '+91 863 222 3456',
        email: 'guntur@jewellery.com',
        latitude: 16.306652,
        longitude: 80.43654,
        isActive: true,
      },
      {
        name: 'Hyderabad Royal Heritage Boutique',
        code: 'STR-HYD-01',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Road No. 36, Jubilee Hills, Near Metro Station',
        phone: '+91 40 2355 8899',
        email: 'hyderabad@jewellery.com',
        latitude: 17.4319,
        longitude: 78.4073,
        isActive: true,
      },
      {
        name: 'Bangalore Luxury Gallery',
        code: 'STR-BLR-01',
        city: 'Bangalore',
        state: 'Karnataka',
        address: 'Vittal Mallya Road, Near UB City Mall',
        phone: '+91 80 4112 7700',
        email: 'bangalore@jewellery.com',
        latitude: 12.9716,
        longitude: 77.5946,
        isActive: true,
      },
      {
        name: 'Chennai Heritage Hall',
        code: 'STR-MAA-01',
        city: 'Chennai',
        state: 'Tamil Nadu',
        address: 'Khader Nawaz Khan Road, Nungambakkam',
        phone: '+91 44 2833 4455',
        email: 'chennai@jewellery.com',
        latitude: 13.0604,
        longitude: 80.2496,
        isActive: true,
      },
      {
        name: 'Mumbai Diamond Hub',
        code: 'STR-BOM-01',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Bandra West, Waterfield Road',
        phone: '+91 22 2640 1234',
        email: 'mumbai@jewellery.com',
        latitude: 19.0596,
        longitude: 72.8295,
        isActive: true,
      },
      {
        name: 'Delhi Sovereign Emporium',
        code: 'STR-DEL-01',
        city: 'Delhi',
        state: 'Delhi',
        address: 'South Extension Part II, Ring Road',
        phone: '+91 11 4164 5566',
        email: 'delhi@jewellery.com',
        latitude: 28.5708,
        longitude: 77.2228,
        isActive: true,
      },
    ];

    await this.storeRepo.save(defaults);
    this.logger.log('Successfully seeded 7 benchmark network stores.');
  }
}
