/**
 * Zone Service
 * Frontend service for restaurant zone management operations
 */

import api from './api';
import { API_ROUTES } from '@/lib/constants';
import { ZoneDto, CreateZoneDto, UpdateZoneDto } from '@/types/api.types';

/**
 * Zone Service
 * Handles all zone-related API operations
 */
class ZoneService {
  /**
   * Get all zones
   */
  async getZones(): Promise<ZoneDto[]> {
    const response = await api.get<ZoneDto[]>(API_ROUTES.ZONES.BASE);
    return response.data;
  }

  /**
   * Get zone by ID
   */
  async getZoneById(id: number): Promise<ZoneDto> {
    const response = await api.get<ZoneDto>(API_ROUTES.ZONES.BY_ID(id));
    return response.data;
  }

  /**
   * Create a new zone
   */
  async createZone(zone: CreateZoneDto): Promise<ZoneDto> {
    const response = await api.post<ZoneDto>(API_ROUTES.ZONES.BASE, zone);
    return response.data;
  }

  /**
   * Update an existing zone
   */
  async updateZone(id: number, zone: UpdateZoneDto): Promise<ZoneDto> {
    const response = await api.put<ZoneDto>(API_ROUTES.ZONES.BY_ID(id), zone);
    return response.data;
  }

  /**
   * Delete a zone (soft delete)
   */
  async deleteZone(id: number): Promise<void> {
    await api.delete(API_ROUTES.ZONES.BY_ID(id));
  }
}

// Export singleton instance
const zoneService = new ZoneService();
export default zoneService;
