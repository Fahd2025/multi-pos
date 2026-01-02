using Backend.Models.DTOs.Branch.DeliveryOrders;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.DeliveryOrders;

public interface IDeliveryOrderService
{
    // Basic CRUD operations
    Task<DeliveryOrderDto?> GetDeliveryOrderByIdAsync(Guid id, string branchCode);
    Task<IEnumerable<DeliveryOrderDto>> GetAllDeliveryOrdersAsync(string branchCode,
        DeliveryStatus? status = null, Guid? driverId = null, Guid? orderId = null, int page = 1, int pageSize = 20);
    Task<DeliveryOrderDto> CreateDeliveryOrderAsync(CreateDeliveryOrderDto createDeliveryOrderDto, Guid createdById, string branchCode);
    Task<DeliveryOrderDto?> UpdateDeliveryOrderAsync(Guid id, UpdateDeliveryOrderDto updateDeliveryOrderDto, string branchCode);
    Task<bool> DeleteDeliveryOrderAsync(Guid id, string branchCode);

    // Driver assignment (legacy)
    Task<DeliveryOrderDto?> AssignDriverToDeliveryOrderAsync(Guid deliveryOrderId, Guid driverId, string branchCode);
    Task<DeliveryOrderDto?> UpdateDeliveryStatusAsync(Guid deliveryOrderId, DeliveryStatus newStatus, string branchCode);

    // Dispatch operations (new)
    Task<IEnumerable<DeliveryOrderDto>> GetUnassignedDeliveriesAsync(string branchCode);
    Task<IEnumerable<DeliveryOrderDto>> GetActiveDeliveriesByDriverAsync(Guid driverId, string branchCode);
    Task<DeliveryOrderDto> AssignDriverAsync(Guid deliveryOrderId, Guid driverId, Guid userId, string branchCode);
    Task<DeliveryOrderDto> UnassignDriverAsync(Guid deliveryOrderId, string reason, Guid userId, string branchCode);
}