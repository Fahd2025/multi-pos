using Backend.Models.DTOs.Branch.DeliveryOrders;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.DeliveryOrders;

public interface IDeliveryOrderService
{
    Task<DeliveryOrderDto?> GetDeliveryOrderByIdAsync(Guid id, string branchCode);
    Task<IEnumerable<DeliveryOrderDto>> GetAllDeliveryOrdersAsync(string branchCode, 
        DeliveryStatus? status = null, Guid? driverId = null, Guid? orderId = null, int page = 1, int pageSize = 20);
    Task<DeliveryOrderDto> CreateDeliveryOrderAsync(CreateDeliveryOrderDto createDeliveryOrderDto, Guid createdById, string branchCode);
    Task<DeliveryOrderDto?> UpdateDeliveryOrderAsync(Guid id, UpdateDeliveryOrderDto updateDeliveryOrderDto, string branchCode);
    Task<bool> DeleteDeliveryOrderAsync(Guid id, string branchCode);
    Task<DeliveryOrderDto?> AssignDriverToDeliveryOrderAsync(Guid deliveryOrderId, Guid driverId, string branchCode);
    Task<DeliveryOrderDto?> UpdateDeliveryStatusAsync(Guid deliveryOrderId, DeliveryStatus newStatus, string branchCode);
}